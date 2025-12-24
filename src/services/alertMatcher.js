/**
 * Alert Matcher Service
 * Matches NWS alerts to tribal boundaries using geographic overlap
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

// Check if two bounding boxes overlap
function bboxOverlap(bbox1, bbox2) {
  return !(
    bbox1.maxLng < bbox2.minLng ||
    bbox1.minLng > bbox2.maxLng ||
    bbox1.maxLat < bbox2.minLat ||
    bbox1.minLat > bbox2.maxLat
  );
}

/**
 * Match alerts to tribal boundaries
 * Returns a map of GEOID -> highest severity alert level
 */
export function matchAlertsToTribes(alerts, tribalGeoJSON) {
  const tribalAlerts = {};

  if (!tribalGeoJSON?.features || !alerts?.length) {
    return tribalAlerts;
  }

  for (const tribe of tribalGeoJSON.features) {
    const geoid = tribe.properties.GEOID;
    const tribeLat = parseFloat(tribe.properties.INTPTLAT);
    const tribeLng = parseFloat(tribe.properties.INTPTLON);
    const tribeCenter = [tribeLng, tribeLat];

    // Get tribe's bounding box for quick filtering
    const tribeBbox = getBoundingBox(tribe.geometry.coordinates);

    let highestSeverity = null;
    const severityOrder = { EMERGENCY: 0, WARNING: 1, WATCH: 2, ADVISORY: 3 };

    for (const alert of alerts) {
      let matched = false;

      // Method 1: Check if alert has geometry and overlaps tribe
      if (alert.geometry?.type === 'Polygon') {
        const alertBbox = getBoundingBox(alert.geometry.coordinates);
        if (bboxOverlap(tribeBbox, alertBbox)) {
          // Check if tribe center is inside alert polygon
          if (pointInPolygon(tribeCenter, alert.geometry.coordinates[0])) {
            matched = true;
          }
        }
      } else if (alert.geometry?.type === 'MultiPolygon') {
        const alertBbox = getBoundingBox(alert.geometry.coordinates);
        if (bboxOverlap(tribeBbox, alertBbox)) {
          if (pointInMultiPolygon(tribeCenter, alert.geometry.coordinates)) {
            matched = true;
          }
        }
      }

      // Method 2: Check if tribe center falls within alert's area description
      // This is a fallback for alerts without precise geometry
      if (!matched && alert.areaDesc) {
        // Simple check: if alert mentions the state the tribe is in
        const tribeName = tribe.properties.NAME?.toLowerCase() || '';
        const areaDesc = alert.areaDesc.toLowerCase();

        // Check if any part of the area description might match
        if (areaDesc.includes(tribeName) ||
            (tribeLat >= 42 && tribeLat <= 49 && areaDesc.includes('washington')) ||
            (tribeLat >= 42 && tribeLat <= 46 && areaDesc.includes('oregon')) ||
            (tribeLng >= -117 && tribeLng <= -111 && areaDesc.includes('idaho'))) {
          // Still need geometry match for accuracy, so skip this loose match
          // matched = true;
        }
      }

      if (matched) {
        const severity = alert.severity;
        if (!highestSeverity || severityOrder[severity] < severityOrder[highestSeverity]) {
          highestSeverity = severity;
        }
      }
    }

    if (highestSeverity) {
      tribalAlerts[geoid] = highestSeverity;
    }
  }

  return tribalAlerts;
}

/**
 * Get list of alerts affecting a specific tribe
 */
export function getAlertsForTribe(alerts, tribe) {
  if (!alerts?.length || !tribe) return [];

  const tribeLat = parseFloat(tribe.properties.INTPTLAT);
  const tribeLng = parseFloat(tribe.properties.INTPTLON);
  const tribeCenter = [tribeLng, tribeLat];

  return alerts.filter(alert => {
    if (alert.geometry?.type === 'Polygon') {
      return pointInPolygon(tribeCenter, alert.geometry.coordinates[0]);
    }
    if (alert.geometry?.type === 'MultiPolygon') {
      return pointInMultiPolygon(tribeCenter, alert.geometry.coordinates);
    }
    return false;
  });
}
