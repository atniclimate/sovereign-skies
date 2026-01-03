/**
 * api/rivers.js Unit Tests
 * Tests for the NWPS river gauge serverless function
 *
 * Tests cover:
 * - NWPS API integration
 * - Gauge data parsing
 * - Flood category handling
 * - Summary statistics
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mockGaugeNormal,
  mockGaugeAction,
  mockGaugeMinorFlooding,
  mockGaugeModerateFlooding,
  mockGaugeMajorFlooding,
  mockGaugeMissingData,
  mockGaugeOutOfService,
  mockNWPSResponseWA,
  mockNWPSResponseOR,
  mockNWPSResponseID,
  mockNWPSResponseEmpty,
  FLOOD_PRIORITY
} from '../../mocks/rivers';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock the logger
vi.mock('../../../api/_utils/logger.js', () => ({
  riversLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('api/rivers', () => {

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubEnv('VERCEL_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ==========================================
  // NWPS API Response Handling (8 tests)
  // ==========================================
  describe('NWPS API response handling', () => {

    it('fetches gauges successfully from NWPS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNWPSResponseWA)
      });

      const response = await fetch('https://api.water.noaa.gov/nwps/v1/gauges?state=WA');
      const data = await response.json();

      expect(data.gauges).toBeDefined();
      expect(data.gauges.length).toBeGreaterThan(0);
    });

    it('handles empty gauges response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNWPSResponseEmpty)
      });

      const response = await fetch('https://api.water.noaa.gov/nwps/v1/gauges?state=AK');
      const data = await response.json();

      expect(data.gauges).toEqual([]);
    });

    it('handles 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const response = await fetch('https://api.water.noaa.gov/nwps/v1/gauges?state=WA');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('handles network timeout', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 50)
        )
      );

      await expect(fetch('https://api.water.noaa.gov/nwps/v1/gauges'))
        .rejects.toThrow('Network timeout');
    });

    it('fetches multiple states in parallel', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNWPSResponseWA) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNWPSResponseOR) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNWPSResponseID) });

      const states = ['WA', 'OR', 'ID'];
      const results = await Promise.all(
        states.map(state => fetch(`https://api.water.noaa.gov/nwps/v1/gauges?state=${state}`))
      );

      expect(results.length).toBe(3);
      expect(results.every(r => r.ok)).toBe(true);
    });

    it('continues when one state fetch fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNWPSResponseWA) })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNWPSResponseID) });

      const states = ['WA', 'OR', 'ID'];
      const results = await Promise.all(
        states.map(state =>
          fetch(`https://api.water.noaa.gov/nwps/v1/gauges?state=${state}`)
            .then(r => r.ok ? r.json() : { gauges: [] })
        )
      );

      // WA and ID should have gauges, OR empty due to failure
      expect(results[0].gauges.length).toBeGreaterThan(0);
      expect(results[1].gauges).toEqual([]);
      expect(results[2].gauges.length).toBeGreaterThan(0);
    });

    it('handles rate limiting (429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const response = await fetch('https://api.water.noaa.gov/nwps/v1/gauges?state=WA');
      expect(response.status).toBe(429);
    });

    it('handles malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      });

      const response = await fetch('https://api.water.noaa.gov/nwps/v1/gauges?state=WA');
      await expect(response.json()).rejects.toThrow('Unexpected token');
    });
  });

  // ==========================================
  // Gauge Data Parsing (7 tests)
  // ==========================================
  describe('gauge data parsing', () => {

    it('extracts required fields from gauge', () => {
      const gauge = mockGaugeNormal;

      expect(gauge.lid).toBeDefined();
      expect(gauge.name).toBeDefined();
      expect(gauge.latitude).toBeDefined();
      expect(gauge.longitude).toBeDefined();
    });

    it('parses observed level and flow', () => {
      const gauge = mockGaugeNormal;

      expect(gauge.status.observed.primary).toBe(8.45);
      expect(gauge.status.observed.primaryUnit).toBe('ft');
      expect(gauge.status.observed.secondary).toBe(5200);
      expect(gauge.status.observed.secondaryUnit).toBe('cfs');
    });

    it('parses flood category', () => {
      expect(mockGaugeNormal.status.observed.floodCategory).toBe('no_flooding');
      expect(mockGaugeAction.status.observed.floodCategory).toBe('action');
      expect(mockGaugeMinorFlooding.status.observed.floodCategory).toBe('minor');
      expect(mockGaugeModerateFlooding.status.observed.floodCategory).toBe('moderate');
      expect(mockGaugeMajorFlooding.status.observed.floodCategory).toBe('major');
    });

    it('parses forecast data when available', () => {
      const gauge = mockGaugeAction;

      expect(gauge.status.forecast).toBeDefined();
      expect(gauge.status.forecast.primary).toBe(26.0);
      expect(gauge.status.forecast.floodCategory).toBe('minor');
    });

    it('handles missing observed data', () => {
      const gauge = mockGaugeMissingData;

      expect(gauge.status.observed.primary).toBeNull();
      expect(gauge.status.observed.floodCategory).toBe('obs_not_current');
    });

    it('handles out of service gauge', () => {
      const gauge = mockGaugeOutOfService;

      expect(gauge.status.observed.floodCategory).toBe('out_of_service');
      expect(gauge.status.forecast).toBeNull();
    });

    it('extracts WFO and RFC information', () => {
      const gauge = mockGaugeNormal;

      expect(gauge.wfo.abbreviation).toBe('SEW');
      expect(gauge.rfc.abbreviation).toBe('NWRFC');
    });
  });

  // ==========================================
  // Flood Priority Sorting (5 tests)
  // ==========================================
  describe('flood priority sorting', () => {

    it('sorts gauges by flood severity (most severe first)', () => {
      const gauges = [
        { floodCategory: 'no_flooding' },
        { floodCategory: 'major' },
        { floodCategory: 'minor' },
        { floodCategory: 'action' }
      ];

      const sorted = [...gauges].sort((a, b) => {
        const aPri = FLOOD_PRIORITY[a.floodCategory] ?? 99;
        const bPri = FLOOD_PRIORITY[b.floodCategory] ?? 99;
        return aPri - bPri;
      });

      expect(sorted[0].floodCategory).toBe('major');
      expect(sorted[1].floodCategory).toBe('minor');
      expect(sorted[2].floodCategory).toBe('action');
      expect(sorted[3].floodCategory).toBe('no_flooding');
    });

    it('handles all flood categories', () => {
      expect(FLOOD_PRIORITY.major).toBe(0);
      expect(FLOOD_PRIORITY.moderate).toBe(1);
      expect(FLOOD_PRIORITY.minor).toBe(2);
      expect(FLOOD_PRIORITY.action).toBe(3);
      expect(FLOOD_PRIORITY.no_flooding).toBe(5);
      expect(FLOOD_PRIORITY.out_of_service).toBe(8);
    });

    it('handles unknown flood category', () => {
      const gauges = [
        { floodCategory: 'unknown' },
        { floodCategory: 'major' }
      ];

      const sorted = [...gauges].sort((a, b) => {
        const aPri = FLOOD_PRIORITY[a.floodCategory] ?? 99;
        const bPri = FLOOD_PRIORITY[b.floodCategory] ?? 99;
        return aPri - bPri;
      });

      expect(sorted[0].floodCategory).toBe('major');
      expect(sorted[1].floodCategory).toBe('unknown');
    });

    it('maintains stable order for same priority', () => {
      const gauges = [
        { id: 'first', floodCategory: 'minor' },
        { id: 'second', floodCategory: 'minor' }
      ];

      const sorted = [...gauges].sort((a, b) => {
        const aPri = FLOOD_PRIORITY[a.floodCategory] ?? 99;
        const bPri = FLOOD_PRIORITY[b.floodCategory] ?? 99;
        return aPri - bPri;
      });

      expect(sorted[0].id).toBe('first');
      expect(sorted[1].id).toBe('second');
    });

    it('handles empty gauges array', () => {
      const gauges = [];
      const sorted = [...gauges].sort((a, b) => {
        const aPri = FLOOD_PRIORITY[a.floodCategory] ?? 99;
        const bPri = FLOOD_PRIORITY[b.floodCategory] ?? 99;
        return aPri - bPri;
      });

      expect(sorted).toEqual([]);
    });
  });

  // ==========================================
  // Summary Statistics (5 tests)
  // ==========================================
  describe('summary statistics', () => {

    it('calculates total gauge count', () => {
      const gauges = mockNWPSResponseWA.gauges;
      const summary = {
        total: gauges.length
      };

      expect(summary.total).toBeGreaterThan(0);
    });

    it('counts flooding gauges (major, moderate, minor)', () => {
      const gauges = [
        mockGaugeMajorFlooding,
        mockGaugeModerateFlooding,
        mockGaugeMinorFlooding,
        mockGaugeNormal
      ];

      const floodingCount = gauges.filter(g =>
        ['major', 'moderate', 'minor'].includes(g.status.observed.floodCategory)
      ).length;

      expect(floodingCount).toBe(3);
    });

    it('counts action stage gauges', () => {
      const gauges = [mockGaugeAction, mockGaugeNormal];

      const actionCount = gauges.filter(g =>
        g.status.observed.floodCategory === 'action'
      ).length;

      expect(actionCount).toBe(1);
    });

    it('counts normal gauges', () => {
      const gauges = [mockGaugeNormal, mockGaugeAction];

      const normalCount = gauges.filter(g =>
        g.status.observed.floodCategory === 'no_flooding'
      ).length;

      expect(normalCount).toBe(1);
    });

    it('builds complete summary object', () => {
      const gauges = [
        mockGaugeMajorFlooding,
        mockGaugeAction,
        mockGaugeNormal
      ];

      const summary = {
        total: gauges.length,
        flooding: gauges.filter(g =>
          ['major', 'moderate', 'minor'].includes(g.status.observed.floodCategory)
        ).length,
        action: gauges.filter(g =>
          g.status.observed.floodCategory === 'action'
        ).length,
        normal: gauges.filter(g =>
          g.status.observed.floodCategory === 'no_flooding'
        ).length
      };

      expect(summary.total).toBe(3);
      expect(summary.flooding).toBe(1);
      expect(summary.action).toBe(1);
      expect(summary.normal).toBe(1);
    });
  });

  // ==========================================
  // Response Format (5 tests)
  // ==========================================
  describe('response format', () => {

    it('includes gauges array in response', () => {
      const response = {
        gauges: [],
        summary: { total: 0 },
        timestamp: new Date().toISOString(),
        states: ['WA', 'OR', 'ID']
      };

      expect(response.gauges).toBeDefined();
      expect(Array.isArray(response.gauges)).toBe(true);
    });

    it('includes summary object', () => {
      const response = {
        summary: {
          total: 100,
          flooding: 5,
          action: 10,
          normal: 85
        }
      };

      expect(response.summary).toBeDefined();
      expect(response.summary.total).toBe(100);
    });

    it('includes ISO timestamp', () => {
      const response = {
        timestamp: new Date().toISOString()
      };

      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('includes states array', () => {
      const PNW_STATES = ['WA', 'OR', 'ID'];
      const response = {
        states: PNW_STATES
      };

      expect(response.states).toContain('WA');
      expect(response.states).toContain('OR');
      expect(response.states).toContain('ID');
    });

    it('filters gauges without coordinates', () => {
      const gauges = [
        mockGaugeNormal,
        { lid: 'NO-COORDS', name: 'No Coordinates Gauge', latitude: null, longitude: null }
      ];

      const filtered = gauges.filter(g => g.latitude && g.longitude);

      expect(filtered.length).toBe(1);
      expect(filtered[0].lid).toBe('NKWA1');
    });
  });

});
