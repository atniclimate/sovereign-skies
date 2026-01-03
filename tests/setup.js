/**
 * Vitest Test Setup
 * Global configuration for all tests
 */

import '@testing-library/jest-dom';
import { afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup React Testing Library after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock localStorage for cache tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock import.meta.env for tests
vi.stubGlobal('import.meta', {
  env: {
    PROD: false,
    DEV: true,
    MODE: 'test'
  }
});

// Suppress console noise in tests (keep warn/error for debugging)
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Performance timing helper
globalThis.measureTestPerformance = (fn, maxMs = 100) => {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  if (duration > maxMs) {
    console.warn(`Performance warning: Operation took ${duration.toFixed(2)}ms (max: ${maxMs}ms)`);
  }
  return { result, duration };
};
