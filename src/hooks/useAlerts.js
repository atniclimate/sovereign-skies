import { useState, useEffect, useCallback, useRef } from 'react';
import { POLL_INTERVAL_MS } from '../utils/constants';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '../services/cache';

const ALERTS_API_URL = '/api/alerts';
// Include WA, OR, ID plus Pacific marine zones (PZ) for coastal coverage
const NWS_DIRECT_URL = 'https://api.weather.gov/alerts/active?area=WA,OR,ID,PZ';

// Environment Canada MSC Datamart CAP files
// CAP files are organized by date and station code
// CWVR = Vancouver (Pacific region - BC)
// CWNT = Edmonton (Prairie & Northern - Alberta)
// Use proxy in development to avoid CORS issues
const EC_DATAMART_BASE = import.meta.env.DEV
  ? '/ec-alerts/today/alerts/cap'
  : 'https://dd.weather.gc.ca/today/alerts/cap';

// Station codes for Pacific Northwest region
const EC_STATIONS = {
  BC: 'CWVR',   // Vancouver - covers all of BC
  AB: 'CWNT'   // Edmonton - covers Alberta
};

// Approximate bounding boxes for Canadian regions (for alerts without explicit geometry)
const REGION_BOUNDS = {
  // British Columbia regions
  'Vancouver Island': { minLon: -128.5, maxLon: -123.0, minLat: 48.3, maxLat: 51.0 },
  'Lower Mainland': { minLon: -123.5, maxLon: -121.5, minLat: 49.0, maxLat: 49.6 },
  'Fraser Valley': { minLon: -122.5, maxLon: -121.0, minLat: 49.0, maxLat: 49.5 },
  'Okanagan': { minLon: -120.5, maxLon: -118.5, minLat: 49.0, maxLat: 50.5 },
  'Kootenay': { minLon: -118.0, maxLon: -114.5, minLat: 49.0, maxLat: 51.5 },
  'Cariboo': { minLon: -125.0, maxLon: -120.0, minLat: 51.5, maxLat: 54.0 },
  'Thompson': { minLon: -122.0, maxLon: -119.0, minLat: 50.0, maxLat: 52.0 },
  'Peace River': { minLon: -122.0, maxLon: -118.0, minLat: 55.5, maxLat: 60.0 },
  'Prince George': { minLon: -124.0, maxLon: -121.0, minLat: 53.0, maxLat: 55.0 },
  'North Coast': { minLon: -133.0, maxLon: -127.0, minLat: 52.0, maxLat: 56.0 },
  'Bulkley Valley': { minLon: -128.0, maxLon: -125.0, minLat: 53.5, maxLat: 55.5 },
  'default_bc': { minLon: -139.0, maxLon: -114.0, minLat: 48.3, maxLat: 60.0 },

  // Alberta regions
  'Calgary': { minLon: -114.5, maxLon: -113.5, minLat: 50.8, maxLat: 51.3 },
  'Edmonton': { minLon: -114.0, maxLon: -113.0, minLat: 53.3, maxLat: 53.8 },
  'Banff': { minLon: -116.5, maxLon: -115.0, minLat: 51.0, maxLat: 51.8 },
  'Jasper': { minLon: -118.5, maxLon: -117.0, minLat: 52.5, maxLat: 53.5 },
  'Lethbridge': { minLon: -113.0, maxLon: -112.5, minLat: 49.5, maxLat: 50.0 },
  'Red Deer': { minLon: -114.0, maxLon: -113.5, minLat: 52.0, maxLat: 52.5 },
  'Grande Prairie': { minLon: -119.0, maxLon: -118.5, minLat: 55.0, maxLat: 55.5 },
  'Fort McMurray': { minLon: -112.0, maxLon: -111.0, minLat: 56.5, maxLat: 57.0 },
  'default_ab': { minLon: -120.0, maxLon: -110.0, minLat: 49.0, maxLat: 60.0 }
};

// Map NWS severity to our severity levels based on event type
function mapSeverity(severity, urgency, event) {
  const emergencyEvents = ['Tsunami Warning', 'Earthquake Warning', 'Extreme Wind Warning', 'Tornado Warning'];
  const warningEvents = [
    'High Wind Warning', 'Winter Storm Warning', 'Flood Warning', 'Flash Flood Warning',
    'Blizzard Warning', 'Ice Storm Warning', 'Coastal Flood Warning', 'High Surf Warning',
    'Gale Warning', 'Storm Warning', 'Hurricane Warning'
  ];
  const advisoryEvents = [
    'Coastal Flood Advisory', 'High Surf Advisory', 'Beach Hazards Statement',
    'Rip Current Statement', 'Small Craft Advisory', 'Dense Fog Advisory'
  ];

  if (emergencyEvents.some(e => event?.includes(e)) || severity === 'Extreme' || urgency === 'Immediate') {
    return 'EMERGENCY';
  }
  if (warningEvents.some(e => event?.includes(e)) || severity === 'Severe') {
    return 'WARNING';
  }
  if (event?.includes('Watch') || severity === 'Moderate') {
    return 'WATCH';
  }
  if (advisoryEvents.some(e => event?.includes(e)) || event?.includes('Advisory')) {
    return 'ADVISORY';
  }
  return 'STATEMENT';
}

// Map EC alert type to our severity levels
function mapECSeverity(alertType, headline) {
  const lower = (alertType || '').toLowerCase() + ' ' + (headline || '').toLowerCase();
  if (lower.includes('warning') || lower.includes('red')) {
    return 'WARNING';
  }
  if (lower.includes('watch') || lower.includes('orange')) {
    return 'WATCH';
  }
  if (lower.includes('advisory') || lower.includes('yellow')) {
    return 'ADVISORY';
  }
  if (lower.includes('statement') || lower.includes('special')) {
    return 'STATEMENT';
  }
  return 'ADVISORY';
}

// Create a polygon geometry from bounding box
function createBboxPolygon(bounds) {
  return {
    type: 'Polygon',
    coordinates: [[
      [bounds.minLon, bounds.minLat],
      [bounds.maxLon, bounds.minLat],
      [bounds.maxLon, bounds.maxLat],
      [bounds.minLon, bounds.maxLat],
      [bounds.minLon, bounds.minLat]
    ]]
  };
}

// Find the best matching region bounds for an area description
function findRegionBounds(areaDesc, province = 'BC') {
  const area = (areaDesc || '').toLowerCase();

  // Check for exact region matches first
  for (const [regionName, bounds] of Object.entries(REGION_BOUNDS)) {
    if (!regionName.startsWith('default_') && area.includes(regionName.toLowerCase())) {
      return bounds;
    }
  }

  // Check for common BC area patterns
  if (area.includes('vancouver') || area.includes('metro')) {
    return REGION_BOUNDS['Lower Mainland'];
  }
  if (area.includes('victoria') || area.includes('island')) {
    return REGION_BOUNDS['Vancouver Island'];
  }
  if (area.includes('kelowna') || area.includes('penticton')) {
    return REGION_BOUNDS['Okanagan'];
  }
  if (area.includes('kamloops')) {
    return REGION_BOUNDS['Thompson'];
  }

  // Check for common Alberta area patterns
  if (area.includes('calgary')) {
    return REGION_BOUNDS['Calgary'];
  }
  if (area.includes('edmonton')) {
    return REGION_BOUNDS['Edmonton'];
  }
  if (area.includes('banff') || area.includes('canmore')) {
    return REGION_BOUNDS['Banff'];
  }
  if (area.includes('jasper')) {
    return REGION_BOUNDS['Jasper'];
  }

  // Return province default
  return province === 'AB' ? REGION_BOUNDS['default_ab'] : REGION_BOUNDS['default_bc'];
}

// Parse EC CAP polygon string to GeoJSON polygon
// EC CAP format: "lat,lon lat,lon lat,lon ..." (space-separated lat,lon pairs)
function parseECPolygon(polygonStr) {
  if (!polygonStr || typeof polygonStr !== 'string') return null;

  try {
    const pairs = polygonStr.trim().split(/\s+/);
    const coordinates = pairs.map(pair => {
      const [lat, lon] = pair.split(',').map(Number);
      // GeoJSON uses [lon, lat] order
      return [lon, lat];
    }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

    if (coordinates.length < 3) return null;

    // Ensure polygon is closed
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push([...first]);
    }

    return {
      type: 'Polygon',
      coordinates: [coordinates]
    };
  } catch (err) {
    console.warn('Error parsing EC polygon:', err);
    return null;
  }
}

// Parse a single EC CAP XML file and extract alerts
function parseECCAPFile(xmlText, province) {
  const alerts = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.warn('CAP parse error');
    return [];
  }

  // Get the alert identifier
  const alertId = doc.querySelector('identifier')?.textContent || '';
  const sent = doc.querySelector('sent')?.textContent || '';

  // Process each info block (English and French are separate)
  const infos = doc.querySelectorAll('info');

  infos.forEach(info => {
    try {
      const language = info.querySelector('language')?.textContent || '';

      // Only process English alerts
      if (!language.includes('en')) return;

      const urgency = info.querySelector('urgency')?.textContent || '';
      const headline = info.querySelector('headline')?.textContent || '';
      const description = info.querySelector('description')?.textContent || '';
      const instruction = info.querySelector('instruction')?.textContent || '';
      const effective = info.querySelector('effective')?.textContent || sent;
      const expires = info.querySelector('expires')?.textContent || '';

      // Skip ended/past alerts
      if (urgency === 'Past' || headline.toLowerCase().includes('ended')) {
        return;
      }

      // Get the event/alert name from parameters
      let eventName = info.querySelector('event')?.textContent || '';
      if (!eventName) {
        // Try to extract from headline
        eventName = headline.split(' in effect')[0].split(' issued')[0].trim();
      }

      // Get alert location status
      const statusParams = info.querySelectorAll('parameter');
      let locationStatus = 'active';
      statusParams.forEach(param => {
        const valueName = param.querySelector('valueName')?.textContent || '';
        const value = param.querySelector('value')?.textContent || '';
        if (valueName.includes('Alert_Location_Status')) {
          locationStatus = value.toLowerCase();
        }
        if (valueName.includes('Alert_Name') && !eventName) {
          eventName = value;
        }
      });

      // Skip ended alerts
      if (locationStatus === 'ended') return;

      // Process each area within this info block
      const areas = info.querySelectorAll('area');
      areas.forEach((area, areaIdx) => {
        const areaDesc = area.querySelector('areaDesc')?.textContent || province;
        const polygonEl = area.querySelector('polygon');
        let geometry = null;

        if (polygonEl?.textContent) {
          geometry = parseECPolygon(polygonEl.textContent);
        }

        // If no polygon, create from region bounds
        if (!geometry) {
          const bounds = findRegionBounds(areaDesc, province);
          geometry = createBboxPolygon(bounds);
        }

        const mappedSeverity = mapECSeverity(eventName, headline);

        alerts.push({
          id: `${alertId}-${areaIdx}`,
          event: eventName || 'Weather Alert',
          headline,
          description: description.replace(/###/g, '').trim(),
          instruction: instruction || '',
          severity: mappedSeverity,
          nwsSeverity: mappedSeverity,
          urgency: urgency || 'Expected',
          certainty: 'Likely',
          areaDesc: `${areaDesc}, ${province}`,
          affectedZones: [],
          effective,
          onset: effective,
          expires,
          ends: expires,
          senderName: 'Environment Canada',
          geocode: {},
          geometry,
          isCanadian: true,
          province
        });
      });
    } catch (err) {
      console.warn('Error parsing CAP info block:', err);
    }
  });

  return alerts;
}

// Fetch directory listing and get CAP file URLs
async function getLatestCAPFiles(station, date) {
  try {
    // Get today's directory
    const dirUrl = `${EC_DATAMART_BASE}/${date}/${station}/`;
    const response = await fetch(dirUrl);

    if (!response.ok) {
      console.warn(`Could not fetch CAP directory for ${station}:`, response.status);
      return [];
    }

    const html = await response.text();

    // Parse the directory listing to find hour directories
    const hourMatches = html.match(/href="(\d{2})\/"/g) || [];
    const hours = hourMatches.map(m => m.match(/\d{2}/)[0]).sort().reverse();

    if (hours.length === 0) {
      console.log(`No CAP hours found for ${station}`);
      return [];
    }

    // Get the latest 3 hours to catch recent alerts
    const capFiles = [];
    for (const hour of hours.slice(0, 3)) {
      try {
        const hourUrl = `${dirUrl}${hour}/`;
        const hourResponse = await fetch(hourUrl);

        if (!hourResponse.ok) continue;

        const hourHtml = await hourResponse.text();

        // Find all .cap files
        const fileMatches = hourHtml.match(/href="([^"]+\.cap)"/g) || [];
        for (const match of fileMatches) {
          const filename = match.match(/href="([^"]+)"/)[1];
          capFiles.push(`${hourUrl}${filename}`);
        }
      } catch (err) {
        console.warn(`Error fetching hour ${hour} for ${station}:`, err);
      }
    }

    return capFiles;
  } catch (err) {
    console.warn(`Error getting CAP files for ${station}:`, err);
    return [];
  }
}

// Fetch and parse Canadian alerts from Environment Canada MSC Datamart
async function fetchCanadianAlerts() {
  try {
    // Get today's date in YYYYMMDD format (UTC)
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const today = `${year}${month}${day}`;

    console.log(`Fetching Canadian alerts for ${today}...`);

    // Get CAP file URLs for BC and Alberta
    const [bcFiles, abFiles] = await Promise.all([
      getLatestCAPFiles(EC_STATIONS.BC, today),
      getLatestCAPFiles(EC_STATIONS.AB, today)
    ]);

    console.log(`Found ${bcFiles.length} BC CAP files, ${abFiles.length} AB CAP files`);

    // Fetch and parse CAP files
    const allAlerts = [];
    const seenIds = new Set();

    // Process BC files
    for (const fileUrl of bcFiles.slice(0, 10)) {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) continue;

        const xmlText = await response.text();
        const alerts = parseECCAPFile(xmlText, 'BC');

        for (const alert of alerts) {
          if (!seenIds.has(alert.id)) {
            seenIds.add(alert.id);
            allAlerts.push(alert);
          }
        }
      } catch (err) {
        console.warn('Error fetching CAP file:', err);
      }
    }

    // Process AB files
    for (const fileUrl of abFiles.slice(0, 10)) {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) continue;

        const xmlText = await response.text();
        const alerts = parseECCAPFile(xmlText, 'AB');

        for (const alert of alerts) {
          if (!seenIds.has(alert.id)) {
            seenIds.add(alert.id);
            allAlerts.push(alert);
          }
        }
      } catch (err) {
        console.warn('Error fetching CAP file:', err);
      }
    }

    console.log(`Loaded ${allAlerts.length} Canadian alerts from MSC Datamart`);
    return allAlerts;
  } catch (err) {
    console.warn('Error fetching Canadian alerts:', err);
    return [];
  }
}

// Fetch zone geometry from NWS API
async function fetchZoneGeometry(zoneUrl) {
  try {
    const response = await fetch(zoneUrl, {
      headers: { 'Accept': 'application/geo+json' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.geometry || null;
  } catch {
    return null;
  }
}

// Transform NWS API response to our format (for direct API fallback)
async function transformNWSResponse(data) {
  const features = data.features || [];

  // Dedupe by ID
  const seen = new Set();
  const unique = features.filter(f => {
    const id = f.properties?.id;
    if (id && !seen.has(id)) {
      seen.add(id);
      return true;
    }
    return false;
  });

  // Process alerts (limit to 30 to avoid too many zone fetches)
  const alerts = await Promise.all(
    unique.slice(0, 30).map(async (feature) => {
      const props = feature.properties;
      let geometry = feature.geometry;

      // Fetch zone geometry if not provided
      if (!geometry && props.affectedZones?.length > 0) {
        geometry = await fetchZoneGeometry(props.affectedZones[0]);
      }

      return {
        id: props.id,
        event: props.event,
        headline: props.headline,
        description: props.description,
        instruction: props.instruction,
        severity: mapSeverity(props.severity, props.urgency, props.event),
        nwsSeverity: props.severity,
        urgency: props.urgency,
        certainty: props.certainty,
        areaDesc: props.areaDesc,
        affectedZones: props.affectedZones || [],
        effective: props.effective,
        onset: props.onset,
        expires: props.expires,
        ends: props.ends,
        senderName: props.senderName,
        geocode: props.geocode,
        geometry
      };
    })
  );

  // Sort by severity
  const severityOrder = { EMERGENCY: 0, WARNING: 1, WATCH: 2, ADVISORY: 3, STATEMENT: 4 };
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

  return { alerts, timestamp: new Date().toISOString() };
}

export default function useAlerts(includeCanada = true) {
  const [alerts, setAlerts] = useState(() => {
    const cached = getCache(CACHE_KEYS.ALERTS);
    return cached?.alerts || [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const cached = getCache(CACHE_KEYS.ALERTS);
    return cached?.timestamp ? new Date(cached.timestamp) : null;
  });
  const intervalRef = useRef(null);

  const fetchAlerts = useCallback(async (skipCache = false) => {
    try {
      if (!skipCache) {
        const cached = getCache(CACHE_KEYS.ALERTS);
        if (cached) {
          setAlerts(cached.alerts || []);
          setLastUpdated(new Date(cached.timestamp));
          setLoading(false);
          return;
        }
      }

      let usAlerts = [];

      // Try proxy first, fall back to direct NWS API
      try {
        const response = await fetch(ALERTS_API_URL);
        if (!response.ok) throw new Error('Proxy failed');
        const data = await response.json();
        usAlerts = data.alerts || [];
      } catch {
        // Fall back to direct NWS API
        const nwsResponse = await fetch(NWS_DIRECT_URL, {
          headers: { 'Accept': 'application/geo+json' }
        });
        if (!nwsResponse.ok) {
          throw new Error(`Failed to fetch alerts: ${nwsResponse.status}`);
        }
        const nwsData = await nwsResponse.json();
        const data = await transformNWSResponse(nwsData);
        usAlerts = data.alerts || [];
      }

      // Mark US alerts
      usAlerts = usAlerts.map(a => ({ ...a, isCanadian: false }));

      // Fetch Canadian alerts if enabled
      let canadianAlerts = [];
      if (includeCanada) {
        canadianAlerts = await fetchCanadianAlerts();
      }

      // Merge and sort all alerts
      const allAlerts = [...usAlerts, ...canadianAlerts];
      const severityOrder = { EMERGENCY: 0, WARNING: 1, WATCH: 2, ADVISORY: 3, STATEMENT: 4 };
      allAlerts.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

      const timestamp = new Date().toISOString();

      setAlerts(allAlerts);
      setLastUpdated(new Date(timestamp));
      setError(null);

      setCache(CACHE_KEYS.ALERTS, {
        alerts: allAlerts,
        timestamp
      }, CACHE_TTL.ALERTS);

    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);

      const cached = getCache(CACHE_KEYS.ALERTS);
      if (cached) {
        setAlerts(cached.alerts || []);
        setLastUpdated(new Date(cached.timestamp));
      }
    } finally {
      setLoading(false);
    }
  }, [includeCanada]);

  useEffect(() => {
    const cached = getCache(CACHE_KEYS.ALERTS);
    if (cached) {
      setAlerts(cached.alerts || []);
      setLastUpdated(new Date(cached.timestamp));
      setLoading(false);
    } else {
      fetchAlerts(true);
    }

    intervalRef.current = setInterval(() => fetchAlerts(true), POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAlerts]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchAlerts(true);
  }, [fetchAlerts]);

  // Compute alerts with geometry for map display
  const alertsWithGeometry = alerts.filter(a => a.geometry);

  // Group alerts by severity for summary
  const alertsByType = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {});

  return {
    alerts,
    alertsWithGeometry,
    alertsByType,
    loading,
    error,
    lastUpdated,
    refresh,
    alertCount: alerts.length
  };
}
