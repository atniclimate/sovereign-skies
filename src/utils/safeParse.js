/**
 * Safe Parsing Utilities
 *
 * Provides error-isolated parsing for XML and JSON.
 * Returns null on parse errors instead of throwing, preventing
 * a single malformed alert from crashing the entire processing pipeline.
 */

import createLogger from '@utils/logger';

const logger = createLogger('Parse');

/**
 * Safely parse XML string to Document.
 * Returns null on parse errors instead of throwing.
 *
 * @param {string} xmlString - XML content to parse
 * @param {string} context - Logging context
 * @returns {Document|null} Parsed document or null on error
 */
export function safeParseXML(xmlString, context = 'XMLParser') {
  if (!xmlString || typeof xmlString !== 'string') {
    logger.warn('Invalid XML input', { context, type: typeof xmlString });
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parse errors (DOMParser doesn't throw, it embeds errors)
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      logger.warn('XML parse error', {
        context,
        error: parseError.textContent?.slice(0, 200)
      });
      return null;
    }

    return doc;
  } catch (error) {
    logger.error('XML parse exception', { context, error: error.message });
    return null;
  }
}

/**
 * Safely parse JSON string.
 * Returns null on parse errors instead of throwing.
 *
 * @param {string} jsonString - JSON content to parse
 * @param {string} context - Logging context
 * @returns {Object|Array|null} Parsed value or null on error
 */
export function safeParseJSON(jsonString, context = 'JSONParser') {
  if (!jsonString || typeof jsonString !== 'string') {
    logger.warn('Invalid JSON input', { context, type: typeof jsonString });
    return null;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.warn('JSON parse error', {
      context,
      error: error.message,
      preview: jsonString.slice(0, 100)
    });
    return null;
  }
}

/**
 * Safely extract text content from XML element.
 *
 * @param {Element|Document} element - XML element or document
 * @param {string} selector - CSS selector for target element
 * @param {string} defaultValue - Default if not found
 * @returns {string} Text content or default
 */
export function safeXMLText(element, selector, defaultValue = '') {
  if (!element) return defaultValue;

  try {
    const target = element.querySelector(selector);
    return target?.textContent?.trim() ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely extract attribute from XML element.
 *
 * @param {Element} element - XML element
 * @param {string} attribute - Attribute name
 * @param {string} defaultValue - Default if not found
 * @returns {string} Attribute value or default
 */
export function safeXMLAttr(element, attribute, defaultValue = '') {
  if (!element) return defaultValue;

  try {
    return element.getAttribute(attribute) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely query all matching elements.
 *
 * @param {Element|Document} element - XML element or document
 * @param {string} selector - CSS selector
 * @returns {Element[]} Array of matching elements (never null)
 */
export function safeXMLQueryAll(element, selector) {
  if (!element) return [];

  try {
    return Array.from(element.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Process array of items with error isolation.
 * Failed items are logged and skipped rather than breaking the entire batch.
 *
 * @param {Array} items - Items to process
 * @param {Function} processor - Processing function (item, index) => result
 * @param {string} context - Logging context
 * @returns {Array} Successfully processed items (nulls/undefined filtered out)
 */
export function safeProcessBatch(items, processor, context = 'BatchProcessor') {
  if (!Array.isArray(items)) {
    logger.warn('Invalid batch input', { context, type: typeof items });
    return [];
  }

  const results = [];
  let errorCount = 0;

  for (let i = 0; i < items.length; i++) {
    try {
      const result = processor(items[i], i);
      if (result !== null && result !== undefined) {
        results.push(result);
      }
    } catch (error) {
      errorCount++;
      logger.warn(`Item ${i} processing failed`, {
        context,
        error: error.message
      });
    }
  }

  if (errorCount > 0) {
    logger.info(`Batch complete: ${results.length} succeeded, ${errorCount} failed`, { context });
  }

  return results;
}

/**
 * Safely access nested object properties.
 * Returns default value if any part of the path is undefined.
 *
 * @param {Object} obj - Object to access
 * @param {string} path - Dot-separated path (e.g., 'properties.geometry.type')
 * @param {any} defaultValue - Default if not found
 * @returns {any} Value at path or default
 */
export function safeGet(obj, path, defaultValue = undefined) {
  if (obj === null || obj === undefined) return defaultValue;

  try {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[part];
    }

    return current !== undefined ? current : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely parse a number from string/number.
 * Returns default if not a valid number.
 *
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default if not parseable
 * @returns {number} Parsed number or default
 */
export function safeParseNumber(value, defaultValue = 0) {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
}

/**
 * Safely parse coordinates from various formats.
 *
 * @param {string|number} lat - Latitude value
 * @param {string|number} lon - Longitude value
 * @returns {[number, number]|null} [lon, lat] GeoJSON order or null if invalid
 */
export function safeParseCoordinates(lat, lon) {
  const parsedLat = safeParseNumber(lat, NaN);
  const parsedLon = safeParseNumber(lon, NaN);

  if (isNaN(parsedLat) || isNaN(parsedLon)) {
    return null;
  }

  // Validate reasonable coordinate ranges
  if (parsedLat < -90 || parsedLat > 90) {
    return null;
  }

  if (parsedLon < -180 || parsedLon > 180) {
    return null;
  }

  // Return in GeoJSON order [lon, lat]
  return [parsedLon, parsedLat];
}
