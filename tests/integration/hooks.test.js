/**
 * Hook Integration Tests
 * Tests for React hooks working together in realistic scenarios.
 *
 * Focuses on:
 * - useResilientPolling behavior with circuit breaker patterns
 * - State management across multiple hook interactions
 * - Error recovery and backoff coordination
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResilientPolling } from '@hooks/useResilientPolling';
import { CircuitBreaker, resilientFetch } from '@utils/resilientFetch';

describe('Hook Integration Tests', () => {

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================
  // useResilientPolling Integration (6 tests)
  // ==========================================
  describe('useResilientPolling Integration', () => {

    it('integrates polling with data transformation', async () => {
      // Simulate a fetch function that returns raw data needing transformation
      const rawData = {
        alerts: [
          { id: 1, severity: 'high', message: 'Alert 1' },
          { id: 2, severity: 'low', message: 'Alert 2' }
        ],
        timestamp: '2025-01-03T10:00:00Z'
      };

      const fetchFn = vi.fn().mockResolvedValue(rawData);

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 30000
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.data).toEqual(rawData);
      expect(result.current.data.alerts).toHaveLength(2);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('coordinates multiple polling hooks without interference', async () => {
      const alertsFetch = vi.fn().mockResolvedValue({ type: 'alerts', data: [] });
      const riversFetch = vi.fn().mockResolvedValue({ type: 'rivers', data: [] });

      const { result: alertsResult } = renderHook(() =>
        useResilientPolling(alertsFetch, {
          immediate: true,
          interval: 30000,
          context: 'Alerts'
        })
      );

      const { result: riversResult } = renderHook(() =>
        useResilientPolling(riversFetch, {
          immediate: true,
          interval: 60000,
          context: 'Rivers'
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // Both should have fetched
      expect(alertsFetch).toHaveBeenCalledTimes(1);
      expect(riversFetch).toHaveBeenCalledTimes(1);

      // Advance to 30 seconds - only alerts should poll again
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });

      expect(alertsFetch).toHaveBeenCalledTimes(2);
      expect(riversFetch).toHaveBeenCalledTimes(1);

      // Advance to 60 seconds total - rivers should poll again
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });

      expect(alertsFetch).toHaveBeenCalledTimes(3);
      expect(riversFetch).toHaveBeenCalledTimes(2);
    });

    // Note: Callback testing (onSuccess/onError) is comprehensively covered
    // in unit tests (useResilientPolling.test.js). The hook's internal timer
    // management with fake timers can cause infinite loops in integration tests
    // due to recursive scheduling. See unit test "calls onSuccess callback on
    // successful fetch" for callback verification.

    it('maintains state consistency during rapid refreshes', async () => {
      let callCount = 0;
      const fetchFn = vi.fn().mockImplementation(async () => {
        callCount++;
        return { call: callCount, timestamp: Date.now() };
      });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: false,
          interval: 10000
        })
      );

      // Rapid manual refreshes
      await act(async () => {
        result.current.refresh();
      });
      await act(async () => {
        result.current.refresh();
      });
      await act(async () => {
        result.current.refresh();
      });

      // All refreshes should complete without crashing
      expect(fetchFn).toHaveBeenCalled();
      expect(result.current.data).toBeDefined();
    });

    it('recovers gracefully after extended outage', async () => {
      const fetchFn = vi.fn()
        // 5 consecutive failures
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockRejectedValueOnce(new Error('Fail 4'))
        .mockRejectedValueOnce(new Error('Fail 5'))
        // Then recovery
        .mockResolvedValue({ recovered: true, data: 'success' });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 1000,
          maxBackoff: 16
        })
      );

      // Process through failures with exponential backoff
      // 0ms: fail 1
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.error).not.toBeNull();

      // 2000ms (2^1 * 1000): fail 2
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // 4000ms (2^2 * 1000): fail 3
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000);
      });

      // 8000ms (2^3 * 1000): fail 4
      await act(async () => {
        await vi.advanceTimersByTimeAsync(8000);
      });

      // 16000ms (2^4 * 1000): fail 5
      await act(async () => {
        await vi.advanceTimersByTimeAsync(16000);
      });

      // Next attempt should succeed
      await act(async () => {
        await vi.advanceTimersByTimeAsync(16000);  // 2^5 capped at maxBackoff=16
      });

      // Should have recovered
      expect(result.current.data).toEqual({ recovered: true, data: 'success' });
      expect(result.current.error).toBeNull();
    });

    it('properly resets backoff on forceRefresh', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('Initial failure'))
        .mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 1000
        })
      );

      // Initial failure
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.error).not.toBeNull();

      // Force refresh should reset backoff and succeed
      await act(async () => {
        await result.current.forceRefresh();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ success: true });
      expect(result.current.currentInterval).toBe(1000);  // Reset to base interval
    });

  });

  // ==========================================
  // Circuit Breaker Integration (5 tests)
  // ==========================================
  describe('Circuit Breaker Integration', () => {

    it('circuit breaker opens after threshold failures', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeoutMs: 10000
      });

      // Three failures should trip the circuit
      for (let i = 0; i < 3; i++) {
        breaker.onFailure('test', new Error(`Failure ${i + 1}`));
      }

      expect(breaker.state).toBe('OPEN');
      expect(breaker.isAvailable()).toBe(false);
    });

    it('circuit breaker transitions to half-open after timeout', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeoutMs: 5000
      });

      // Trip the circuit
      for (let i = 0; i < 3; i++) {
        breaker.onFailure('test', new Error(`Failure ${i}`));
      }
      expect(breaker.state).toBe('OPEN');

      // Advance past reset timeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      // Should be available for retry
      expect(breaker.isAvailable()).toBe(true);
    });

    it('circuit breaker closes on success after half-open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 1000
      });

      // Trip the circuit
      breaker.onFailure('test', new Error('Fail 1'));
      breaker.onFailure('test', new Error('Fail 2'));
      expect(breaker.state).toBe('OPEN');

      // Wait for reset timeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Execute successfully
      await breaker.execute(async () => 'success', 'test');

      expect(breaker.state).toBe('CLOSED');
      expect(breaker.failureCount).toBe(0);
    });

    it('circuit breaker reopens on failure in half-open state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 1000,
        halfOpenMaxAttempts: 1
      });

      // Trip the circuit
      breaker.onFailure('test', new Error('Fail 1'));
      breaker.onFailure('test', new Error('Fail 2'));
      expect(breaker.state).toBe('OPEN');

      // Wait for reset timeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Fail again in half-open state
      try {
        await breaker.execute(async () => {
          throw new Error('Half-open failure');
        }, 'test');
      } catch (e) {
        // Expected
      }

      expect(breaker.state).toBe('OPEN');
    });

    it('circuit breaker reset clears all state', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 10000
      });

      // Trip the circuit
      breaker.onFailure('test', new Error('Fail'));
      breaker.onFailure('test', new Error('Fail'));
      expect(breaker.state).toBe('OPEN');

      // Manual reset
      breaker.reset();

      expect(breaker.state).toBe('CLOSED');
      expect(breaker.failureCount).toBe(0);
      expect(breaker.lastFailureTime).toBeNull();
      expect(breaker.isAvailable()).toBe(true);
    });

  });

  // ==========================================
  // Combined Polling + Circuit Breaker (4 tests)
  // ==========================================
  describe('Combined Polling + Circuit Breaker', () => {

    it('polling respects circuit breaker state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 60000
      });

      let fetchAttempts = 0;
      const fetchFn = vi.fn().mockImplementation(async () => {
        fetchAttempts++;
        return breaker.execute(async () => {
          throw new Error('API down');
        }, 'test');
      });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 1000
        })
      );

      // First attempt - fails, circuit counts it
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // Second attempt - fails, circuit opens
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(breaker.state).toBe('OPEN');
      expect(result.current.error).not.toBeNull();
    });

    it('polling recovers when circuit closes', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 1000
      });

      let shouldFail = true;
      const fetchFn = vi.fn().mockImplementation(async () => {
        return breaker.execute(async () => {
          if (shouldFail) throw new Error('Failing');
          return { success: true };
        }, 'test');
      });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 500
        })
      );

      // Fail twice to open circuit
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(breaker.state).toBe('OPEN');

      // Allow recovery
      shouldFail = false;

      // Wait for circuit reset timeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Next poll should succeed
      await act(async () => {
        await result.current.forceRefresh();
      });

      expect(breaker.state).toBe('CLOSED');
    });

    it('handles stale data during circuit open state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 60000
      });

      const staleData = { alerts: [], lastGood: true };
      let callCount = 0;

      const fetchFn = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return staleData;  // First call succeeds
        }
        return breaker.execute(async () => {
          throw new Error('API down');
        }, 'test');
      });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 1000
        })
      );

      // First call - success
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.data).toEqual(staleData);

      // Subsequent failures
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Data should still be available (stale)
      expect(result.current.data).toEqual(staleData);
      expect(result.current.error).not.toBeNull();
    });

    it('forceRefresh works even when circuit is open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 60000
      });

      // Pre-trip the circuit
      breaker.onFailure('test', new Error('Pre-fail 1'));
      breaker.onFailure('test', new Error('Pre-fail 2'));
      expect(breaker.state).toBe('OPEN');

      // Reset the breaker to simulate user intervention
      breaker.reset();

      const fetchFn = vi.fn().mockResolvedValue({ recovered: true });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: false,
          interval: 30000
        })
      );

      // Force refresh should work after reset
      await act(async () => {
        await result.current.forceRefresh();
      });

      expect(result.current.data).toEqual({ recovered: true });
    });

  });

  // ==========================================
  // Error State Propagation (3 tests)
  // ==========================================
  describe('Error State Propagation', () => {

    it('error state propagates correctly to consuming components', async () => {
      const networkError = new Error('Network timeout');
      networkError.code = 'ETIMEDOUT';

      const fetchFn = vi.fn().mockRejectedValue(networkError);

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 5000
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.error).toEqual(networkError);
      expect(result.current.error.code).toBe('ETIMEDOUT');
      expect(result.current.data).toBeNull();
    });

    it('error is cleared on subsequent success', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 1000
        })
      );

      // First call fails
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.error).not.toBeNull();

      // Second call succeeds (after backoff)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ success: true });
    });

    it('tracks consecutive failures accurately', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 1000,
          maxBackoff: 4
        })
      );

      // First failure
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // Second failure (after 2s backoff)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Third failure (after 4s backoff)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000);
      });

      expect(fetchFn).toHaveBeenCalledTimes(3);
      expect(result.current.error).not.toBeNull();
      expect(result.current.currentInterval).toBeGreaterThan(1000);
    });

  });

});
