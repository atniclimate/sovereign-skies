/**
 * LocalStorage Cache Service
 * Provides caching with TTL for alerts and other data
 */

const CACHE_PREFIX = 'tw_';

/**
 * Get item from cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if expired/missing
 */
export function getCache(key) {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;

    const { value, expiry } = JSON.parse(item);

    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return value;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Set item in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlMs - Time to live in milliseconds
 */
export function setCache(key, value, ttlMs) {
  try {
    const item = {
      value,
      expiry: ttlMs ? Date.now() + ttlMs : null
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    console.warn('Cache write error:', error);
    // If storage is full, clear old items
    if (error.name === 'QuotaExceededError') {
      clearExpiredCache();
    }
  }
}

/**
 * Remove item from cache
 * @param {string} key - Cache key
 */
export function removeCache(key) {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    console.warn('Cache remove error:', error);
  }
}

/**
 * Clear all expired cache items
 */
export function clearExpiredCache() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));

    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          const { expiry } = JSON.parse(item);
          if (expiry && Date.now() > expiry) {
            localStorage.removeItem(key);
          }
        } catch {
          // Invalid item, remove it
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

/**
 * Clear all cache items
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Cache clear all error:', error);
  }
}

// Cache keys
export const CACHE_KEYS = {
  ALERTS: 'alerts',
  RIVERS: 'rivers',
  TRIBAL_DATA: 'tribal_data',
  LAST_POSITION: 'last_position',
  MARINE_BUOYS: 'marine_buoys',
  MARINE_TIDES: 'marine_tides'
};

// Default TTLs
export const CACHE_TTL = {
  ALERTS: 5 * 60 * 1000,      // 5 minutes
  RIVERS: 5 * 60 * 1000,      // 5 minutes
  TRIBAL_DATA: 24 * 60 * 60 * 1000, // 24 hours
  LAST_POSITION: 7 * 24 * 60 * 60 * 1000, // 7 days
  MARINE_BUOYS: 10 * 60 * 1000,   // 10 minutes (buoys update every 10-60 min)
  MARINE_TIDES: 60 * 60 * 1000    // 1 hour (tide predictions are stable)
};
