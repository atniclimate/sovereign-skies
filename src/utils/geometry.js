/**
 * Geometry utilities for alert matching.
 * Consolidates duplicated point-in-polygon implementations.
 * Provides geometry fallback parity between US and Canadian alerts.
 *
 * @module utils/geometry
 */

/**
 * Ray-casting algorithm for point-in-polygon.
 * @param {[number, number]} point - [lng, lat]
 * @param {Array} polygon - Array of [lng, lat] coordinate arrays
 * @returns {boolean}
 */
export const pointInPolygon = (point, polygon) => {
  if (!point || !polygon || !polygon.length) return false;
  if (!Array.isArray(polygon[0])) return false;

  const [x, y] = point;
  if (isNaN(x) || isNaN(y)) return false;

  const ring = polygon[0]; // Outer ring for simple polygon
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Check if a point is inside a MultiPolygon.
 * @param {[number, number]} point - [lng, lat]
 * @param {Array} multiPolygon - Array of polygon coordinate arrays
 * @returns {boolean}
 */
export const pointInMultiPolygon = (point, multiPolygon) => {
  if (!point || !multiPolygon?.length) return false;

  return multiPolygon.some(polygon => pointInPolygon(point, polygon));
};

/**
 * Check if two polygons intersect.
 * Uses bounding box check first for performance, then detailed check.
 * @param {Array} poly1 - First polygon
 * @param {Array} poly2 - Second polygon
 * @returns {boolean}
 */
export const polygonsIntersect = (poly1, poly2) => {
  if (!poly1?.length || !poly2?.length) return false;

  // Quick bounding box check
  const bbox1 = getBoundingBox(poly1);
  const bbox2 = getBoundingBox(poly2);

  if (!boundingBoxesIntersect(bbox1, bbox2)) return false;

  // Check if any vertex of poly1 is inside poly2 or vice versa
  const ring1 = poly1[0] || poly1;
  const ring2 = poly2[0] || poly2;

  for (const point of ring1) {
    if (pointInPolygon(point, poly2)) return true;
  }

  for (const point of ring2) {
    if (pointInPolygon(point, poly1)) return true;
  }

  return false;
};

/**
 * Get bounding box of polygon.
 * @param {Array} polygon - Polygon coordinates
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number } | null}
 */
export const getBoundingBox = (polygon) => {
  const ring = polygon[0] || polygon;
  if (!ring.length) return null;

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Check if bounding boxes intersect.
 * @param {Object} a - First bounding box
 * @param {Object} b - Second bounding box
 * @returns {boolean}
 */
export const boundingBoxesIntersect = (a, b) => {
  if (!a || !b) return false;
  return !(a.maxX < b.minX || a.minX > b.maxX ||
           a.maxY < b.minY || a.minY > b.maxY);
};

/**
 * Calculate centroid of polygon.
 * @param {Array} polygon - Polygon coordinates
 * @returns {[number, number] | null}
 */
export const getPolygonCentroid = (polygon) => {
  const ring = polygon[0] || polygon;
  if (!ring.length) return null;

  let sumX = 0, sumY = 0;
  for (const [x, y] of ring) {
    sumX += x;
    sumY += y;
  }

  return [sumX / ring.length, sumY / ring.length];
};

/**
 * Create a simple circular buffer around a point.
 * @param {[number, number]} point - [lng, lat]
 * @param {number} radiusKm - Radius in kilometers
 * @param {number} segments - Number of polygon segments (default 16)
 * @returns {Array} Polygon coordinates
 */
export const bufferPoint = (point, radiusKm, segments = 16) => {
  const [lng, lat] = point;
  // Approximate degrees per km (varies by latitude)
  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos(lat * Math.PI / 180);

  const radiusLat = radiusKm / kmPerDegreeLat;
  const radiusLng = radiusKm / kmPerDegreeLng;

  const coords = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    coords.push([
      lng + radiusLng * Math.cos(angle),
      lat + radiusLat * Math.sin(angle)
    ]);
  }

  return [coords];
};

/**
 * Resolve alert geometry with fallbacks.
 * Implements parity between US and Canadian alert geometry handling.
 *
 * Priority:
 * 1. Use alert.geometry if present and valid
 * 2. Look up zone geometry from UGC codes
 * 3. Generate buffer around zone centroid
 *
 * @param {Object} alert - Alert object
 * @param {Array} zones - Zone geometries for fallback lookup
 * @returns {Object|null} GeoJSON geometry or null
 */
export const resolveAlertGeometry = (alert, zones = []) => {
  // Priority 1: Direct geometry
  if (alert?.geometry?.coordinates?.length) {
    return alert.geometry;
  }

  // Priority 2: Zone geometry lookup from UGC codes
  const ugcCodes = alert?.geocode?.UGC || alert?.geocode?.ugc || [];
  if (ugcCodes.length && zones.length) {
    const matchingZones = zones.filter(z =>
      ugcCodes.some(code =>
        code.toUpperCase() === z.id?.toUpperCase()
      )
    );

    if (matchingZones.length === 1) {
      return matchingZones[0].geometry;
    }

    if (matchingZones.length > 1) {
      // Combine multiple zones into MultiPolygon
      return {
        type: 'MultiPolygon',
        coordinates: matchingZones
          .filter(z => z.geometry?.coordinates)
          .map(z => z.geometry.coordinates)
      };
    }
  }

  // Priority 3: Buffer around first matching zone centroid
  if (zones.length && ugcCodes.length) {
    const firstMatch = zones.find(z =>
      ugcCodes.some(code => z.id?.toUpperCase().includes(code.toUpperCase().slice(0, 3)))
    );

    if (firstMatch?.geometry) {
      const centroid = getPolygonCentroid(firstMatch.geometry.coordinates);
      if (centroid) {
        return {
          type: 'Polygon',
          coordinates: bufferPoint(centroid, 50) // 50km default buffer
        };
      }
    }
  }

  return null;
};

/**
 * Calculate approximate area of polygon in square kilometers.
 * Uses spherical excess formula (simplified).
 * @param {Array} polygon - Polygon coordinates
 * @returns {number} Area in km²
 */
export const calculatePolygonArea = (polygon) => {
  const ring = polygon[0] || polygon;
  if (!ring || ring.length < 3) return 0;

  // Simplified shoelace formula converted to approximate km²
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }

  // Convert to km² (approximate at mid-latitudes)
  const kmPerDegree = 111;
  return Math.abs(area / 2) * kmPerDegree * kmPerDegree;
};

/**
 * Simplify polygon by reducing vertex count.
 * Uses Douglas-Peucker-like approach.
 * @param {Array} polygon - Polygon coordinates
 * @param {number} tolerance - Tolerance in degrees
 * @returns {Array} Simplified polygon
 */
export const simplifyPolygon = (polygon, tolerance = 0.01) => {
  const ring = polygon[0] || polygon;
  if (ring.length <= 4) return polygon;

  const simplified = [ring[0]];

  for (let i = 1; i < ring.length - 1; i++) {
    const [x1, y1] = simplified[simplified.length - 1];
    const [x2, y2] = ring[i];

    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (distance >= tolerance) {
      simplified.push(ring[i]);
    }
  }

  // Always include last point to close polygon
  simplified.push(ring[ring.length - 1]);

  return [simplified];
};

/**
 * Check if geometry is valid (has coordinates).
 * @param {Object} geometry - GeoJSON geometry
 * @returns {boolean}
 */
export const isValidGeometry = (geometry) => {
  if (!geometry?.type || !geometry?.coordinates) return false;

  const { type, coordinates } = geometry;

  if (type === 'Point') {
    return Array.isArray(coordinates) && coordinates.length === 2;
  }

  if (type === 'Polygon') {
    return Array.isArray(coordinates) &&
           coordinates.length > 0 &&
           coordinates[0].length >= 3;
  }

  if (type === 'MultiPolygon') {
    return Array.isArray(coordinates) &&
           coordinates.length > 0 &&
           coordinates.every(poly => poly.length > 0 && poly[0].length >= 3);
  }

  return false;
};

/**
 * Get the type of geometry.
 * @param {Object} geometry - GeoJSON geometry
 * @returns {string} 'point' | 'polygon' | 'multipolygon' | 'unknown'
 */
export const getGeometryType = (geometry) => {
  const type = geometry?.type?.toLowerCase() ?? '';
  if (type === 'point') return 'point';
  if (type === 'polygon') return 'polygon';
  if (type === 'multipolygon') return 'multipolygon';
  return 'unknown';
};
