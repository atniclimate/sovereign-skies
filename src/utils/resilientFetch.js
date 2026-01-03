/**
 * Resilient Fetch Utility
 *
 * Provides fetch with automatic retry, exponential backoff, and circuit breaker pattern.
 * Essential for emergency alert systems that must handle API instability gracefully.
 */

import createLogger from '@utils/logger';

const logger = createLogger('Fetch');

/**
 * Exponential backoff configuration defaults.
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  timeout: 10000
};

/**
 * Sleep for specified milliseconds.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff and jitter.
 * Jitter prevents thundering herd when multiple clients retry simultaneously.
 *
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Backoff configuration
 * @returns {number} Delay in milliseconds
 */
const calculateDelay = (attempt, config) => {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
};

/**
 * Fetch with automatic retry and exponential backoff.
 *
 * Retries on:
 * - Network errors
 * - Timeout (AbortError)
 * - Retryable HTTP status codes (5xx, 408, 429)
 *
 * Does NOT retry on:
 * - 4xx client errors (except 408, 429)
 * - Successful responses
 *
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {Object} config - Retry configuration
 * @returns {Promise<Response>}
 * @throws {Error} After all retries exhausted
 */
export async function resilientFetch(url, options = {}, config = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const context = config.context || 'Fetch';

  let lastError;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Add timeout via AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Success - return response
      if (response.ok) {
        if (attempt > 0) {
          logger.info(`Request succeeded after ${attempt} retries`, { context, url: sanitizeUrl(url) });
        }
        return response;
      }

      // Non-retryable error - return immediately
      if (!finalConfig.retryableStatuses.includes(response.status)) {
        logger.warn(`Non-retryable status ${response.status}`, { context, url: sanitizeUrl(url) });
        return response;
      }

      // Retryable error - will retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      lastError.status = response.status;
      logger.warn(`Retryable error, attempt ${attempt + 1}/${finalConfig.maxRetries + 1}`, {
        context,
        url: sanitizeUrl(url),
        status: response.status
      });

    } catch (error) {
      lastError = error;

      // Abort errors (timeout) are retryable
      if (error.name === 'AbortError') {
        logger.warn(`Request timeout, attempt ${attempt + 1}/${finalConfig.maxRetries + 1}`, {
          context,
          url: sanitizeUrl(url)
        });
      } else {
        logger.warn(`Network error, attempt ${attempt + 1}/${finalConfig.maxRetries + 1}`, {
          context,
          url: sanitizeUrl(url),
          error: error.message
        });
      }
    }

    // Calculate delay and wait before retry
    if (attempt < finalConfig.maxRetries) {
      const delay = calculateDelay(attempt, finalConfig);
      logger.debug(`Waiting ${Math.round(delay)}ms before retry`, { context });
      await sleep(delay);
    }
  }

  // All retries exhausted
  logger.error(`All ${finalConfig.maxRetries + 1} attempts failed`, { context, url: sanitizeUrl(url) });
  throw lastError;
}

/**
 * Sanitize URL for logging (remove sensitive query params).
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    // Remove potentially sensitive query params
    ['key', 'token', 'api_key', 'apikey', 'secret'].forEach(param => {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.set(param, '[REDACTED]');
      }
    });
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Circuit Breaker Pattern
 *
 * Prevents cascading failures by "breaking" the circuit after repeated failures.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit tripped, requests fail fast
 * - HALF_OPEN: Testing if service recovered
 *
 * Transitions:
 * - CLOSED → OPEN: After failureThreshold consecutive failures
 * - OPEN → HALF_OPEN: After resetTimeoutMs elapsed
 * - HALF_OPEN → CLOSED: On successful request
 * - HALF_OPEN → OPEN: On failed request
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 60000;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 1;

    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.halfOpenAttempts = 0;
  }

  /**
   * Execute a function through the circuit breaker.
   *
   * @param {Function} fn - Async function to execute
   * @param {string} context - Logging context
   * @returns {Promise<any>} Result of fn
   * @throws {Error} If circuit is OPEN or fn throws
   */
  async execute(fn, context = 'CircuitBreaker') {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenAttempts = 0;
        logger.info('Circuit breaker transitioning to HALF_OPEN', { context });
      } else {
        const error = new Error('Circuit breaker is OPEN');
        error.code = 'CIRCUIT_OPEN';
        error.retryAfterMs = this.resetTimeoutMs - timeSinceFailure;
        throw error;
      }
    }

    try {
      const result = await fn();
      this.onSuccess(context);
      return result;
    } catch (error) {
      this.onFailure(context, error);
      throw error;
    }
  }

  /**
   * Handle successful execution.
   * @param {string} context - Logging context
   */
  onSuccess(context) {
    if (this.state === 'HALF_OPEN') {
      logger.info('Circuit breaker recovered, transitioning to CLOSED', { context });
    }
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.halfOpenAttempts = 0;
  }

  /**
   * Handle failed execution.
   * @param {string} context - Logging context
   * @param {Error} error - The error that occurred
   */
  onFailure(context, error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        this.state = 'OPEN';
        logger.warn('Circuit breaker reopened after HALF_OPEN failure', { context });
      }
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker OPEN after ${this.failureCount} failures`, { context });
    }
  }

  /**
   * Get current circuit breaker state.
   * @returns {Object} State information
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Manually reset the circuit breaker.
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.halfOpenAttempts = 0;
  }

  /**
   * Check if circuit is currently allowing requests.
   * @returns {boolean}
   */
  isAvailable() {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN') return true;
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      return timeSinceFailure >= this.resetTimeoutMs;
    }
    return false;
  }
}

// Singleton circuit breakers for each API
// These persist across component remounts
export const nwsCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000  // 1 minute
});

export const ecCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000  // 1 minute
});

export const usgsCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 30000  // 30 seconds
});

/**
 * Fetch with both circuit breaker and resilient retry.
 *
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {CircuitBreaker} circuitBreaker - Circuit breaker instance
 * @param {Object} config - Fetch/retry configuration
 * @returns {Promise<Response>}
 */
export async function fetchWithCircuitBreaker(url, options = {}, circuitBreaker, config = {}) {
  const context = config.context || 'FetchWithCB';

  return circuitBreaker.execute(
    () => resilientFetch(url, options, config),
    context
  );
}
