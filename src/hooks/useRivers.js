import { useState, useEffect, useCallback, useRef } from 'react';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '../services/cache';

const RIVERS_API_URL = '/api/rivers';
const NWPS_DIRECT_URL = 'https://api.water.noaa.gov/nwps/v1/gauges';
const PNW_STATES = ['WA', 'OR', 'ID'];
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Flood category priority
const FLOOD_PRIORITY = {
  major: 0,
  moderate: 1,
  minor: 2,
  action: 3,
  low_threshold: 4,
  no_flooding: 5
};

// Transform NWPS API response (for direct API fallback)
function transformNWPSResponse(gauges) {
  return gauges
    .filter(g => g.latitude && g.longitude && PNW_STATES.includes(g.state?.abbreviation))
    .map(g => ({
      id: g.lid,
      name: g.name,
      state: g.state?.abbreviation,
      lat: g.latitude,
      lng: g.longitude,
      observed: {
        level: g.status?.observed?.primary,
        unit: g.status?.observed?.primaryUnit,
        flow: g.status?.observed?.secondary,
        flowUnit: g.status?.observed?.secondaryUnit,
        floodCategory: g.status?.observed?.floodCategory || 'not_defined',
        validTime: g.status?.observed?.validTime
      },
      forecast: {
        level: g.status?.forecast?.primary,
        floodCategory: g.status?.forecast?.floodCategory || 'not_defined'
      },
      wfo: g.wfo?.abbreviation
    }))
    .sort((a, b) => {
      const aPri = FLOOD_PRIORITY[a.observed.floodCategory] ?? 99;
      const bPri = FLOOD_PRIORITY[b.observed.floodCategory] ?? 99;
      return aPri - bPri;
    });
}

export default function useRivers() {
  const [gauges, setGauges] = useState(() => {
    const cached = getCache(CACHE_KEYS.RIVERS);
    return cached?.gauges || [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ total: 0, flooding: 0, action: 0, normal: 0 });
  const intervalRef = useRef(null);

  const fetchRivers = useCallback(async (skipCache = false) => {
    try {
      if (!skipCache) {
        const cached = getCache(CACHE_KEYS.RIVERS);
        if (cached) {
          setGauges(cached.gauges || []);
          setSummary(cached.summary || {});
          setLoading(false);
          return;
        }
      }

      let data;

      // Try proxy first
      try {
        const response = await fetch(RIVERS_API_URL);
        if (!response.ok) throw new Error('Proxy failed');
        data = await response.json();
      } catch {
        // Fall back to direct NWPS API
        const stateGauges = await Promise.all(
          PNW_STATES.map(async (state) => {
            try {
              const res = await fetch(`${NWPS_DIRECT_URL}?state=${state}`);
              if (!res.ok) return [];
              const d = await res.json();
              return d.gauges || [];
            } catch {
              return [];
            }
          })
        );
        const allGauges = transformNWPSResponse(stateGauges.flat());
        const flooding = allGauges.filter(g => ['major', 'moderate', 'minor'].includes(g.observed.floodCategory)).length;
        const action = allGauges.filter(g => g.observed.floodCategory === 'action').length;

        data = {
          gauges: allGauges,
          summary: {
            total: allGauges.length,
            flooding,
            action,
            normal: allGauges.filter(g => g.observed.floodCategory === 'no_flooding').length
          },
          timestamp: new Date().toISOString()
        };
      }

      setGauges(data.gauges || []);
      setSummary(data.summary || {});
      setError(null);

      setCache(CACHE_KEYS.RIVERS, data, CACHE_TTL.RIVERS || 300000);

    } catch (err) {
      console.error('Error fetching river data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCache(CACHE_KEYS.RIVERS);
    if (cached) {
      setGauges(cached.gauges || []);
      setSummary(cached.summary || {});
      setLoading(false);
    } else {
      fetchRivers(true);
    }

    intervalRef.current = setInterval(() => fetchRivers(true), POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchRivers]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchRivers(true);
  }, [fetchRivers]);

  // Filter gauges with flooding/action status
  const floodingGauges = gauges.filter(g =>
    ['major', 'moderate', 'minor', 'action'].includes(g.observed.floodCategory)
  );

  return {
    gauges,
    floodingGauges,
    summary,
    loading,
    error,
    refresh
  };
}
