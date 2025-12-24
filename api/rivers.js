// Vercel Serverless Function: /api/rivers
// Fetches river gauge data from NWPS API for PNW states

const NWPS_BASE_URL = 'https://api.water.noaa.gov/nwps/v1';
const PNW_STATES = ['WA', 'OR', 'ID'];

// Flood category priority for sorting
const FLOOD_PRIORITY = {
  major: 0,
  moderate: 1,
  minor: 2,
  action: 3,
  low_threshold: 4,
  no_flooding: 5,
  not_defined: 6,
  obs_not_current: 7,
  out_of_service: 8
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch gauges for each PNW state
    const stateGauges = await Promise.all(
      PNW_STATES.map(async (state) => {
        const url = `${NWPS_BASE_URL}/gauges?state=${state}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'TribalWeather/1.0 (tribal-emergency-alerts)'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch gauges for ${state}: ${response.status}`);
          return [];
        }

        const data = await response.json();
        return (data.gauges || []).map(g => ({ ...g, stateCode: state }));
      })
    );

    const allGauges = stateGauges.flat();

    // Parse and filter relevant gauges
    const gauges = allGauges
      .filter(g => g.latitude && g.longitude)
      .map(g => ({
        id: g.lid,
        name: g.name,
        state: g.stateCode,
        lat: g.latitude,
        lng: g.longitude,
        observed: {
          level: g.status?.observed?.primary,
          unit: g.status?.observed?.primaryUnit,
          flow: g.status?.observed?.secondary,
          flowUnit: g.status?.observed?.secondaryUnit,
          floodCategory: g.status?.observed?.floodCategory || 'not_defined',
          validTime: g.status?.observed?.validTime
        },
        forecast: {
          level: g.status?.forecast?.primary,
          floodCategory: g.status?.forecast?.floodCategory || 'not_defined',
          validTime: g.status?.forecast?.validTime
        },
        wfo: g.wfo?.abbreviation,
        rfc: g.rfc?.abbreviation
      }));

    // Sort by flood severity (most severe first)
    gauges.sort((a, b) => {
      const aPri = FLOOD_PRIORITY[a.observed.floodCategory] ?? 99;
      const bPri = FLOOD_PRIORITY[b.observed.floodCategory] ?? 99;
      return aPri - bPri;
    });

    // Summary stats
    const summary = {
      total: gauges.length,
      flooding: gauges.filter(g => ['major', 'moderate', 'minor'].includes(g.observed.floodCategory)).length,
      action: gauges.filter(g => g.observed.floodCategory === 'action').length,
      normal: gauges.filter(g => g.observed.floodCategory === 'no_flooding').length
    };

    return res.status(200).json({
      gauges,
      summary,
      timestamp: new Date().toISOString(),
      states: PNW_STATES
    });

  } catch (error) {
    console.error('Error fetching river gauges:', error);
    return res.status(500).json({
      error: 'Failed to fetch river data',
      message: error.message
    });
  }
}
