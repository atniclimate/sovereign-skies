// Vercel Serverless Function: /api/ec-alerts
// Proxies Environment Canada MSC Datamart for Canadian weather alerts
// Resolves CORS issues in production

const EC_DATAMART_BASE = 'https://dd.weather.gc.ca/alerts/cap';

// Station codes for Pacific Northwest region
const EC_STATIONS = {
  BC: 'CWVR',   // Vancouver - covers all of BC
  AB: 'CWNT'   // Edmonton - covers Alberta
};

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://resplendent-fairy-70d963.netlify.app',
  'https://indigenousaccess.org',
  'http://localhost:5173',
  'http://localhost:3000'
];

function getCorsOrigin(requestOrigin) {
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  // Default to first allowed origin if none match
  return ALLOWED_ORIGINS[0];
}

// Get today's date in YYYYMMDD format (UTC)
function getTodayDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Fetch directory listing and parse for subdirectories or files
async function fetchDirectoryListing(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SovereignSkies/1.0 (tribal-emergency-alerts)'
      }
    });

    if (!response.ok) {
      console.warn(`Directory listing failed for ${url}: ${response.status}`);
      return [];
    }

    const html = await response.text();
    return html;
  } catch (err) {
    console.error(`Failed to fetch directory: ${url}`, err.message);
    return '';
  }
}

// Parse hour directories from HTML listing
function parseHourDirectories(html) {
  const hourMatches = html.match(/href="(\d{2})\/"/g) || [];
  return hourMatches
    .map(m => m.match(/\d{2}/)?.[0])
    .filter(Boolean)
    .sort()
    .reverse();
}

// Parse CAP file names from HTML listing
function parseCAPFiles(html) {
  const fileMatches = html.match(/href="([^"]+\.cap)"/g) || [];
  return fileMatches.map(match => {
    const m = match.match(/href="([^"]+)"/);
    return m ? m[1] : null;
  }).filter(Boolean);
}

// Get latest CAP file URLs for a station
async function getLatestCAPFiles(station, date) {
  const files = [];
  const baseUrl = `${EC_DATAMART_BASE}/${date}/${station}`;

  // Get hour directories
  const dirHtml = await fetchDirectoryListing(`${baseUrl}/`);
  if (!dirHtml) return files;

  const hours = parseHourDirectories(dirHtml);
  if (hours.length === 0) {
    console.log(`No CAP hours found for ${station}`);
    return files;
  }

  // Get the latest 3 hours to catch recent alerts
  for (const hour of hours.slice(0, 3)) {
    try {
      const hourUrl = `${baseUrl}/${hour}/`;
      const hourHtml = await fetchDirectoryListing(hourUrl);
      if (!hourHtml) continue;

      const capFiles = parseCAPFiles(hourHtml);
      for (const filename of capFiles) {
        files.push(`${hourUrl}${filename}`);
      }
    } catch (err) {
      console.warn(`Error processing hour ${hour} for ${station}:`, err.message);
    }
  }

  return files;
}

// Fetch a CAP file
async function fetchCAPFile(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SovereignSkies/1.0 (tribal-emergency-alerts)',
        'Accept': 'application/xml'
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch (err) {
    console.error(`Failed to fetch CAP file: ${url}`, err.message);
    return null;
  }
}

export default async function handler(req, res) {
  // CORS headers
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(origin));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse query parameters
  const { type, station, date, file } = req.query;

  try {
    const today = date || getTodayDate();

    // Type: 'list' - Return list of CAP file URLs
    if (type === 'list') {
      const stationCode = station || 'CWVR';
      const files = await getLatestCAPFiles(stationCode, today);

      return res.status(200).json({
        station: stationCode,
        date: today,
        files,
        count: files.length,
        timestamp: new Date().toISOString()
      });
    }

    // Type: 'file' - Fetch a specific CAP file
    if (type === 'file' && file) {
      const content = await fetchCAPFile(file);
      if (!content) {
        return res.status(404).json({ error: 'CAP file not found' });
      }

      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(content);
    }

    // Default: Fetch all CAP files for BC and AB, return as array
    const [bcFiles, abFiles] = await Promise.all([
      getLatestCAPFiles(EC_STATIONS.BC, today),
      getLatestCAPFiles(EC_STATIONS.AB, today)
    ]);

    // Limit to 10 files per region to avoid timeout
    const allFiles = [
      ...bcFiles.slice(0, 10).map(f => ({ url: f, province: 'BC' })),
      ...abFiles.slice(0, 10).map(f => ({ url: f, province: 'AB' }))
    ];

    // Fetch CAP file contents in parallel (with limit)
    const capContents = await Promise.all(
      allFiles.map(async ({ url, province }) => {
        const content = await fetchCAPFile(url);
        return content ? { url, province, content } : null;
      })
    );

    const validContents = capContents.filter(Boolean);

    return res.status(200).json({
      date: today,
      bcCount: bcFiles.length,
      abCount: abFiles.length,
      files: validContents,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching EC alerts:', error);
    return res.status(500).json({
      error: 'Failed to fetch Canadian alerts',
      message: error.message
    });
  }
}
