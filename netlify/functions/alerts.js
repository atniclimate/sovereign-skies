// Netlify Function: /api/alerts
// Proxies NWS Weather API for Pacific Northwest alerts

const NWS_BASE_URL = 'https://api.weather.gov';
const PNW_AREAS = ['WA', 'OR', 'ID', 'PZ']; // WA, OR, ID + Pacific marine zones

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Fetch alerts for each PNW area
    const alertPromises = PNW_AREAS.map(async (area) => {
      try {
        const response = await fetch(
          `${NWS_BASE_URL}/alerts/active?area=${area}`,
          {
            headers: {
              'User-Agent': 'TribalWeather/1.0 (tribal-emergency-alerts)',
              'Accept': 'application/geo+json'
            }
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch alerts for ${area}: ${response.status}`);
          return [];
        }

        const data = await response.json();
        return data.features || [];
      } catch (err) {
        console.error(`Error fetching ${area} alerts:`, err.message);
        return [];
      }
    });

    const areaAlerts = await Promise.all(alertPromises);
    const allFeatures = areaAlerts.flat();

    // Deduplicate by alert ID
    const seenIds = new Set();
    const uniqueFeatures = allFeatures.filter(f => {
      const id = f.properties?.id || f.id;
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });

    // Map severity to app format
    function mapSeverity(severity, urgency, event) {
      const emergencyEvents = ['Tsunami Warning', 'Earthquake Warning', 'Extreme Wind Warning', 'Tornado Warning'];
      const warningEvents = ['High Wind Warning', 'Winter Storm Warning', 'Flood Warning', 'Flash Flood Warning', 'Blizzard Warning', 'Ice Storm Warning'];

      if (emergencyEvents.some(e => event?.includes(e)) || severity === 'Extreme' || urgency === 'Immediate') {
        return 'EMERGENCY';
      }
      if (warningEvents.some(e => event?.includes(e)) || severity === 'Severe') {
        return 'WARNING';
      }
      if (event?.includes('Watch') || severity === 'Moderate') {
        return 'WATCH';
      }
      if (event?.includes('Advisory')) {
        return 'ADVISORY';
      }
      return 'STATEMENT';
    }

    // Transform to app format
    const alerts = uniqueFeatures.map(feature => {
      const props = feature.properties;
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
        geometry: feature.geometry
      };
    });

    // Sort by severity
    const severityOrder = { EMERGENCY: 0, WARNING: 1, WATCH: 2, ADVISORY: 3, STATEMENT: 4 };
    alerts.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        alerts,
        timestamp: new Date().toISOString(),
        areas: PNW_AREAS
      })
    };

  } catch (error) {
    console.error('Error in alerts function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch alerts',
        message: error.message
      })
    };
  }
};
