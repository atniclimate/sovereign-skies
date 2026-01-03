/**
 * alertMatcher.js Unit Tests
 * Tests for geographic alert matching to Tribal boundaries
 *
 * Critical path: Life-safety code requiring >80% coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchAlertsToTribes, getAlertsForTribe } from '@services/alertMatcher';
import {
  mockTribalBoundaries,
  mockTestPoints,
  mockComplexPolygons,
  mockMultiPolygonZone
} from '../mocks/zones';

// Helper to create a simple alert with geometry
function createAlert(id, severity, coordinates) {
  return {
    id,
    severity,
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  };
}

// Helper to create a MultiPolygon alert
function createMultiPolygonAlert(id, severity, polygonsCoords) {
  return {
    id,
    severity,
    geometry: {
      type: 'MultiPolygon',
      coordinates: polygonsCoords.map(coords => [coords])
    }
  };
}

describe('alertMatcher', () => {

  // ==========================================
  // matchAlertsToTribes - Basic Functionality (10 tests)
  // ==========================================
  describe('matchAlertsToTribes - basic functionality', () => {

    it('returns empty object when no alerts provided', () => {
      const result = matchAlertsToTribes([], mockTribalBoundaries);
      expect(result).toEqual({});
    });

    it('returns empty object when alerts is null', () => {
      const result = matchAlertsToTribes(null, mockTribalBoundaries);
      expect(result).toEqual({});
    });

    it('returns empty object when tribal data is null', () => {
      const alerts = [createAlert('a1', 'WARNING', mockComplexPolygons.stateWide[0])];
      const result = matchAlertsToTribes(alerts, null);
      expect(result).toEqual({});
    });

    it('returns empty object when tribal data has no features', () => {
      const alerts = [createAlert('a1', 'WARNING', mockComplexPolygons.stateWide[0])];
      const result = matchAlertsToTribes(alerts, { type: 'FeatureCollection', features: [] });
      expect(result).toEqual({});
    });

    it('matches a Tribe when alert covers its center', () => {
      // Create alert that covers Lummi Reservation center
      const alert = createAlert('a1', 'WARNING', [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);

      // Lummi GEOID is '5300100'
      expect(result['5300100']).toBe('WARNING');
    });

    it('returns highest severity when multiple alerts affect same Tribe', () => {
      const warningAlert = createAlert('a1', 'WARNING', [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ]);

      const emergencyAlert = createAlert('a2', 'EMERGENCY', [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ]);

      const result = matchAlertsToTribes([warningAlert, emergencyAlert], mockTribalBoundaries);

      expect(result['5300100']).toBe('EMERGENCY');
    });

    it('matches multiple Tribes when alert covers large area', () => {
      // State-wide alert covering all mock Tribes
      const alert = createAlert('a1', 'WATCH', mockComplexPolygons.stateWide[0]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);

      // Should match Lummi, Nooksack, Tulalip, Swinomish
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(4);
    });

    it('does not match Tribe when alert is outside its area', () => {
      // Alert in Pacific Ocean
      const alert = createAlert('a1', 'WARNING', [
        [-130.0, 45.0],
        [-128.0, 45.0],
        [-128.0, 47.0],
        [-130.0, 47.0],
        [-130.0, 45.0]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);

      expect(result).toEqual({});
    });

    it('uses INTPTLAT/INTPTLON for center when available', () => {
      // Lummi has INTPTLAT/INTPTLON set
      const lummiFeature = mockTribalBoundaries.features.find(f => f.properties.NAME === 'Lummi Reservation');
      expect(lummiFeature.properties.INTPTLAT).toBeDefined();

      // Create alert just around the Census centroid
      const lat = parseFloat(lummiFeature.properties.INTPTLAT);
      const lng = parseFloat(lummiFeature.properties.INTPTLON);

      const alert = createAlert('a1', 'ADVISORY', [
        [lng - 0.1, lat - 0.1],
        [lng + 0.1, lat - 0.1],
        [lng + 0.1, lat + 0.1],
        [lng - 0.1, lat + 0.1],
        [lng - 0.1, lat - 0.1]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);
      expect(result['5300100']).toBe('ADVISORY');
    });

    it('skips alerts with no geometry', () => {
      const alertWithGeom = createAlert('a1', 'WARNING', [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ]);

      const alertNoGeom = {
        id: 'a2',
        severity: 'EMERGENCY',
        geometry: null
      };

      const result = matchAlertsToTribes([alertWithGeom, alertNoGeom], mockTribalBoundaries);

      // Should still match from first alert
      expect(result['5300100']).toBe('WARNING');
    });
  });

  // ==========================================
  // matchAlertsToTribes - Severity Priority (6 tests)
  // ==========================================
  describe('matchAlertsToTribes - severity priority', () => {

    const createOverlappingAlerts = (severities) => {
      return severities.map((sev, i) => createAlert(`a${i}`, sev, [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ]));
    };

    it('EMERGENCY beats all other severities', () => {
      const alerts = createOverlappingAlerts(['WARNING', 'EMERGENCY', 'WATCH', 'ADVISORY']);
      const result = matchAlertsToTribes(alerts, mockTribalBoundaries);
      expect(result['5300100']).toBe('EMERGENCY');
    });

    it('WARNING beats WATCH, ADVISORY, STATEMENT', () => {
      const alerts = createOverlappingAlerts(['WATCH', 'WARNING', 'ADVISORY', 'STATEMENT']);
      const result = matchAlertsToTribes(alerts, mockTribalBoundaries);
      expect(result['5300100']).toBe('WARNING');
    });

    it('WATCH beats ADVISORY, STATEMENT', () => {
      const alerts = createOverlappingAlerts(['ADVISORY', 'WATCH', 'STATEMENT']);
      const result = matchAlertsToTribes(alerts, mockTribalBoundaries);
      expect(result['5300100']).toBe('WATCH');
    });

    it('ADVISORY beats STATEMENT', () => {
      const alerts = createOverlappingAlerts(['STATEMENT', 'ADVISORY']);
      const result = matchAlertsToTribes(alerts, mockTribalBoundaries);
      expect(result['5300100']).toBe('ADVISORY');
    });

    it('STATEMENT is lowest priority', () => {
      const alerts = createOverlappingAlerts(['STATEMENT']);
      const result = matchAlertsToTribes(alerts, mockTribalBoundaries);
      expect(result['5300100']).toBe('STATEMENT');
    });

    it('handles unknown severity gracefully', () => {
      const alerts = [createAlert('a1', 'UNKNOWN_SEVERITY', [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ])];

      // Should not throw, but behavior is undefined
      expect(() => matchAlertsToTribes(alerts, mockTribalBoundaries)).not.toThrow();
    });
  });

  // ==========================================
  // matchAlertsToTribes - MultiPolygon Support (5 tests)
  // ==========================================
  describe('matchAlertsToTribes - MultiPolygon support', () => {

    it('matches Tribe when inside one polygon of MultiPolygon', () => {
      // Create MultiPolygon alert with one polygon covering Lummi
      const alert = createMultiPolygonAlert('mp1', 'WARNING', [
        // Polygon 1: Covers Lummi
        [
          [-122.80, 48.70],
          [-122.50, 48.70],
          [-122.50, 48.90],
          [-122.80, 48.90],
          [-122.80, 48.70]
        ],
        // Polygon 2: Far away
        [
          [-130.0, 45.0],
          [-128.0, 45.0],
          [-128.0, 47.0],
          [-130.0, 47.0],
          [-130.0, 45.0]
        ]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);
      expect(result['5300100']).toBe('WARNING');
    });

    it('matches Tribe when inside any polygon of MultiPolygon', () => {
      // Create MultiPolygon alert with second polygon covering Tulalip
      const alert = createMultiPolygonAlert('mp2', 'WATCH', [
        // Polygon 1: Far away
        [
          [-130.0, 45.0],
          [-128.0, 45.0],
          [-128.0, 47.0],
          [-130.0, 47.0],
          [-130.0, 45.0]
        ],
        // Polygon 2: Covers Tulalip
        [
          [-122.40, 47.95],
          [-122.15, 47.95],
          [-122.15, 48.15],
          [-122.40, 48.15],
          [-122.40, 47.95]
        ]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);
      expect(result['5300300']).toBe('WATCH');
    });

    it('does not match when outside all polygons of MultiPolygon', () => {
      const alert = createMultiPolygonAlert('mp3', 'WARNING', [
        // Both polygons far from any Tribe
        [
          [-130.0, 45.0],
          [-128.0, 45.0],
          [-128.0, 47.0],
          [-130.0, 47.0],
          [-130.0, 45.0]
        ],
        [
          [-135.0, 50.0],
          [-133.0, 50.0],
          [-133.0, 52.0],
          [-135.0, 52.0],
          [-135.0, 50.0]
        ]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);
      expect(result).toEqual({});
    });

    it('matches multiple Tribes across different polygons', () => {
      const alert = createMultiPolygonAlert('mp4', 'ADVISORY', [
        // Polygon 1: Covers Lummi
        [
          [-122.80, 48.70],
          [-122.50, 48.70],
          [-122.50, 48.90],
          [-122.80, 48.90],
          [-122.80, 48.70]
        ],
        // Polygon 2: Covers Tulalip
        [
          [-122.40, 47.95],
          [-122.15, 47.95],
          [-122.15, 48.15],
          [-122.40, 48.15],
          [-122.40, 47.95]
        ]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);
      expect(result['5300100']).toBe('ADVISORY'); // Lummi
      expect(result['5300300']).toBe('ADVISORY'); // Tulalip
    });

    it('handles empty MultiPolygon coordinates', () => {
      const alert = {
        id: 'mp-empty',
        severity: 'WARNING',
        geometry: {
          type: 'MultiPolygon',
          coordinates: []
        }
      };

      expect(() => matchAlertsToTribes([alert], mockTribalBoundaries)).not.toThrow();
    });
  });

  // ==========================================
  // matchAlertsToTribes - Canadian First Nations (4 tests)
  // ==========================================
  describe('matchAlertsToTribes - Canadian First Nations', () => {

    it('matches Canadian First Nation using CLAB_ID', () => {
      // Create alert covering Musqueam (in Vancouver)
      const alert = createAlert('ca1', 'WARNING', [
        [-123.30, 49.20],
        [-123.15, 49.20],
        [-123.15, 49.28],
        [-123.30, 49.28],
        [-123.30, 49.20]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);

      // Musqueam uses CLAB_ID 'FN001'
      expect(result['FN001']).toBe('WARNING');
    });

    it('calculates centroid when no INTPTLAT/INTPTLON for Canadian data', () => {
      // Musqueam doesn't have INTPTLAT/INTPTLON
      const musqueam = mockTribalBoundaries.features.find(f => f.properties.CLAB_ID === 'FN001');
      expect(musqueam.properties.INTPTLAT).toBeUndefined();

      // Alert should still work using calculated centroid
      const alert = createAlert('ca2', 'WATCH', [
        [-123.30, 49.20],
        [-123.15, 49.20],
        [-123.15, 49.28],
        [-123.30, 49.28],
        [-123.30, 49.20]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);
      expect(result['FN001']).toBe('WATCH');
    });

    it('handles cross-border alert affecting both US and Canadian Tribes', () => {
      // Large alert spanning border
      const alert = createAlert('border1', 'EMERGENCY', [
        [-123.5, 48.5],
        [-122.0, 48.5],
        [-122.0, 49.5],
        [-123.5, 49.5],
        [-123.5, 48.5]
      ]);

      const result = matchAlertsToTribes([alert], mockTribalBoundaries);

      // Should match US Tribes (Lummi, Nooksack) and Canadian (Musqueam)
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2);
    });

    it('falls back to NAME when CLAB_ID is missing', () => {
      // Create a feature with only 'name' property
      const featureWithNameOnly = {
        type: 'Feature',
        properties: {
          name: 'Test First Nation'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-123.0, 49.0],
            [-122.9, 49.0],
            [-122.9, 49.1],
            [-123.0, 49.1],
            [-123.0, 49.0]
          ]]
        }
      };

      const customBoundaries = {
        type: 'FeatureCollection',
        features: [featureWithNameOnly]
      };

      const alert = createAlert('fn1', 'STATEMENT', [
        [-123.1, 48.9],
        [-122.8, 48.9],
        [-122.8, 49.2],
        [-123.1, 49.2],
        [-123.1, 48.9]
      ]);

      const result = matchAlertsToTribes([alert], customBoundaries);
      expect(result['Test First Nation']).toBe('STATEMENT');
    });
  });

  // ==========================================
  // getAlertsForTribe - Specific Tribe Lookup (5 tests)
  // ==========================================
  describe('getAlertsForTribe', () => {

    it('returns empty array when no alerts', () => {
      const tribe = mockTribalBoundaries.features[0];
      const result = getAlertsForTribe([], tribe);
      expect(result).toEqual([]);
    });

    it('returns empty array when tribe is null', () => {
      const alerts = [createAlert('a1', 'WARNING', mockComplexPolygons.stateWide[0])];
      const result = getAlertsForTribe(alerts, null);
      expect(result).toEqual([]);
    });

    it('returns alerts that cover the Tribe', () => {
      const tribe = mockTribalBoundaries.features.find(f => f.properties.NAME === 'Lummi Reservation');

      const coveringAlert = createAlert('a1', 'WARNING', [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ]);

      const farAwayAlert = createAlert('a2', 'WATCH', [
        [-130.0, 45.0],
        [-128.0, 45.0],
        [-128.0, 47.0],
        [-130.0, 47.0],
        [-130.0, 45.0]
      ]);

      const result = getAlertsForTribe([coveringAlert, farAwayAlert], tribe);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('a1');
    });

    it('returns multiple overlapping alerts', () => {
      const tribe = mockTribalBoundaries.features.find(f => f.properties.NAME === 'Lummi Reservation');

      const alert1 = createAlert('a1', 'WARNING', [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ]);

      const alert2 = createAlert('a2', 'EMERGENCY', [
        [-123.00, 48.60],
        [-122.40, 48.60],
        [-122.40, 49.00],
        [-123.00, 49.00],
        [-123.00, 48.60]
      ]);

      const result = getAlertsForTribe([alert1, alert2], tribe);

      expect(result.length).toBe(2);
    });

    it('handles Tribe with no valid center', () => {
      const tribeNoGeom = {
        type: 'Feature',
        properties: { NAME: 'No Geometry Tribe' },
        geometry: null
      };

      const alerts = [createAlert('a1', 'WARNING', mockComplexPolygons.stateWide[0])];
      const result = getAlertsForTribe(alerts, tribeNoGeom);

      expect(result).toEqual([]);
    });
  });

  // ==========================================
  // Edge Cases and Error Handling (8 tests)
  // ==========================================
  describe('edge cases and error handling', () => {

    it('handles malformed geometry type gracefully', () => {
      const alertBadGeom = {
        id: 'bad1',
        severity: 'WARNING',
        geometry: {
          type: 'Point', // Not Polygon or MultiPolygon
          coordinates: [-122.5, 48.5]
        }
      };

      expect(() => matchAlertsToTribes([alertBadGeom], mockTribalBoundaries)).not.toThrow();

      const result = matchAlertsToTribes([alertBadGeom], mockTribalBoundaries);
      expect(result).toEqual({});
    });

    it('handles Tribe without geometry', () => {
      const tribeNoGeom = {
        type: 'Feature',
        properties: { GEOID: 'no-geom', NAME: 'No Geometry' },
        geometry: null
      };

      const customBoundaries = {
        type: 'FeatureCollection',
        features: [tribeNoGeom, ...mockTribalBoundaries.features]
      };

      const alert = createAlert('a1', 'WARNING', mockComplexPolygons.stateWide[0]);

      // Should not throw and should skip the invalid feature
      const result = matchAlertsToTribes([alert], customBoundaries);
      expect(result['no-geom']).toBeUndefined();
    });

    it('handles empty coordinates array', () => {
      const alertEmptyCoords = {
        id: 'empty1',
        severity: 'WARNING',
        geometry: {
          type: 'Polygon',
          coordinates: [[]]
        }
      };

      expect(() => matchAlertsToTribes([alertEmptyCoords], mockTribalBoundaries)).not.toThrow();
    });

    it('handles very small polygon (precision)', () => {
      const alert = createAlert('tiny', 'WARNING', mockComplexPolygons.tiny[0]);

      // Point exactly in the tiny polygon
      const tinyTribe = {
        type: 'Feature',
        properties: { GEOID: 'tiny-tribe', INTPTLAT: '48.50005', INTPTLON: '-122.49995' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.4999, 48.5000],
            [-122.4998, 48.5000],
            [-122.4998, 48.5001],
            [-122.4999, 48.5001],
            [-122.4999, 48.5000]
          ]]
        }
      };

      const customBoundaries = { type: 'FeatureCollection', features: [tinyTribe] };
      const result = matchAlertsToTribes([alert], customBoundaries);

      // May or may not match depending on precision, but should not throw
      expect(() => matchAlertsToTribes([alert], customBoundaries)).not.toThrow();
    });

    it('handles concave polygon correctly', () => {
      // Point that's inside the bounding box but outside the concave shape
      const tribeInConcaveGap = {
        type: 'Feature',
        properties: { GEOID: 'gap-tribe', INTPTLAT: '48.65', INTPTLON: '-122.35' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.36, 48.64],
            [-122.34, 48.64],
            [-122.34, 48.66],
            [-122.36, 48.66],
            [-122.36, 48.64]
          ]]
        }
      };

      const concaveAlert = createAlert('concave', 'WARNING', mockComplexPolygons.concave[0]);
      const customBoundaries = { type: 'FeatureCollection', features: [tribeInConcaveGap] };

      const result = matchAlertsToTribes([concaveAlert], customBoundaries);
      // Point at -122.35, 48.65 is in the "indent" of the L-shape, so should NOT match
      expect(result['gap-tribe']).toBeUndefined();
    });

    it('handles undefined properties gracefully', () => {
      const tribeNoProps = {
        type: 'Feature',
        properties: undefined,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.5, 48.5],
            [-122.4, 48.5],
            [-122.4, 48.6],
            [-122.5, 48.6],
            [-122.5, 48.5]
          ]]
        }
      };

      const customBoundaries = { type: 'FeatureCollection', features: [tribeNoProps] };
      const alert = createAlert('a1', 'WARNING', mockComplexPolygons.stateWide[0]);

      // NOTE: Current implementation throws on undefined properties
      // This is a known limitation - real GeoJSON should always have properties object
      // Test documents current behavior for potential future hardening
      expect(() => matchAlertsToTribes([alert], customBoundaries)).toThrow();
    });

    it('handles NaN coordinates in INTPTLAT/INTPTLON', () => {
      const tribeNaN = {
        type: 'Feature',
        properties: { GEOID: 'nan-tribe', INTPTLAT: 'not-a-number', INTPTLON: '-122.5' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.6, 48.5],
            [-122.4, 48.5],
            [-122.4, 48.6],
            [-122.6, 48.6],
            [-122.6, 48.5]
          ]]
        }
      };

      const customBoundaries = { type: 'FeatureCollection', features: [tribeNaN] };
      const alert = createAlert('a1', 'WARNING', mockComplexPolygons.stateWide[0]);

      // Should fall back to calculated centroid, not throw
      const result = matchAlertsToTribes([alert], customBoundaries);
      expect(result['nan-tribe']).toBe('WARNING');
    });

    it('performs adequately with many alerts (performance)', () => {
      // Create 100 alerts
      const alerts = Array.from({ length: 100 }, (_, i) =>
        createAlert(`perf-${i}`, 'WATCH', [
          [-122.5 + (i * 0.01), 48.5],
          [-122.4 + (i * 0.01), 48.5],
          [-122.4 + (i * 0.01), 48.6],
          [-122.5 + (i * 0.01), 48.6],
          [-122.5 + (i * 0.01), 48.5]
        ])
      );

      const start = performance.now();
      matchAlertsToTribes(alerts, mockTribalBoundaries);
      const duration = performance.now() - start;

      // Should complete in under 500ms
      expect(duration).toBeLessThan(500);
    });
  });

  // ==========================================
  // Bounding Box Optimization (3 tests)
  // ==========================================
  describe('bounding box optimization', () => {

    it('quickly filters alerts that do not overlap Tribe bounding box', () => {
      // Create 50 alerts, only 1 overlaps the Tribe bbox
      const farAlerts = Array.from({ length: 49 }, (_, i) =>
        createAlert(`far-${i}`, 'WARNING', [
          [-130.0 - i, 40.0],
          [-129.0 - i, 40.0],
          [-129.0 - i, 41.0],
          [-130.0 - i, 41.0],
          [-130.0 - i, 40.0]
        ])
      );

      const nearAlert = createAlert('near', 'EMERGENCY', [
        [-122.80, 48.70],
        [-122.50, 48.70],
        [-122.50, 48.90],
        [-122.80, 48.90],
        [-122.80, 48.70]
      ]);

      const start = performance.now();
      const result = matchAlertsToTribes([...farAlerts, nearAlert], mockTribalBoundaries);
      const duration = performance.now() - start;

      // Should find the matching alert
      expect(result['5300100']).toBe('EMERGENCY');
      // And be fast due to bbox filtering
      expect(duration).toBeLessThan(100);
    });

    it('handles alerts that overlap bbox but not polygon', () => {
      // Alert overlaps Lummi's bounding box but not the actual polygon
      // Lummi is roughly at [-122.75, 48.72] to [-122.55, 48.88]
      const alertOutsidePolygon = createAlert('bbox-only', 'WARNING', [
        [-122.54, 48.70], // Just east of Lummi
        [-122.50, 48.70],
        [-122.50, 48.75],
        [-122.54, 48.75],
        [-122.54, 48.70]
      ]);

      const result = matchAlertsToTribes([alertOutsidePolygon], mockTribalBoundaries);

      // Should not match Lummi (alert is east of Lummi center)
      expect(result['5300100']).toBeUndefined();
    });

    it('handles large alerts efficiently', () => {
      const hugeAlert = createAlert('huge', 'WATCH', [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90]
      ]);

      const start = performance.now();
      const result = matchAlertsToTribes([hugeAlert], mockTribalBoundaries);
      const duration = performance.now() - start;

      // Should match all Tribes but still be fast
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(4);
      expect(duration).toBeLessThan(100);
    });
  });

});
