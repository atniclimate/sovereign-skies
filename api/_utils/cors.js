// Shared CORS utilities for Vercel serverless functions
// Security Fix H-1: Replace wildcard CORS with explicit origin whitelist

/**
 * Allowed origins for API access
 * Production: Only the deployed Vercel domains
 * Preview: Vercel preview deployments (*.vercel.app)
 * Development: localhost:5173 (Vite default)
 */
const ALLOWED_ORIGINS = [
  // Production domains (update with your actual domain)
  'https://sovereignskies.vercel.app',
  'https://tribal-weather.vercel.app',
  'https://tribalweather.org',
  'https://www.tribalweather.org',
];

// Development origins (only active in non-production)
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin header
 * @returns {boolean}
 */
function isOriginAllowed(origin) {
  if (!origin) return false;

  // Check explicit allowlist
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Allow Vercel preview deployments (*.vercel.app)
  if (origin.endsWith('.vercel.app')) {
    return true;
  }

  // Allow development origins only in non-production
  const isProduction = process.env.VERCEL_ENV === 'production';
  if (!isProduction && DEV_ORIGINS.includes(origin)) {
    return true;
  }

  return false;
}

/**
 * Set CORS headers on response
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {object} options - CORS options
 * @returns {boolean} - True if request should continue, false if handled
 */
export function setCorsHeaders(req, res, options = {}) {
  const {
    allowMethods = 'GET, OPTIONS',
    allowHeaders = 'Content-Type',
    maxAge = 86400, // 24 hours
  } = options;

  const origin = req.headers.origin;

  // Set CORS headers only for allowed origins
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  // If origin not allowed, don't set any CORS headers (browser will block)

  res.setHeader('Access-Control-Allow-Methods', allowMethods);
  res.setHeader('Access-Control-Allow-Headers', allowHeaders);
  res.setHeader('Access-Control-Max-Age', String(maxAge));

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false; // Request handled, don't continue
  }

  return true; // Continue processing
}

/**
 * Create a standardized error response (H-2 fix)
 * Hides implementation details in production
 * @param {Error} error - The error object
 * @param {string} userMessage - User-friendly error message
 * @returns {object} - Error response object
 */
export function createErrorResponse(error, userMessage) {
  const isProduction = process.env.VERCEL_ENV === 'production';

  const response = {
    error: userMessage,
    timestamp: new Date().toISOString(),
  };

  // Only include debug info in non-production
  if (!isProduction) {
    response.debug = {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    };
  }

  return response;
}

export { ALLOWED_ORIGINS, DEV_ORIGINS };
