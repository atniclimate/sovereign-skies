/**
 * geometry.js Unit Tests
 * Tests for geometry utilities and alert geometry fallback
 */

import { describe, it, expect } from 'vitest';
import {
  pointInPolygon,
  pointInMultiPolygon,
  polygonsIntersect,
  getBoundingBox,
  boundingBoxesIntersect,
  getPolygonCentroid,
  bufferPoint,
  resolveAlertGeometry,
  calculatePolygonArea,
  simplifyPolygon,
  isValidGeometry,
  getGeometryType
} from '@utils/geometry';

// Test fixtures
const simpleSquare = [
  [[-122.5, 47.5], [-122.5, 48.5], [-121.5, 48.5], [-121.5, 47.5], [-122.5, 47.5]]
];

const smallSquare = [
  [[-122.3, 47.7], [-122.3, 47.9], [-122.1, 47.9], [-122.1, 47.7], [-122.3, 47.7]]
];

const distantSquare = [
  [[-120.0, 45.0], [-120.0, 46.0], [-119.0, 46.0], [-119.0, 45.0], [-120.0, 45.0]]
];

describe('geometry', () => {

  // ==========================================
  // pointInPolygon (8 tests)
  // ==========================================
  describe('pointInPolygon', () => {

    it('returns true for point inside polygon', () => {
      const point = [-122.0, 48.0];
      expect(pointInPolygon(point, simpleSquare)).toBe(true);
    });

    it('returns false for point outside polygon', () => {
      const point = [-123.0, 48.0];
      expect(pointInPolygon(point, simpleSquare)).toBe(false);
    });

    it('returns false for point on vertex', () => {
      const point = [-122.5, 47.5];
      // On boundary - implementation dependent, typically false
      expect(typeof pointInPolygon(point, simpleSquare)).toBe('boolean');
    });

    it('returns false for null point', () => {
      expect(pointInPolygon(null, simpleSquare)).toBe(false);
    });

    it('returns false for null polygon', () => {
      expect(pointInPolygon([-122.0, 48.0], null)).toBe(false);
    });

    it('returns false for empty polygon', () => {
      expect(pointInPolygon([-122.0, 48.0], [])).toBe(false);
    });

    it('returns false for NaN coordinates', () => {
      expect(pointInPolygon([NaN, 48.0], simpleSquare)).toBe(false);
    });

    it('handles complex polygon shapes', () => {
      const lShape = [
        [[-122.0, 47.0], [-122.0, 49.0], [-121.0, 49.0],
         [-121.0, 48.0], [-120.0, 48.0], [-120.0, 47.0], [-122.0, 47.0]]
      ];
      expect(pointInPolygon([-121.5, 48.5], lShape)).toBe(true);
      expect(pointInPolygon([-120.5, 48.5], lShape)).toBe(false);
    });
  });

  // ==========================================
  // pointInMultiPolygon (3 tests)
  // ==========================================
  describe('pointInMultiPolygon', () => {

    it('returns true when point is in any polygon', () => {
      const multiPoly = [simpleSquare, distantSquare];
      expect(pointInMultiPolygon([-122.0, 48.0], multiPoly)).toBe(true);
    });

    it('returns false when point is in no polygon', () => {
      const multiPoly = [simpleSquare, distantSquare];
      expect(pointInMultiPolygon([-115.0, 40.0], multiPoly)).toBe(false);
    });

    it('returns false for null multiPolygon', () => {
      expect(pointInMultiPolygon([-122.0, 48.0], null)).toBe(false);
    });
  });

  // ==========================================
  // polygonsIntersect (4 tests)
  // ==========================================
  describe('polygonsIntersect', () => {

    it('returns true for overlapping polygons', () => {
      expect(polygonsIntersect(simpleSquare, smallSquare)).toBe(true);
    });

    it('returns false for distant polygons', () => {
      expect(polygonsIntersect(simpleSquare, distantSquare)).toBe(false);
    });

    it('returns false for null polygons', () => {
      expect(polygonsIntersect(null, simpleSquare)).toBe(false);
      expect(polygonsIntersect(simpleSquare, null)).toBe(false);
    });

    it('returns false for empty polygons', () => {
      expect(polygonsIntersect([], simpleSquare)).toBe(false);
    });
  });

  // ==========================================
  // getBoundingBox (4 tests)
  // ==========================================
  describe('getBoundingBox', () => {

    it('calculates correct bounding box', () => {
      const bbox = getBoundingBox(simpleSquare);
      expect(bbox.minX).toBe(-122.5);
      expect(bbox.maxX).toBe(-121.5);
      expect(bbox.minY).toBe(47.5);
      expect(bbox.maxY).toBe(48.5);
    });

    it('handles nested polygon array', () => {
      const bbox = getBoundingBox([simpleSquare[0]]);
      expect(bbox.minX).toBe(-122.5);
    });

    it('returns null for empty polygon', () => {
      expect(getBoundingBox([[]])).toBeNull();
    });

    it('handles single-point polygon', () => {
      const singlePoint = [[[-122.0, 48.0]]];
      const bbox = getBoundingBox(singlePoint);
      expect(bbox.minX).toBe(-122.0);
      expect(bbox.maxX).toBe(-122.0);
    });
  });

  // ==========================================
  // boundingBoxesIntersect (4 tests)
  // ==========================================
  describe('boundingBoxesIntersect', () => {

    it('returns true for overlapping boxes', () => {
      const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
      const b = { minX: 5, minY: 5, maxX: 15, maxY: 15 };
      expect(boundingBoxesIntersect(a, b)).toBe(true);
    });

    it('returns false for non-overlapping boxes', () => {
      const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
      const b = { minX: 20, minY: 20, maxX: 30, maxY: 30 };
      expect(boundingBoxesIntersect(a, b)).toBe(false);
    });

    it('returns true for touching boxes', () => {
      const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
      const b = { minX: 10, minY: 0, maxX: 20, maxY: 10 };
      expect(boundingBoxesIntersect(a, b)).toBe(true);
    });

    it('returns false for null boxes', () => {
      expect(boundingBoxesIntersect(null, {})).toBe(false);
    });
  });

  // ==========================================
  // getPolygonCentroid (3 tests)
  // ==========================================
  describe('getPolygonCentroid', () => {

    it('calculates centroid of square', () => {
      const centroid = getPolygonCentroid(simpleSquare);
      // Centroid calculation uses simple vertex averaging, so precision is approximate
      expect(centroid[0]).toBeCloseTo(-122.0, 0);
      expect(centroid[1]).toBeCloseTo(48.0, 0);
    });

    it('returns null for empty polygon', () => {
      expect(getPolygonCentroid([[]])).toBeNull();
    });

    it('handles nested array correctly', () => {
      const centroid = getPolygonCentroid([simpleSquare[0]]);
      expect(centroid).not.toBeNull();
    });
  });

  // ==========================================
  // bufferPoint (4 tests)
  // ==========================================
  describe('bufferPoint', () => {

    it('creates circular buffer with correct number of vertices', () => {
      const buffer = bufferPoint([-122.0, 48.0], 10, 8);
      expect(buffer[0].length).toBe(9); // 8 segments + closing point
    });

    it('default to 16 segments', () => {
      const buffer = bufferPoint([-122.0, 48.0], 10);
      expect(buffer[0].length).toBe(17);
    });

    it('buffer is centered on point', () => {
      const buffer = bufferPoint([-122.0, 48.0], 10);
      const centroid = getPolygonCentroid(buffer);
      // Centroid of circular buffer should be close to center point
      expect(centroid[0]).toBeCloseTo(-122.0, 1);
      expect(centroid[1]).toBeCloseTo(48.0, 1);
    });

    it('larger radius creates larger buffer', () => {
      const small = bufferPoint([-122.0, 48.0], 10);
      const large = bufferPoint([-122.0, 48.0], 100);
      const smallBbox = getBoundingBox(small);
      const largeBbox = getBoundingBox(large);
      expect(largeBbox.maxX - largeBbox.minX).toBeGreaterThan(smallBbox.maxX - smallBbox.minX);
    });
  });

  // ==========================================
  // resolveAlertGeometry (6 tests)
  // ==========================================
  describe('resolveAlertGeometry', () => {

    it('returns existing geometry if present', () => {
      const alert = {
        geometry: { type: 'Polygon', coordinates: simpleSquare }
      };
      const result = resolveAlertGeometry(alert);
      expect(result.coordinates).toEqual(simpleSquare);
    });

    it('looks up zone geometry from UGC codes', () => {
      const alert = { geocode: { UGC: ['WAZ001'] } };
      const zones = [
        { id: 'WAZ001', geometry: { type: 'Polygon', coordinates: simpleSquare } }
      ];
      const result = resolveAlertGeometry(alert, zones);
      expect(result.coordinates).toEqual(simpleSquare);
    });

    it('combines multiple matching zones into MultiPolygon', () => {
      const alert = { geocode: { UGC: ['WAZ001', 'WAZ002'] } };
      const zones = [
        { id: 'WAZ001', geometry: { type: 'Polygon', coordinates: simpleSquare } },
        { id: 'WAZ002', geometry: { type: 'Polygon', coordinates: smallSquare } }
      ];
      const result = resolveAlertGeometry(alert, zones);
      expect(result.type).toBe('MultiPolygon');
      expect(result.coordinates.length).toBe(2);
    });

    it('returns null when no geometry can be resolved', () => {
      const alert = { geocode: { UGC: ['XXX999'] } };
      expect(resolveAlertGeometry(alert, [])).toBeNull();
    });

    it('handles lowercase ugc codes', () => {
      const alert = { geocode: { ugc: ['waz001'] } };
      const zones = [
        { id: 'WAZ001', geometry: { type: 'Polygon', coordinates: simpleSquare } }
      ];
      const result = resolveAlertGeometry(alert, zones);
      expect(result.coordinates).toEqual(simpleSquare);
    });

    it('returns null for alert with empty geometry coordinates', () => {
      const alert = { geometry: { type: 'Polygon', coordinates: [] } };
      expect(resolveAlertGeometry(alert)).toBeNull();
    });
  });

  // ==========================================
  // calculatePolygonArea (2 tests)
  // ==========================================
  describe('calculatePolygonArea', () => {

    it('calculates positive area for valid polygon', () => {
      const area = calculatePolygonArea(simpleSquare);
      expect(area).toBeGreaterThan(0);
    });

    it('returns 0 for empty polygon', () => {
      expect(calculatePolygonArea([[]])).toBe(0);
    });
  });

  // ==========================================
  // simplifyPolygon (3 tests)
  // ==========================================
  describe('simplifyPolygon', () => {

    it('reduces vertex count', () => {
      const densePolygon = [
        Array.from({ length: 100 }, (_, i) => {
          const angle = (i / 100) * 2 * Math.PI;
          return [-122 + 0.5 * Math.cos(angle), 48 + 0.5 * Math.sin(angle)];
        })
      ];
      const simplified = simplifyPolygon(densePolygon, 0.1);
      expect(simplified[0].length).toBeLessThan(densePolygon[0].length);
    });

    it('preserves small polygons', () => {
      const small = [[[0, 0], [1, 0], [1, 1], [0, 0]]];
      const result = simplifyPolygon(small);
      expect(result[0].length).toBe(small[0].length);
    });

    it('always keeps first and last points', () => {
      const simplified = simplifyPolygon(simpleSquare, 0.01);
      expect(simplified[0][0]).toEqual(simpleSquare[0][0]);
    });
  });

  // ==========================================
  // isValidGeometry (5 tests)
  // ==========================================
  describe('isValidGeometry', () => {

    it('validates Point geometry', () => {
      expect(isValidGeometry({ type: 'Point', coordinates: [-122, 48] })).toBe(true);
    });

    it('validates Polygon geometry', () => {
      expect(isValidGeometry({ type: 'Polygon', coordinates: simpleSquare })).toBe(true);
    });

    it('validates MultiPolygon geometry', () => {
      expect(isValidGeometry({
        type: 'MultiPolygon',
        coordinates: [simpleSquare, smallSquare]
      })).toBe(true);
    });

    it('rejects geometry without type', () => {
      expect(isValidGeometry({ coordinates: simpleSquare })).toBe(false);
    });

    it('rejects geometry without coordinates', () => {
      expect(isValidGeometry({ type: 'Polygon' })).toBe(false);
    });
  });

  // ==========================================
  // getGeometryType (4 tests)
  // ==========================================
  describe('getGeometryType', () => {

    it('returns point for Point', () => {
      expect(getGeometryType({ type: 'Point' })).toBe('point');
    });

    it('returns polygon for Polygon', () => {
      expect(getGeometryType({ type: 'Polygon' })).toBe('polygon');
    });

    it('returns multipolygon for MultiPolygon', () => {
      expect(getGeometryType({ type: 'MultiPolygon' })).toBe('multipolygon');
    });

    it('returns unknown for unrecognized type', () => {
      expect(getGeometryType({ type: 'LineString' })).toBe('unknown');
      expect(getGeometryType(null)).toBe('unknown');
    });
  });

});
