import { useState, useEffect, useCallback, useRef } from 'react';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '../services/cache';
import { marineLogger as logger } from '../utils/logger';
import {
  NDBC_REALTIME_URL,
  COOPS_API_URL,
  PNW_BUOYS,
  PNW_TIDE_STATIONS,
  MARINE_THRESHOLDS,
  MARINE_POLL_INTERVAL_MS
} from '../utils/constants';

/**
 * Parse NDBC real-time text file format
 * Format: space-separated values with header rows
 * First row: column names, Second row: units
 */
function parseNDBCData(text, stationInfo) {
  const lines = text.trim().split('\n');
  if (lines.length < 3) return null;

  // Parse header for column indices
  const headers = lines[0].replace(/^#/, '').trim().split(/\s+/);
  const units = lines[1].replace(/^#/, '').trim().split(/\s+/);

  // Get latest observation (third line)
  const values = lines[2].trim().split(/\s+/);

  // Build column map
  const data = {};
  headers.forEach((header, idx) => {
    const value = values[idx];
    // NDBC uses 'MM' for missing data
    data[header] = value === 'MM' ? null : parseFloat(value);
  });

  // Construct observation object
  const obs = {
    id: stationInfo.id,
    name: stationInfo.name,
    lat: stationInfo.lat,
    lon: stationInfo.lon,
    timestamp: new Date(
      data.YY || data['#YY'],
      (data.MM || 1) - 1,
      data.DD || 1,
      data.hh || 0,
      data.mm || 0
    ).toISOString(),
    // Wind
    windDirection: data.WDIR,    // degrees
    windSpeed: data.WSPD,        // m/s
    windGust: data.GST,          // m/s
    // Waves
    waveHeight: data.WVHT,       // meters (significant wave height)
    wavePeriod: data.DPD,        // seconds (dominant period)
    waveDirection: data.MWD,     // degrees
    // Atmosphere
    pressure: data.PRES,         // hPa
    airTemp: data.ATMP,          // Celsius
    waterTemp: data.WTMP,        // Celsius
    dewpoint: data.DEWP,         // Celsius
    visibility: data.VIS         // nautical miles
  };

  // Calculate hazard flags
  obs.hazards = [];
  if (obs.waveHeight && obs.waveHeight >= MARINE_THRESHOLDS.HIGH_SURF) {
    obs.hazards.push('HIGH_SURF');
  }
  if (obs.windSpeed && obs.windSpeed >= MARINE_THRESHOLDS.STORM_WIND) {
    obs.hazards.push('STORM_WIND');
  } else if (obs.windSpeed && obs.windSpeed >= MARINE_THRESHOLDS.GALE_WIND) {
    obs.hazards.push('GALE_WIND');
  }

  return obs;
}

/**
 * Fetch buoy data from NDBC
 */
async function fetchBuoyData(station) {
  try {
    const url = `${NDBC_REALTIME_URL}/${station.id}.txt`;
    const response = await fetch(url);

    if (!response.ok) {
      logger.warn(`NDBC station unavailable`, { id: station.id, status: response.status });
      return null;
    }

    const text = await response.text();
    return parseNDBCData(text, station);
  } catch (err) {
    logger.warn(`Error fetching buoy`, { id: station.id, error: err.message });
    return null;
  }
}

/**
 * Fetch tide predictions from CO-OPS
 */
async function fetchTidePredictions(station) {
  try {
    // Get predictions for next 48 hours
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const params = new URLSearchParams({
      begin_date: formatDate(now),
      end_date: formatDate(end),
      station: station.id,
      product: 'predictions',
      datum: 'MLLW',
      time_zone: 'lst_ldt',
      interval: 'hilo',
      units: 'english',
      format: 'json'
    });

    const response = await fetch(`${COOPS_API_URL}?${params}`);

    if (!response.ok) {
      logger.warn(`CO-OPS station unavailable`, { id: station.id, status: response.status });
      return null;
    }

    const data = await response.json();

    if (data.error) {
      logger.warn(`CO-OPS API error`, { id: station.id, error: data.error.message });
      return null;
    }

    // Parse predictions
    const predictions = (data.predictions || []).map(p => ({
      time: p.t,
      height: parseFloat(p.v),
      type: p.type === 'H' ? 'high' : 'low'
    }));

    // Find next high and low
    const nextHigh = predictions.find(p => p.type === 'high');
    const nextLow = predictions.find(p => p.type === 'low');

    return {
      id: station.id,
      name: station.name,
      lat: station.lat,
      lon: station.lon,
      predictions,
      nextHigh,
      nextLow,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    logger.warn(`Error fetching tides`, { id: station.id, error: err.message });
    return null;
  }
}

/**
 * Fetch current water level and compare to predictions for storm surge detection
 */
async function fetchWaterLevel(station) {
  try {
    const now = new Date();
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const params = new URLSearchParams({
      begin_date: formatDate(now),
      end_date: formatDate(now),
      station: station.id,
      product: 'water_level',
      datum: 'MLLW',
      time_zone: 'gmt',
      units: 'metric',
      format: 'json'
    });

    const response = await fetch(`${COOPS_API_URL}?${params}`);

    if (!response.ok) return null;

    const data = await response.json();

    if (data.error || !data.data?.length) return null;

    // Get most recent observation
    const latest = data.data[data.data.length - 1];

    return {
      stationId: station.id,
      level: parseFloat(latest.v),
      time: latest.t,
      quality: latest.q
    };
  } catch (err) {
    return null;
  }
}

/**
 * Hook for marine conditions monitoring
 * Fetches buoy observations and tide predictions for PNW coastal stations
 */
export default function useMarineConditions(enabled = true) {
  const [buoys, setBuoys] = useState(() => {
    const cached = getCache(CACHE_KEYS.MARINE_BUOYS);
    return cached?.buoys || [];
  });
  const [tides, setTides] = useState(() => {
    const cached = getCache(CACHE_KEYS.MARINE_TIDES);
    return cached?.tides || [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchMarineData = useCallback(async (skipCache = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      // Check caches first
      if (!skipCache) {
        const cachedBuoys = getCache(CACHE_KEYS.MARINE_BUOYS);
        const cachedTides = getCache(CACHE_KEYS.MARINE_TIDES);

        if (cachedBuoys && cachedTides) {
          setBuoys(cachedBuoys.buoys || []);
          setTides(cachedTides.tides || []);
          setLastUpdated(new Date(cachedBuoys.timestamp));
          setLoading(false);
          return;
        }
      }

      setLoading(true);

      // Fetch buoy data in parallel
      const buoyResults = await Promise.all(
        PNW_BUOYS.map(fetchBuoyData)
      );
      const validBuoys = buoyResults.filter(Boolean);

      // Fetch tide predictions in parallel
      const tideResults = await Promise.all(
        PNW_TIDE_STATIONS.map(fetchTidePredictions)
      );
      const validTides = tideResults.filter(Boolean);

      const timestamp = new Date().toISOString();

      setBuoys(validBuoys);
      setTides(validTides);
      setLastUpdated(new Date(timestamp));
      setError(null);

      // Cache results
      setCache(CACHE_KEYS.MARINE_BUOYS, {
        buoys: validBuoys,
        timestamp
      }, CACHE_TTL.MARINE_BUOYS);

      setCache(CACHE_KEYS.MARINE_TIDES, {
        tides: validTides,
        timestamp
      }, CACHE_TTL.MARINE_TIDES);

    } catch (err) {
      logger.error('Error fetching marine data', err);
      setError(err.message);

      // Fall back to cache
      const cachedBuoys = getCache(CACHE_KEYS.MARINE_BUOYS);
      const cachedTides = getCache(CACHE_KEYS.MARINE_TIDES);

      if (cachedBuoys) {
        setBuoys(cachedBuoys.buoys || []);
        setLastUpdated(new Date(cachedBuoys.timestamp));
      }
      if (cachedTides) {
        setTides(cachedTides.tides || []);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Initial load
    const cachedBuoys = getCache(CACHE_KEYS.MARINE_BUOYS);
    const cachedTides = getCache(CACHE_KEYS.MARINE_TIDES);

    if (cachedBuoys && cachedTides) {
      setBuoys(cachedBuoys.buoys || []);
      setTides(cachedTides.tides || []);
      setLastUpdated(new Date(cachedBuoys.timestamp));
      setLoading(false);
    } else {
      fetchMarineData(true);
    }

    // Set up polling
    intervalRef.current = setInterval(
      () => fetchMarineData(true),
      MARINE_POLL_INTERVAL_MS
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, fetchMarineData]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchMarineData(true);
  }, [fetchMarineData]);

  // Compute summary statistics
  const summary = {
    totalBuoys: buoys.length,
    totalTideStations: tides.length,
    highSurfCount: buoys.filter(b => b.hazards?.includes('HIGH_SURF')).length,
    galeWindCount: buoys.filter(b =>
      b.hazards?.includes('GALE_WIND') || b.hazards?.includes('STORM_WIND')
    ).length,
    hazardousBuoys: buoys.filter(b => b.hazards?.length > 0)
  };

  // Get buoys with any hazard
  const hazardousBuoys = buoys.filter(b => b.hazards?.length > 0);

  return {
    buoys,
    tides,
    hazardousBuoys,
    summary,
    loading,
    error,
    lastUpdated,
    refresh
  };
}
