// Vercel Serverless Function: /api/alerts
// Proxies NWS API for weather alerts with zone geometries
// Security: Uses origin whitelist CORS (H-1), sanitized errors (H-2)

import { setCorsHeaders, createErrorResponse } from './_utils/cors.js';
import { alertsLogger as logger } from './_utils/logger.js';

const NWS_BASE_URL = 'https://api.weather.gov';
const PNW_STATES = ['WA', 'OR', 'ID'];

// Cache for zone geometries (in-memory, resets on cold start)
const zoneCache = new Map();

// Map NWS severity to our severity levels
function mapSeverity(nwsSeverity, urgency, certainty, event) {
  // High priority events
  const emergencyEvents = ['Tsunami Warning', 'Earthquake Warning', 'Extreme Wind Warning', 'Tornado Warning'];
  const warningEvents = ['High Wind Warning', 'Winter Storm Warning', 'Flood Warning', 'Flash Flood Warning', 'Blizzard Warning', 'Ice Storm Warning'];

  if (emergencyEvents.some(e => event?.includes(e)) || nwsSeverity === 'Extreme' || urgency === 'Immediate') {
    return 'EMERGENCY';
  }
  if (warningEvents.some(e => event?.includes(e)) || nwsSeverity === 'Severe') {
    return 'WARNING';
  }
  if (event?.includes('Watch') || nwsSeverity === 'Moderate') {
    return 'WATCH';
  }
  if (event?.includes('Advisory')) {
    return 'ADVISORY';
  }
  return 'STATEMENT';
}

// Fetch zone geometry from NWS API
async function fetchZoneGeometry(zoneUrl) {
  if (zoneCache.has(zoneUrl)) {
    return zoneCache.get(zoneUrl);
  }

  try {
    const response = await fetch(zoneUrl, {
      headers: {
        'User-Agent': 'TribalWeather/1.0 (tribal-emergency-alerts)',
        'Accept': 'application/geo+json'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const geometry = data.geometry || null;

    if (geometry) {
      zoneCache.set(zoneUrl, geometry);
    }

    return geometry;
  } catch (err) {
    logger.warn(`Failed to fetch zone geometry`, { url: zoneUrl, error: err.message });
    return null;
  }
}

// Parse an NWS alert into our format
async function parseAlert(feature) {
  const props = feature.properties;
  const affectedZones = props.affectedZones || [];

  // Fetch geometries for all affected zones (limit concurrency)
  let geometry = feature.geometry;

  if (!geometry && affectedZones.length > 0) {
    // Fetch first zone's geometry as representative
    const zoneGeometries = await Promise.all(
      affectedZones.slice(0, 3).map(fetchZoneGeometry)
    );

    // Use first valid geometry or combine into MultiPolygon
    const validGeoms = zoneGeometries.filter(Boolean);
    if (validGeoms.length === 1) {
      geometry = validGeoms[0];
    } else if (validGeoms.length > 1) {
      // Combine into MultiPolygon
      geometry = {
        type: 'MultiPolygon',
        coordinates: validGeoms.flatMap(g =>
          g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]
        )
      };
    }
  }

  return {
    id: props.id,
    event: props.event,
    headline: props.headline,
    description: props.description,
    instruction: props.instruction,
    severity: mapSeverity(props.severity, props.urgency, props.certainty, props.event),
    nwsSeverity: props.severity,
    urgency: props.urgency,
    certainty: props.certainty,
    effective: props.effective,
    onset: props.onset,
    expires: props.expires,
    ends: props.ends,
    areaDesc: props.areaDesc,
    affectedZones: affectedZones,
    geocode: props.geocode || {},
    ugcCodes: props.geocode?.UGC || [],
    sameCodes: props.geocode?.SAME || [],
    senderName: props.senderName,
    geometry: geometry
  };
}

export default async function handler(req, res) {
  // Security headers (H-1: origin whitelist CORS)
  const shouldContinue = setCorsHeaders(req, res, {
    allowMethods: 'GET, OPTIONS',
    allowHeaders: 'Content-Type',
  });
  if (!shouldContinue) return; // Preflight handled

  // Cache headers
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch alerts for all PNW states in parallel
    const url = `${NWS_BASE_URL}/alerts/active?area=${PNW_STATES.join(',')}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TribalWeather/1.0 (tribal-emergency-alerts)',
        'Accept': 'application/geo+json'
      }
    });

    if (!response.ok) {
      throw new Error(`NWS API returned ${response.status}`);
    }

    const data = await response.json();
    const features = data.features || [];

    // Dedupe by alert ID and parse with geometries
    const uniqueIds = new Set();
    const uniqueFeatures = features.filter(f => {
      const id = f.properties?.id;
      if (id && !uniqueIds.has(id)) {
        uniqueIds.add(id);
        return true;
      }
      return false;
    });

    // Parse alerts with zone geometries (limit to 20 to avoid timeout)
    const alerts = await Promise.all(
      uniqueFeatures.slice(0, 50).map(parseAlert)
    );

    // Sort by severity
    const severityOrder = { EMERGENCY: 0, WARNING: 1, WATCH: 2, ADVISORY: 3, STATEMENT: 4 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return res.status(200).json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
      states: PNW_STATES
    });

  } catch (error) {
    logger.error('Failed to fetch NWS alerts', error);
    // H-2: Sanitized error response - hides implementation details in production
    return res.status(500).json(
      createErrorResponse(error, 'Failed to fetch weather alerts')
    );
  }
}
