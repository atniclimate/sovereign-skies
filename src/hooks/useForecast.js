import { useState, useEffect, useCallback, useRef } from 'react';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '../services/cache';

// NWS API endpoints
const NWS_POINTS_URL = 'https://api.weather.gov/points';

// Default locations for PNW tribal regions
const DEFAULT_LOCATIONS = [
  { id: 'seattle', name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
  { id: 'portland', name: 'Portland, OR', lat: 45.5152, lon: -122.6784 },
  { id: 'spokane', name: 'Spokane, WA', lat: 47.6588, lon: -117.4260 },
  { id: 'bellingham', name: 'Bellingham, WA', lat: 48.7519, lon: -122.4787 },
  { id: 'olympia', name: 'Olympia, WA', lat: 47.0379, lon: -122.9007 }
];

// Polling interval (15 minutes for forecast data)
const FORECAST_POLL_MS = 15 * 60 * 1000;

// Cache key
const FORECAST_CACHE_KEY = 'tribal_forecast_data';

/**
 * Fetch forecast for a single location
 */
async function fetchLocationForecast(lat, lon) {
  try {
    // Step 1: Get the grid point for this location
    const pointsResponse = await fetch(`${NWS_POINTS_URL}/${lat},${lon}`, {
      headers: { 'Accept': 'application/geo+json' }
    });

    if (!pointsResponse.ok) {
      throw new Error(`Points API failed: ${pointsResponse.status}`);
    }

    const pointsData = await pointsResponse.json();
    const forecastUrl = pointsData.properties?.forecast;
    const forecastHourlyUrl = pointsData.properties?.forecastHourly;
    const gridId = pointsData.properties?.gridId;
    const gridX = pointsData.properties?.gridX;
    const gridY = pointsData.properties?.gridY;
    const city = pointsData.properties?.relativeLocation?.properties?.city;
    const state = pointsData.properties?.relativeLocation?.properties?.state;

    if (!forecastUrl) {
      throw new Error('No forecast URL in response');
    }

    // Step 2: Get the 7-day forecast
    const forecastResponse = await fetch(forecastUrl, {
      headers: { 'Accept': 'application/geo+json' }
    });

    if (!forecastResponse.ok) {
      throw new Error(`Forecast API failed: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();
    const periods = forecastData.properties?.periods || [];

    return {
      gridId,
      gridX,
      gridY,
      city: city || 'Unknown',
      state: state || '',
      forecastUrl,
      forecastHourlyUrl,
      generatedAt: forecastData.properties?.generatedAt,
      updateTime: forecastData.properties?.updateTime,
      periods: periods.map(period => ({
        number: period.number,
        name: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
        isDaytime: period.isDaytime,
        temperature: period.temperature,
        temperatureUnit: period.temperatureUnit,
        temperatureTrend: period.temperatureTrend,
        windSpeed: period.windSpeed,
        windDirection: period.windDirection,
        icon: period.icon,
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast
      }))
    };
  } catch (err) {
    console.warn(`Error fetching forecast for ${lat},${lon}:`, err);
    return null;
  }
}

/**
 * Hook for fetching NWS forecasts for multiple locations
 */
export default function useForecast(locations = DEFAULT_LOCATIONS) {
  const [forecasts, setForecasts] = useState(() => {
    const cached = getCache(FORECAST_CACHE_KEY);
    return cached?.forecasts || {};
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const cached = getCache(FORECAST_CACHE_KEY);
    return cached?.timestamp ? new Date(cached.timestamp) : null;
  });
  const intervalRef = useRef(null);

  const fetchAllForecasts = useCallback(async (skipCache = false) => {
    try {
      // Check cache first
      if (!skipCache) {
        const cached = getCache(FORECAST_CACHE_KEY);
        if (cached) {
          setForecasts(cached.forecasts || {});
          setLastUpdated(new Date(cached.timestamp));
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      // Fetch all locations in parallel
      const results = await Promise.all(
        locations.map(async (loc) => {
          const forecast = await fetchLocationForecast(loc.lat, loc.lon);
          return { id: loc.id, name: loc.name, ...loc, forecast };
        })
      );

      // Build forecasts map
      const forecastsMap = {};
      results.forEach(result => {
        if (result.forecast) {
          forecastsMap[result.id] = result;
        }
      });

      const timestamp = new Date().toISOString();

      setForecasts(forecastsMap);
      setLastUpdated(new Date(timestamp));
      setError(null);

      // Cache the results
      setCache(FORECAST_CACHE_KEY, {
        forecasts: forecastsMap,
        timestamp
      }, FORECAST_POLL_MS);

    } catch (err) {
      console.error('Error fetching forecasts:', err);
      setError(err.message);

      // Fall back to cache
      const cached = getCache(FORECAST_CACHE_KEY);
      if (cached) {
        setForecasts(cached.forecasts || {});
        setLastUpdated(new Date(cached.timestamp));
      }
    } finally {
      setLoading(false);
    }
  }, [locations]);

  useEffect(() => {
    // Initial fetch
    const cached = getCache(FORECAST_CACHE_KEY);
    if (cached) {
      setForecasts(cached.forecasts || {});
      setLastUpdated(new Date(cached.timestamp));
      setLoading(false);
    } else {
      fetchAllForecasts(true);
    }

    // Set up polling
    intervalRef.current = setInterval(() => fetchAllForecasts(true), FORECAST_POLL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllForecasts]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchAllForecasts(true);
  }, [fetchAllForecasts]);

  // Get forecast list as array
  const forecastList = Object.values(forecasts);

  return {
    forecasts,
    forecastList,
    loading,
    error,
    lastUpdated,
    refresh,
    locations
  };
}

// Export default locations for use in components
export { DEFAULT_LOCATIONS };
