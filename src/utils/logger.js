/**
 * SovereignSkies Logger Utility
 *
 * Provides consistent logging with level filtering.
 * In production, only warnings and errors are logged.
 * In development, all levels are logged with timestamps.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4
};

// Production: WARN and above | Development: DEBUG and above
const CURRENT_LEVEL = import.meta.env.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

/**
 * Format timestamp for development logs
 * @returns {string} HH:MM:SS.mmm format
 */
const getTimestamp = () => {
  if (import.meta.env.PROD) return '';
  const now = new Date();
  return `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

/**
 * Format log message with level, context, and optional timestamp
 * @param {string} level - Log level name
 * @param {string} context - Component/module context
 * @param {string} message - Log message
 * @returns {string} Formatted prefix
 */
const formatPrefix = (level, context) => {
  const timestamp = getTimestamp();
  const prefix = timestamp ? `${timestamp} ` : '';
  return `${prefix}[${level}][${context}]`;
};

/**
 * Create a logger instance for a specific context
 * @param {string} context - The context name (e.g., 'Alerts', 'Cache', 'Map')
 * @returns {Object} Logger with debug, info, warn, error methods
 */
export const createLogger = (context) => ({
  /**
   * Debug level - development only, verbose information
   * @param {string} message - Log message
   * @param {*} [data] - Optional data to log
   */
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

  /**
   * Info level - general information about application flow
   * @param {string} message - Log message
   * @param {*} [data] - Optional data to log
   */
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

  /**
   * Warn level - non-critical issues that should be addressed
   * @param {string} message - Log message
   * @param {*} [data] - Optional data or error to log
   */
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

  /**
   * Error level - critical failures that impact functionality
   * @param {string} message - Log message
   * @param {Error|*} [error] - Optional error object or data
   */
  error: (message, error) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      const prefix = formatPrefix('ERROR', context);
      if (error !== undefined) {
        console.error(prefix, message, error);
      } else {
        console.error(prefix, message);
      }
    }
  }
});

// Pre-configured loggers for common contexts
export const alertsLogger = createLogger('Alerts');
export const cacheLogger = createLogger('Cache');
export const mapLogger = createLogger('Map');
export const apiLogger = createLogger('API');
export const marineLogger = createLogger('Marine');
export const riversLogger = createLogger('Rivers');
export const tribalLogger = createLogger('Tribal');

// Default export for ad-hoc usage
export default createLogger;
