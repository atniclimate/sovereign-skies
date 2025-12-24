import { useState, useEffect, useCallback } from 'react';
import { clearAllCache } from '../services/cache';

// Simulated loading stages for the loading ritual
const LOADING_STAGES = [
  { key: 'init', weight: 10, message: 'Initializing...' },
  { key: 'weather', weight: 30, message: 'Connecting to weather services...' },
  { key: 'tribal', weight: 25, message: 'Loading Tribal boundaries...' },
  { key: 'alerts', weight: 20, message: 'Fetching active alerts...' },
  { key: 'rivers', weight: 10, message: 'Checking river conditions...' },
  { key: 'complete', weight: 5, message: 'Ready!' }
];

export default function useAppState() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_STAGES[0].message);
  const [error] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial loading ritual
  useEffect(() => {
    let cancelled = false;

    const runLoadingRitual = async () => {
      let totalWeight = 0;
      const totalWeightSum = LOADING_STAGES.reduce((sum, s) => sum + s.weight, 0);

      for (const stage of LOADING_STAGES) {
        if (cancelled) break;

        setLoadingMessage(stage.message);

        // Simulate stage completion with slight randomization
        const duration = 200 + Math.random() * 300;
        await new Promise(resolve => setTimeout(resolve, duration));

        totalWeight += stage.weight;
        setLoadingProgress((totalWeight / totalWeightSum) * 100);
      }

      if (!cancelled) {
        // Small delay before hiding loader
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsLoading(false);
      }
    };

    runLoadingRitual();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Clear cache and reload
  const handleClearCache = useCallback(() => {
    clearAllCache();
    window.location.reload();
  }, []);

  // Handle refresh (can be extended for specific data refresh)
  const handleRefresh = useCallback(() => {
    // This will trigger data hooks to refetch
    // For now, we just set a loading indicator
    setLoadingMessage('Refreshing...');
  }, []);

  return {
    isOnline,
    isLoading,
    loadingProgress,
    loadingMessage,
    error,
    activeTab,
    setActiveTab: handleTabChange,
    clearCache: handleClearCache,
    refresh: handleRefresh
  };
}
