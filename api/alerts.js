// Vercel Serverless Function: /api/alerts
// Proxies NWS API and filters for PNW states

const NWS_BASE_URL = 'https://api.weather.gov';
const PNW_STATES = ['WA', 'OR', 'ID'];

// Map NWS severity to our severity levels
function mapSeverity(nwsSeverity, urgency, certainty) {
  if (nwsSeverity === 'Extreme' || urgency === 'Immediate') {
    return 'EMERGENCY';
  }
  if (nwsSeverity === 'Severe' || certainty === 'Observed') {
    return 'WARNING';
  }
  if (nwsSeverity === 'Moderate') {
    return 'WATCH';
  }
  return 'ADVISORY';
}

// Parse an NWS alert into our format
function parseAlert(feature) {
  const props = feature.properties;

  return {
    id: props.id,
    event: props.event,
    headline: props.headline,
    description: props.description,
    instruction: props.instruction,
    severity: mapSeverity(props.severity, props.urgency, props.certainty),
    nwsSeverity: props.severity,
    urgency: props.urgency,
    certainty: props.certainty,
    effective: props.effective,
    expires: props.expires,
    areaDesc: props.areaDesc,
    affectedZones: props.affectedZones || [],
    geocode: props.geocode || {},
    ugcCodes: props.geocode?.UGC || [],
    sameCodes: props.geocode?.SAME || [],
    senderName: props.senderName,
    geometry: feature.geometry
  };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch alerts for each PNW state
    const stateAlerts = await Promise.all(
      PNW_STATES.map(async (state) => {
        const url = `${NWS_BASE_URL}/alerts/active?area=${state}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'TribalWeather/1.0 (contact@tribalweather.app)',
            'Accept': 'application/geo+json'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch alerts for ${state}: ${response.status}`);
          return [];
        }

        const data = await response.json();
        return data.features || [];
      })
    );

    // Flatten and dedupe by alert ID
    const allFeatures = stateAlerts.flat();
    const uniqueAlerts = new Map();

    for (const feature of allFeatures) {
      const id = feature.properties?.id;
      if (id && !uniqueAlerts.has(id)) {
        uniqueAlerts.set(id, parseAlert(feature));
      }
    }

    const alerts = Array.from(uniqueAlerts.values());

    // Sort by severity (EMERGENCY > WARNING > WATCH > ADVISORY)
    const severityOrder = { EMERGENCY: 0, WARNING: 1, WATCH: 2, ADVISORY: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return res.status(200).json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
      states: PNW_STATES
    });

  } catch (error) {
    console.error('Error fetching NWS alerts:', error);
    return res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
}
