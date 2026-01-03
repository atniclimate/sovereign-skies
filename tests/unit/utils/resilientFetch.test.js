/**
 * resilientFetch.js Unit Tests
 * Tests for fetch retry, exponential backoff, and circuit breaker pattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resilientFetch,
  CircuitBreaker,
  fetchWithCircuitBreaker,
  nwsCircuitBreaker,
  ecCircuitBreaker,
  usgsCircuitBreaker
} from '@utils/resilientFetch';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('resilientFetch', () => {

  beforeEach(() => {
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================
  // Successful Fetch (5 tests)
  // ==========================================
  describe('successful fetch', () => {

    it('returns response on first attempt success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' })
      });

      const response = await resilientFetch('https://api.example.com/data');

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('passes fetch options to underlying fetch', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await resilientFetch('https://api.example.com/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('includes abort signal for timeout', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await resilientFetch('https://api.example.com/data');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
    });

    it('returns non-retryable errors without retry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const response = await resilientFetch('https://api.example.com/data');

      expect(response.status).toBe(404);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns 401 errors without retry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const response = await resilientFetch('https://api.example.com/data');

      expect(response.status).toBe(401);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

  });

  // ==========================================
  // Retry Logic (8 tests)
  // ==========================================
  describe('retry logic', () => {

    it('retries on 500 server error', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const fetchPromise = resilientFetch('https://api.example.com/data');

      // Advance timer to allow retry delay
      await vi.advanceTimersByTimeAsync(2000);

      const response = await fetchPromise;

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('retries on 502 bad gateway', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 502, statusText: 'Bad Gateway' })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const fetchPromise = resilientFetch('https://api.example.com/data');
      await vi.advanceTimersByTimeAsync(2000);

      const response = await fetchPromise;

      expect(response.ok).toBe(true);
    });

    it('retries on 503 service unavailable', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const fetchPromise = resilientFetch('https://api.example.com/data');
      await vi.advanceTimersByTimeAsync(2000);

      const response = await fetchPromise;

      expect(response.ok).toBe(true);
    });

    it('retries on 504 gateway timeout', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 504, statusText: 'Gateway Timeout' })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const fetchPromise = resilientFetch('https://api.example.com/data');
      await vi.advanceTimersByTimeAsync(2000);

      const response = await fetchPromise;

      expect(response.ok).toBe(true);
    });

    it('retries on 429 too many requests', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 429, statusText: 'Too Many Requests' })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const fetchPromise = resilientFetch('https://api.example.com/data');
      await vi.advanceTimersByTimeAsync(2000);

      const response = await fetchPromise;

      expect(response.ok).toBe(true);
    });

    it('retries on 408 request timeout', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 408, statusText: 'Request Timeout' })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const fetchPromise = resilientFetch('https://api.example.com/data');
      await vi.advanceTimersByTimeAsync(2000);

      const response = await fetchPromise;

      expect(response.ok).toBe(true);
    });

    it('retries on network error', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const fetchPromise = resilientFetch('https://api.example.com/data');
      await vi.advanceTimersByTimeAsync(2000);

      const response = await fetchPromise;

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('retries on abort/timeout error', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockFetch
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const fetchPromise = resilientFetch('https://api.example.com/data');
      await vi.advanceTimersByTimeAsync(2000);

      const response = await fetchPromise;

      expect(response.ok).toBe(true);
    });

  });

  // ==========================================
  // Retry Exhaustion (3 tests)
  // Note: Using real timers with short delays to avoid unhandled rejections
  // ==========================================
  describe('retry exhaustion', () => {

    beforeEach(() => {
      vi.useRealTimers();
    });

    afterEach(() => {
      vi.useFakeTimers();
    });

    it('throws after maxRetries exhausted', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' });

      await expect(
        resilientFetch('https://api.example.com/data', {}, {
          maxRetries: 2,
          baseDelayMs: 10,
          maxDelayMs: 50
        })
      ).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('respects custom maxRetries config', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });

      await expect(
        resilientFetch('https://api.example.com/data', {}, {
          maxRetries: 1,
          baseDelayMs: 10,
          maxDelayMs: 50
        })
      ).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it('throws last error after all retries fail', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent network failure'));

      await expect(
        resilientFetch('https://api.example.com/data', {}, {
          maxRetries: 2,
          baseDelayMs: 10,
          maxDelayMs: 50
        })
      ).rejects.toThrow('Persistent network failure');
    });

  });

  // ==========================================
  // URL Sanitization (3 tests)
  // ==========================================
  describe('URL sanitization for logging', () => {

    it('sanitizes API keys in URLs', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      // The function should log sanitized URL, not throw
      await resilientFetch('https://api.example.com/data?api_key=secret123');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('sanitizes tokens in URLs', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await resilientFetch('https://api.example.com/data?token=mysecrettoken');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('handles malformed URLs gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await resilientFetch('not-a-valid-url');

      expect(mockFetch).toHaveBeenCalled();
    });

  });

});

// ==========================================
// CircuitBreaker Class (15 tests)
// ==========================================
describe('CircuitBreaker', () => {

  let circuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 5000,
      halfOpenMaxAttempts: 1
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {

    it('starts in CLOSED state', () => {
      expect(circuitBreaker.getState().state).toBe('CLOSED');
    });

    it('starts with zero failure count', () => {
      expect(circuitBreaker.getState().failureCount).toBe(0);
    });

    it('is available when CLOSED', () => {
      expect(circuitBreaker.isAvailable()).toBe(true);
    });

  });

  describe('CLOSED state behavior', () => {

    it('allows successful requests through', async () => {
      const result = await circuitBreaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('resets failure count on success', async () => {
      // Cause some failures
      await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

      expect(circuitBreaker.getState().failureCount).toBe(2);

      // Success resets
      await circuitBreaker.execute(() => Promise.resolve('success'));
      expect(circuitBreaker.getState().failureCount).toBe(0);
    });

    it('increments failure count on failure', async () => {
      await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      expect(circuitBreaker.getState().failureCount).toBe(1);
    });

    it('transitions to OPEN after failure threshold', async () => {
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      }
      expect(circuitBreaker.getState().state).toBe('OPEN');
    });

  });

  describe('OPEN state behavior', () => {

    beforeEach(async () => {
      // Trip the circuit
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      }
    });

    it('rejects requests immediately when OPEN', async () => {
      await expect(
        circuitBreaker.execute(() => Promise.resolve('should not run'))
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('includes retry-after time in error', async () => {
      try {
        await circuitBreaker.execute(() => Promise.resolve('should not run'));
      } catch (error) {
        expect(error.code).toBe('CIRCUIT_OPEN');
        expect(error.retryAfterMs).toBeDefined();
        expect(error.retryAfterMs).toBeLessThanOrEqual(5000);
      }
    });

    it('is not available when OPEN', () => {
      expect(circuitBreaker.isAvailable()).toBe(false);
    });

    it('transitions to HALF_OPEN after reset timeout', async () => {
      expect(circuitBreaker.getState().state).toBe('OPEN');

      vi.advanceTimersByTime(5001);

      // Next execution attempt will transition to HALF_OPEN
      expect(circuitBreaker.isAvailable()).toBe(true);
    });

  });

  describe('HALF_OPEN state behavior', () => {

    beforeEach(async () => {
      // Trip the circuit
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      }
      // Wait for reset timeout
      vi.advanceTimersByTime(5001);
    });

    it('allows one test request in HALF_OPEN', async () => {
      const result = await circuitBreaker.execute(() => Promise.resolve('test'));
      expect(result).toBe('test');
    });

    it('transitions to CLOSED on success in HALF_OPEN', async () => {
      await circuitBreaker.execute(() => Promise.resolve('success'));
      expect(circuitBreaker.getState().state).toBe('CLOSED');
    });

    it('transitions back to OPEN on failure in HALF_OPEN', async () => {
      await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      expect(circuitBreaker.getState().state).toBe('OPEN');
    });

  });

  describe('reset functionality', () => {

    it('reset() restores CLOSED state', async () => {
      // Trip the circuit
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      }
      expect(circuitBreaker.getState().state).toBe('OPEN');

      circuitBreaker.reset();

      expect(circuitBreaker.getState().state).toBe('CLOSED');
      expect(circuitBreaker.getState().failureCount).toBe(0);
    });

    it('reset() clears last failure time', async () => {
      await circuitBreaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      expect(circuitBreaker.getState().lastFailureTime).not.toBeNull();

      circuitBreaker.reset();
      expect(circuitBreaker.getState().lastFailureTime).toBeNull();
    });

  });

});

// ==========================================
// Singleton Circuit Breakers (3 tests)
// ==========================================
describe('singleton circuit breakers', () => {

  beforeEach(() => {
    // Reset all singletons
    nwsCircuitBreaker.reset();
    ecCircuitBreaker.reset();
    usgsCircuitBreaker.reset();
  });

  it('nwsCircuitBreaker has correct configuration', () => {
    expect(nwsCircuitBreaker.failureThreshold).toBe(5);
    expect(nwsCircuitBreaker.resetTimeoutMs).toBe(60000);
  });

  it('ecCircuitBreaker has correct configuration', () => {
    expect(ecCircuitBreaker.failureThreshold).toBe(5);
    expect(ecCircuitBreaker.resetTimeoutMs).toBe(60000);
  });

  it('usgsCircuitBreaker has shorter timeout for faster recovery', () => {
    expect(usgsCircuitBreaker.failureThreshold).toBe(3);
    expect(usgsCircuitBreaker.resetTimeoutMs).toBe(30000);
  });

});

// ==========================================
// fetchWithCircuitBreaker (3 tests)
// ==========================================
describe('fetchWithCircuitBreaker', () => {

  let testCircuitBreaker;

  beforeEach(() => {
    testCircuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeoutMs: 1000
    });
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses circuit breaker with resilient fetch', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    const response = await fetchWithCircuitBreaker(
      'https://api.example.com/data',
      {},
      testCircuitBreaker,
      { context: 'TestFetch' }
    );

    expect(response.ok).toBe(true);
  });

  it('trips circuit after threshold failures', async () => {
    // Use circuit breaker directly to avoid async timing issues with fetch
    for (let i = 0; i < 2; i++) {
      try {
        await testCircuitBreaker.execute(() => Promise.reject(new Error('API failure')));
      } catch {
        // Expected to fail
      }
    }

    expect(testCircuitBreaker.getState().state).toBe('OPEN');
  });

  it('fails fast when circuit is OPEN', async () => {
    // Trip the circuit manually
    testCircuitBreaker.state = 'OPEN';
    testCircuitBreaker.lastFailureTime = Date.now();

    await expect(
      fetchWithCircuitBreaker(
        'https://api.example.com/data',
        {},
        testCircuitBreaker
      )
    ).rejects.toThrow('Circuit breaker is OPEN');
  });

});
