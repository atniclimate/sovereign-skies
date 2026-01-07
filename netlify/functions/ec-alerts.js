// Netlify Function: /api/ec-alerts
// Proxies Environment Canada MSC Datamart for Canadian weather alerts

const EC_ALERTS_BASE = 'https://dd.weather.gc.ca/alerts/cap';

// Station codes for Pacific Northwest region
const EC_STATIONS = {
  BC: 'CWVR',   // Vancouver - covers all of BC
  AB: 'CWNT'   // Edmonton - covers Alberta
};

// Get today's date in YYYYMMDD format (UTC)
function getTodayDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Fetch directory listing
async function fetchDirectoryListing(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TribalWeather/1.0 (tribal-emergency-alerts)'
      }
    });

    if (!response.ok) {
      console.warn(`Directory listing failed for ${url}: ${response.status}`);
      return '';
    }

    return await response.text();
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
  const baseUrl = `${EC_ALERTS_BASE}/${date}/${station}`;

  const dirHtml = await fetchDirectoryListing(`${baseUrl}/`);
  if (!dirHtml) return files;

  const hours = parseHourDirectories(dirHtml);
  if (hours.length === 0) {
    console.log(`No CAP hours found for ${station}`);
    return files;
  }

  // Get the latest 3 hours
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
        'User-Agent': 'TribalWeather/1.0 (tribal-emergency-alerts)',
        'Accept': 'application/xml'
      }
    });

    if (!response.ok) return null;
    return await response.text();
  } catch (err) {
    console.error(`Failed to fetch CAP file: ${url}`, err.message);
    return null;
  }
}

exports.handler = async function(event, context) {
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
    const params = event.queryStringParameters || {};
    const today = params.date || getTodayDate();

    // Type: 'list' - Return list of CAP file URLs
    if (params.type === 'list') {
      const stationCode = params.station || 'CWVR';
      const files = await getLatestCAPFiles(stationCode, today);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          station: stationCode,
          date: today,
          files,
          count: files.length,
          timestamp: new Date().toISOString()
        })
      };
    }

    // Type: 'file' - Fetch a specific CAP file
    if (params.type === 'file' && params.file) {
      const content = await fetchCAPFile(params.file);
      if (!content) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'CAP file not found' })
        };
      }

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/xml' },
        body: content
      };
    }

    // Default: Fetch all CAP files for BC and AB
    const [bcFiles, abFiles] = await Promise.all([
      getLatestCAPFiles(EC_STATIONS.BC, today),
      getLatestCAPFiles(EC_STATIONS.AB, today)
    ]);

    // Limit to 10 files per region to avoid timeout
    const allFiles = [
      ...bcFiles.slice(0, 10).map(f => ({ url: f, province: 'BC' })),
      ...abFiles.slice(0, 10).map(f => ({ url: f, province: 'AB' }))
    ];

    // Fetch CAP file contents in parallel
    const capContents = await Promise.all(
      allFiles.map(async ({ url, province }) => {
        const content = await fetchCAPFile(url);
        return content ? { url, province, content } : null;
      })
    );

    const validContents = capContents.filter(Boolean);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        date: today,
        bcCount: bcFiles.length,
        abCount: abFiles.length,
        files: validContents,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error in ec-alerts function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch Canadian alerts',
        message: error.message
      })
    };
  }
};
