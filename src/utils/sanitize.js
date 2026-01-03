/**
 * XSS Sanitization Utilities
 *
 * Provides HTML sanitization for user-facing content.
 * Critical for emergency alert systems that display content from external sources
 * (NWS, Environment Canada) which could potentially contain malicious content.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize configuration for alert content.
 * Restrictive: only basic formatting tags allowed.
 */
const ALERT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'span', 'div'],
  ALLOWED_ATTR: ['class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed', 'link'],
  FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Sanitize HTML content for safe rendering.
 * Use for alert descriptions, instructions, headlines.
 *
 * @param {string} html - Raw HTML content
 * @returns {string} Sanitized HTML safe for dangerouslySetInnerHTML
 */
export function sanitizeAlertHTML(html) {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, ALERT_SANITIZE_CONFIG);
}

/**
 * Sanitize and return plain text (strip all HTML).
 * Use when you need just text content without any formatting.
 *
 * @param {string} html - Content that may contain HTML
 * @returns {string} Plain text with all HTML removed
 */
export function sanitizeToText(html) {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize URL for safe use in href/src attributes.
 * Only allows http, https, and mailto protocols.
 * Blocks javascript:, data:, vbscript:, etc.
 *
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if unsafe
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return null;

  // Trim and normalize
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const allowedProtocols = ['http:', 'https:', 'mailto:'];

    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    // If URL parsing fails, check for relative URLs
    // Only allow paths starting with / or alphanumeric
    if (/^(\/[a-zA-Z0-9]|[a-zA-Z0-9])/.test(trimmed)) {
      // Ensure it doesn't contain suspicious patterns
      if (/javascript:|data:|vbscript:/i.test(trimmed)) {
        return null;
      }
      return trimmed;
    }
    return null;
  }
}

/**
 * Escape string for safe use in HTML context.
 * Use when inserting user content into HTML without allowing any tags.
 *
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML insertion
 */
export function escapeHTML(str) {
  if (!str || typeof str !== 'string') return '';

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, char => escapeMap[char]);
}

/**
 * Unescape HTML entities to plain text.
 * Use when you need to convert HTML entities back to their characters.
 *
 * @param {string} str - String with HTML entities
 * @returns {string} String with entities decoded
 */
export function unescapeHTML(str) {
  if (!str || typeof str !== 'string') return '';

  const unescapeMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#39;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' '
  };

  return str.replace(/&(?:amp|lt|gt|quot|#x27|#39|#x2F|nbsp);/g, match => unescapeMap[match] || match);
}

/**
 * Create safe HTML for alert display.
 * Combines sanitization with structure.
 *
 * @param {Object} alert - Alert object with potentially unsafe content
 * @returns {Object} Object with sanitized fields
 */
export function sanitizeAlert(alert) {
  if (!alert) return null;

  return {
    ...alert,
    headline: sanitizeToText(alert.headline),
    description: sanitizeAlertHTML(alert.description),
    instruction: sanitizeAlertHTML(alert.instruction),
    areaDesc: sanitizeToText(alert.areaDesc),
    event: sanitizeToText(alert.event),
    senderName: sanitizeToText(alert.senderName),
    // URLs need special handling
    link: sanitizeURL(alert.link)
  };
}

/**
 * Batch sanitize an array of alerts.
 *
 * @param {Array} alerts - Array of alert objects
 * @returns {Array} Array of sanitized alert objects
 */
export function sanitizeAlerts(alerts) {
  if (!Array.isArray(alerts)) return [];
  return alerts.map(sanitizeAlert).filter(Boolean);
}

/**
 * Check if a string contains potentially dangerous patterns.
 * Useful for logging/monitoring suspicious content.
 *
 * @param {string} str - String to check
 * @returns {boolean} True if suspicious patterns detected
 */
export function hasSuspiciousContent(str) {
  if (!str || typeof str !== 'string') return false;

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /on\w+\s*=/i,  // onclick=, onerror=, etc.
    /expression\s*\(/i,  // CSS expression
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(str));
}
