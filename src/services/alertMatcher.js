/**
 * Alert Matcher Service
 * Matches NWS/EC alerts to tribal boundaries using geographic overlap
 */

// Simple point-in-polygon check using ray casting
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

// Check if a point is inside any polygon of a MultiPolygon
function pointInMultiPolygon(point, multiPolygon) {
  for (const polygon of multiPolygon) {
    // polygon[0] is the outer ring
    if (pointInPolygon(point, polygon[0])) {
      return true;
    }
  }
  return false;
}

// Get bounding box of coordinates
function getBoundingBox(coordinates) {
  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;

  function processCoord(coord) {
    if (typeof coord[0] === 'number') {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    } else {
      coord.forEach(processCoord);
    }
  }

  processCoord(coordinates);
  return { minLng, minLat, maxLng, maxLat };
}

// Calculate centroid from geometry coordinates
function getCentroid(geometry) {
  if (!geometry?.coordinates) return null;

  let sumLng = 0, sumLat = 0, count = 0;

  function processCoord(coord) {
    if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
      sumLng += coord[0];
      sumLat += coord[1];
      count++;
    } else if (Array.isArray(coord)) {
      coord.forEach(processCoord);
    }
  }

  processCoord(geometry.coordinates);

  if (count === 0) return null;
  return [sumLng / count, sumLat / count];
}

// Get a unique ID for a tribal feature (works for US and Canadian data)
function getTribalId(props) {
  return props.GEOID || props.CLAB_ID || props.NAME || props.name || 'unknown';
}

// Get the center point for a tribal feature
function getTribalCenter(feature) {
  const props = feature.properties;

  // Try US Census centroid first
  if (props.INTPTLAT && props.INTPTLON) {
    const lat = parseFloat(props.INTPTLAT);
    const lng = parseFloat(props.INTPTLON);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lng, lat];
    }
  }

  // Calculate centroid from geometry
  return getCentroid(feature.geometry);
}

// Check if two bounding boxes overlap
function bboxOverlap(bbox1, bbox2) {
  return !(
    bbox1.maxLng < bbox2.minLng ||
    bbox1.minLng > bbox2.maxLng ||
    bbox1.maxLat < bbox2.minLat ||
    bbox1.minLat > bbox2.maxLat
  );
}

// Check if a point is inside an alert's geometry
function isPointInAlert(point, alert) {
  if (!point || !alert.geometry) return false;

  if (alert.geometry.type === 'Polygon') {
    return pointInPolygon(point, alert.geometry.coordinates[0]);
  }
  if (alert.geometry.type === 'MultiPolygon') {
    return pointInMultiPolygon(point, alert.geometry.coordinates);
  }
  return false;
}

/**
 * Match alerts to tribal boundaries
 * Returns a map of tribal ID -> highest severity alert level
 */
export function matchAlertsToTribes(alerts, tribalGeoJSON) {
  const tribalAlerts = {};

  if (!tribalGeoJSON?.features || !alerts?.length) {
    return tribalAlerts;
  }

  const severityOrder = { EMERGENCY: 0, WARNING: 1, WATCH: 2, ADVISORY: 3, STATEMENT: 4 };

  for (const tribe of tribalGeoJSON.features) {
    if (!tribe.geometry) continue;

    const tribalId = getTribalId(tribe.properties);
    const tribeCenter = getTribalCenter(tribe);

    if (!tribeCenter) continue;

    // Get tribe's bounding box for quick filtering
    const tribeBbox = getBoundingBox(tribe.geometry.coordinates);

    let highestSeverity = null;

    for (const alert of alerts) {
      if (!alert.geometry) continue;

      // Quick bounding box check first
      const alertBbox = getBoundingBox(alert.geometry.coordinates);
      if (!bboxOverlap(tribeBbox, alertBbox)) continue;

      // Check if tribe center is inside alert polygon
      if (isPointInAlert(tribeCenter, alert)) {
        const severity = alert.severity;
        if (!highestSeverity || severityOrder[severity] < severityOrder[highestSeverity]) {
          highestSeverity = severity;
        }
      }
    }

    if (highestSeverity) {
      tribalAlerts[tribalId] = highestSeverity;
    }
  }

  return tribalAlerts;
}

/**
 * Get list of alerts affecting a specific tribe
 */
export function getAlertsForTribe(alerts, tribe) {
  if (!alerts?.length || !tribe) return [];

  const tribeCenter = getTribalCenter(tribe);
  if (!tribeCenter) return [];

  return alerts.filter(alert => isPointInAlert(tribeCenter, alert));
}
