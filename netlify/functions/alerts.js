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

    // Sort by severity and effective time
    const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
    uniqueFeatures.sort((a, b) => {
      const aSev = severityOrder[a.properties?.severity] ?? 5;
      const bSev = severityOrder[b.properties?.severity] ?? 5;
      if (aSev !== bSev) return aSev - bSev;
      return new Date(b.properties?.effective) - new Date(a.properties?.effective);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: uniqueFeatures,
        title: 'PNW Weather Alerts',
        updated: new Date().toISOString(),
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
