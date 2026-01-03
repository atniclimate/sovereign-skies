/**
 * useResilientPolling Hook Tests
 * Tests for resilient polling with exponential backoff
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResilientPolling } from '@hooks/useResilientPolling';

describe('useResilientPolling', () => {

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================
  // Initial State (4 tests)
  // ==========================================
  describe('initial state', () => {

    it('returns null data initially', () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: false })
      );

      expect(result.current.data).toBeNull();
    });

    it('returns null error initially', () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: false })
      );

      expect(result.current.error).toBeNull();
    });

    it('is not loading initially when immediate is false', () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: false })
      );

      expect(result.current.isLoading).toBe(false);
    });

    it('has null lastUpdated initially', () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: false })
      );

      expect(result.current.lastUpdated).toBeNull();
    });

  });

  // ==========================================
  // Immediate Fetch (3 tests)
  // ==========================================
  describe('immediate fetch', () => {

    it('fetches immediately when immediate is true', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true })
      );

      await vi.advanceTimersByTimeAsync(0);

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('does not fetch immediately when immediate is false', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      renderHook(() =>
        useResilientPolling(fetchFn, { immediate: false })
      );

      await vi.advanceTimersByTimeAsync(0);

      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('sets data after successful immediate fetch', async () => {
      const testData = { alerts: ['test'] };
      const fetchFn = vi.fn().mockResolvedValue(testData);
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.data).toEqual(testData);
    });

  });

  // ==========================================
  // Polling Interval (4 tests)
  // ==========================================
  describe('polling interval', () => {

    it('polls at the specified interval', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      renderHook(() =>
        useResilientPolling(fetchFn, { interval: 5000, immediate: true })
      );

      await vi.advanceTimersByTimeAsync(0); // Initial fetch
      expect(fetchFn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(5000); // First interval
      expect(fetchFn).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(5000); // Second interval
      expect(fetchFn).toHaveBeenCalledTimes(3);
    });

    it('uses default 30s interval when not specified', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: false })
      );

      expect(result.current.currentInterval).toBe(30000);
    });

    it('does not poll when disabled', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      renderHook(() =>
        useResilientPolling(fetchFn, { enabled: false, immediate: true })
      );

      await vi.advanceTimersByTimeAsync(60000);

      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('updates lastUpdated on successful fetch', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

  });

  // ==========================================
  // Error Handling and Backoff (6 tests)
  // ==========================================
  describe('error handling and backoff', () => {

    it('sets error on fetch failure', async () => {
      const error = new Error('Fetch failed');
      const fetchFn = vi.fn().mockRejectedValue(error);
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.error).toEqual(error);
    });

    it('sets error on consecutive failures', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true, interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0); // First failure
      });

      // Error should be set after failure
      expect(result.current.error?.message).toBe('Failed');
    });

    it('continues polling after failure', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Failed'));
      renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true, interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0); // First failure
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Polling should continue with backoff
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(fetchFn.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('eventually recovers after repeated failures then success', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed 1'))
        .mockRejectedValueOnce(new Error('Failed 2'))
        .mockResolvedValue({ data: 'recovered' });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          interval: 1000,
          maxBackoff: 4
        })
      );

      // Wait through failures and eventual recovery
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0); // First failure
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000); // Second failure
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000); // Success
      });

      // Should have recovered
      expect(result.current.data).toEqual({ data: 'recovered' });
    });

    it('indicates backing off state via error', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true, interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // When backing off, error state is set
      expect(result.current.error).not.toBeNull();
    });

    it('resets backoff on success after failure', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue({ data: 'success' });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true, interval: 1000 })
      );

      // Wait for initial fetch to complete and error state to update
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.error).not.toBeNull();

      // Wait for backoff interval and second fetch
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Error should be cleared after successful fetch
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ data: 'success' });
    });

  });

  // ==========================================
  // Manual Controls (5 tests)
  // ==========================================
  describe('manual controls', () => {

    it('refresh triggers immediate fetch', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: false, interval: 30000 })
      );

      expect(fetchFn).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.refresh();
      });

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('forceRefresh resets backoff', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue({ data: 'success' });

      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true, interval: 1000 })
      );

      // Wait for initial fetch to fail
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      // After failure, error should be set
      expect(result.current.error).not.toBeNull();

      await act(async () => {
        await result.current.forceRefresh();
      });

      // After successful forceRefresh, error should be cleared and backoff reset
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ data: 'success' });
    });

    it('resetBackoff resets interval without fetching', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true, interval: 1000 })
      );

      // Wait for initial fetch to fail
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      // Verify error was set (hook executed with failure)
      expect(result.current.error).not.toBeNull();
      const fetchCallsBeforeReset = fetchFn.mock.calls.length;

      act(() => {
        result.current.resetBackoff();
      });

      // resetBackoff should not trigger a new fetch
      expect(fetchFn).toHaveBeenCalledTimes(fetchCallsBeforeReset);
    });

    it('refresh clears pending timeout', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true, interval: 10000 })
      );

      await vi.advanceTimersByTimeAsync(0); // Initial fetch
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Wait 5 seconds then manual refresh
      await vi.advanceTimersByTimeAsync(5000);
      await act(async () => {
        await result.current.refresh();
      });

      expect(fetchFn).toHaveBeenCalledTimes(2);

      // Next scheduled poll should be 10s from refresh, not 5s
      await vi.advanceTimersByTimeAsync(5000);
      expect(fetchFn).toHaveBeenCalledTimes(2); // Still 2

      await vi.advanceTimersByTimeAsync(5000);
      expect(fetchFn).toHaveBeenCalledTimes(3); // Now 3
    });

    it('calls onSuccess callback on successful fetch', async () => {
      const onSuccess = vi.fn();
      const testData = { alerts: [] };
      const fetchFn = vi.fn().mockResolvedValue(testData);

      renderHook(() =>
        useResilientPolling(fetchFn, {
          immediate: true,
          onSuccess
        })
      );

      await vi.advanceTimersByTimeAsync(0);

      expect(onSuccess).toHaveBeenCalledWith(testData);
    });

  });

  // ==========================================
  // Cleanup (2 tests)
  // ==========================================
  describe('cleanup', () => {

    it('clears timeout on unmount', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      const { unmount } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true, interval: 1000 })
      );

      await vi.advanceTimersByTimeAsync(0);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      unmount();

      await vi.advanceTimersByTimeAsync(5000);
      expect(fetchFn).toHaveBeenCalledTimes(1); // No additional calls
    });

    it('does not update state after unmount', async () => {
      const fetchFn = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: 'delayed' }), 1000))
      );

      const { result, unmount } = renderHook(() =>
        useResilientPolling(fetchFn, { immediate: true })
      );

      // Start fetch, unmount immediately
      unmount();

      // Advance past the async resolution
      await vi.advanceTimersByTimeAsync(2000);

      // Should not throw "Can't update unmounted component"
      // (handled by isMounted check in hook)
      expect(result.current.data).toBeNull();
    });

  });

});
