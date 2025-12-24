import { useState, useEffect, useCallback, useRef } from 'react';
import { POLL_INTERVAL_MS } from '../utils/constants';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '../services/cache';

const ALERTS_API_URL = '/api/alerts';

export default function useAlerts() {
  const [alerts, setAlerts] = useState(() => {
    // Initialize from cache
    const cached = getCache(CACHE_KEYS.ALERTS);
    return cached?.alerts || [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const cached = getCache(CACHE_KEYS.ALERTS);
    return cached?.timestamp ? new Date(cached.timestamp) : null;
  });
  const intervalRef = useRef(null);

  const fetchAlerts = useCallback(async (skipCache = false) => {
    try {
      // Check cache first (unless forced refresh)
      if (!skipCache) {
        const cached = getCache(CACHE_KEYS.ALERTS);
        if (cached) {
          setAlerts(cached.alerts || []);
          setLastUpdated(new Date(cached.timestamp));
          setLoading(false);
          return;
        }
      }

      const response = await fetch(ALERTS_API_URL);

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.status}`);
      }

      const data = await response.json();
      const newAlerts = data.alerts || [];

      // Update state
      setAlerts(newAlerts);
      setLastUpdated(new Date(data.timestamp));
      setError(null);

      // Cache the response
      setCache(CACHE_KEYS.ALERTS, {
        alerts: newAlerts,
        timestamp: data.timestamp
      }, CACHE_TTL.ALERTS);

    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);

      // On error, try to use cached data
      const cached = getCache(CACHE_KEYS.ALERTS);
      if (cached) {
        setAlerts(cached.alerts || []);
        setLastUpdated(new Date(cached.timestamp));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    // Check if we have valid cache first
    const cached = getCache(CACHE_KEYS.ALERTS);
    if (cached) {
      setAlerts(cached.alerts || []);
      setLastUpdated(new Date(cached.timestamp));
      setLoading(false);
    } else {
      fetchAlerts(true);
    }

    // Set up polling interval (always fetch fresh)
    intervalRef.current = setInterval(() => fetchAlerts(true), POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAlerts]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    fetchAlerts(true);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    lastUpdated,
    refresh,
    alertCount: alerts.length
  };
}
