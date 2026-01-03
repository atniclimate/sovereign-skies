// Shared Logger Utility for Vercel serverless functions
// Node.js compatible version (no import.meta.env)

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4
};

// Production: WARN and above | Development: DEBUG and above
const CURRENT_LEVEL = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  ? LOG_LEVELS.WARN
  : LOG_LEVELS.DEBUG;

/**
 * Format timestamp for development logs
 * @returns {string} ISO timestamp or empty in production
 */
const getTimestamp = () => {
  if (process.env.NODE_ENV === 'production') return '';
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
};

/**
 * Format log prefix with level and context
 * @param {string} level - Log level name
 * @param {string} context - Module context
 * @returns {string} Formatted prefix
 */
const formatPrefix = (level, context) => {
  const timestamp = getTimestamp();
  const prefix = timestamp ? `[${timestamp}]` : '';
  return `${prefix}[${level}][${context}]`;
};

/**
 * Create a logger instance for a specific context
 * @param {string} context - The context name (e.g., 'API:Alerts', 'API:Rivers')
 * @returns {Object} Logger with debug, info, warn, error methods
 */
const createLogger = (context) => ({
  debug: (message, data) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      const prefix = formatPrefix('DEBUG', context);
      if (data !== undefined) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    }
  },

  info: (message, data) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      const prefix = formatPrefix('INFO', context);
      if (data !== undefined) {
        console.info(prefix, message, data);
      } else {
        console.info(prefix, message);
      }
    }
  },

  warn: (message, data) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      const prefix = formatPrefix('WARN', context);
      if (data !== undefined) {
        console.warn(prefix, message, data);
      } else {
        console.warn(prefix, message);
      }
    }
  },

  error: (message, error) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      const prefix = formatPrefix('ERROR', context);
      if (error !== undefined) {
        // Serialize error for structured logging
        const errorInfo = error instanceof Error
          ? { message: error.message, stack: error.stack?.slice(0, 500) }
          : error;
        console.error(prefix, message, errorInfo);
      } else {
        console.error(prefix, message);
      }
    }
  }
});

// Pre-configured loggers for API contexts
const alertsLogger = createLogger('API:Alerts');
const riversLogger = createLogger('API:Rivers');

// Named contexts for consistency
const LogContext = {
  API_ALERTS: 'API:Alerts',
  API_RIVERS: 'API:Rivers',
  API_CACHE: 'API:Cache'
};

export {
  createLogger,
  alertsLogger,
  riversLogger,
  LogContext,
  LOG_LEVELS
};
