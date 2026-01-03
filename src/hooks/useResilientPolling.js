/**
 * Resilient Polling Hook
 *
 * Provides polling with exponential backoff on failures.
 * Essential for emergency alert systems that need continuous data updates
 * while gracefully handling API instability.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import createLogger from '@utils/logger';

const logger = createLogger('Polling');

/**
 * Hook for resilient polling with exponential backoff on failures.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Configurable base interval
 * - Manual refresh capability
 * - Success/error callbacks
 * - Backoff reset on manual refresh
 *
 * @param {Function} fetchFn - Async function to call
 * @param {Object} options - Configuration options
 * @returns {Object} Polling state and controls
 */
export function useResilientPolling(fetchFn, options = {}) {
  const {
    interval = 30000,           // Base polling interval (ms)
    maxBackoff = 8,             // Maximum backoff multiplier (2^8 = 256x)
    enabled = true,             // Enable/disable polling
    immediate = true,           // Fetch immediately on mount
    context = 'Polling',        // Logging context
    onSuccess = null,           // Success callback
    onError = null,             // Error callback
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Use refs for values that shouldn't trigger re-renders
  const consecutiveFailures = useRef(0);
  const backoffMultiplier = useRef(1);
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);

  /**
   * Calculate the next polling interval based on backoff.
   */
  const getNextInterval = useCallback(() => {
    return interval * backoffMultiplier.current;
  }, [interval]);

  /**
   * Handle successful fetch.
   */
  const handleSuccess = useCallback((result) => {
    const wasBackingOff = backoffMultiplier.current > 1;

    consecutiveFailures.current = 0;
    backoffMultiplier.current = 1;

    if (isMounted.current) {
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    }

    onSuccess?.(result);

    if (wasBackingOff) {
      logger.info('Polling recovered after failures', { context });
    }
  }, [context, onSuccess]);

  /**
   * Handle failed fetch.
   */
  const handleFailure = useCallback((err) => {
    consecutiveFailures.current++;
    backoffMultiplier.current = Math.min(
      Math.pow(2, consecutiveFailures.current),
      maxBackoff
    );

    if (isMounted.current) {
      setError(err);
    }

    onError?.(err);

    logger.warn(`Polling failed (${consecutiveFailures.current} consecutive)`, {
      context,
      nextRetryMs: getNextInterval(),
      error: err.message
    });
  }, [context, maxBackoff, onError, getNextInterval]);

  /**
   * Execute the fetch function.
   */
  const executeFetch = useCallback(async () => {
    if (!enabled || !isMounted.current) return;

    setIsLoading(true);

    try {
      const result = await fetchFn();
      handleSuccess(result);
    } catch (err) {
      handleFailure(err);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, fetchFn, handleSuccess, handleFailure]);

  /**
   * Schedule the next poll.
   */
  const scheduleNext = useCallback(() => {
    if (!enabled || !isMounted.current) return;

    const nextInterval = getNextInterval();

    timeoutRef.current = setTimeout(() => {
      executeFetch().then(() => {
        scheduleNext();
      });
    }, nextInterval);
  }, [enabled, getNextInterval, executeFetch]);

  /**
   * Manual refresh function.
   * Clears pending timeout and fetches immediately.
   */
  const refresh = useCallback(async () => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    await executeFetch();
    scheduleNext();
  }, [executeFetch, scheduleNext]);

  /**
   * Reset backoff to base interval.
   * Useful when user explicitly refreshes.
   */
  const resetBackoff = useCallback(() => {
    consecutiveFailures.current = 0;
    backoffMultiplier.current = 1;
    logger.debug('Backoff reset', { context });
  }, [context]);

  /**
   * Force refresh with backoff reset.
   * Use when user explicitly requests refresh.
   */
  const forceRefresh = useCallback(async () => {
    resetBackoff();
    await refresh();
  }, [resetBackoff, refresh]);

  // Start polling on mount
  useEffect(() => {
    isMounted.current = true;

    if (enabled) {
      if (immediate) {
        executeFetch().then(() => {
          scheduleNext();
        });
      } else {
        scheduleNext();
      }
    }

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, immediate, executeFetch, scheduleNext]);

  return {
    // Data state
    data,
    error,
    isLoading,
    lastUpdated,

    // Actions
    refresh,
    forceRefresh,
    resetBackoff,

    // Debugging/UI state
    consecutiveFailures: consecutiveFailures.current,
    currentInterval: getNextInterval(),
    isBackingOff: backoffMultiplier.current > 1
  };
}

export default useResilientPolling;
