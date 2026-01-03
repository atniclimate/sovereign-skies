/**
 * Centralized date/time handling for cross-border alert coordination.
 * Replaces the 4 duplicate date formatting functions found in audit.
 *
 * @module utils/datetime
 */

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { formatDistanceToNow, differenceInMinutes, parseISO, isValid } from 'date-fns';

// Default timezone for Pacific Northwest display
export const DEFAULT_TIMEZONE = 'America/Los_Angeles';

// Timezone map for common zones in PNW region
export const TIMEZONE_MAP = {
  'PST': 'America/Los_Angeles',
  'PDT': 'America/Los_Angeles',
  'MST': 'America/Denver',
  'MDT': 'America/Denver',
  'AKST': 'America/Anchorage',
  'AKDT': 'America/Anchorage',
  // Canadian
  'PT': 'America/Vancouver',
  'MT': 'America/Edmonton'
};

/**
 * Parse alert timestamp to ISO string.
 * Handles various formats from NWS and Environment Canada.
 * @param {string} timeString - Raw timestamp from API
 * @param {string} source - 'NWS' or 'EC' to help with format detection
 * @returns {string|null} ISO 8601 UTC string
 */
export const parseAlertTime = (timeString, source = 'NWS') => {
  if (!timeString) return null;

  try {
    // Already ISO format with timezone
    if (timeString.includes('T') && (timeString.endsWith('Z') || timeString.includes('+') || timeString.match(/-\d{2}:\d{2}$/))) {
      const parsed = parseISO(timeString);
      return isValid(parsed) ? parsed.toISOString() : null;
    }

    // NWS format: 2025-01-03T10:00:00-08:00
    if (source === 'NWS' || timeString.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/)) {
      const parsed = parseISO(timeString);
      return isValid(parsed) ? parsed.toISOString() : null;
    }

    // EC sometimes uses: 2025-01-03T18:00:00Z
    // or: 20250103T180000Z (compact ISO)
    if (timeString.match(/^\d{8}T\d{6}Z?$/)) {
      const formatted = timeString.replace(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/,
        '$1-$2-$3T$4:$5:$6Z'
      );
      const parsed = parseISO(formatted);
      return isValid(parsed) ? parsed.toISOString() : null;
    }

    // Fallback: try direct parse
    const parsed = new Date(timeString);
    return isValid(parsed) ? parsed.toISOString() : null;

  } catch (error) {
    console.warn(`[DateTime] Failed to parse: ${timeString}`, error);
    return null;
  }
};

/**
 * Format timestamp for display in specified timezone.
 * @param {string} isoString - ISO 8601 timestamp
 * @param {string} timezone - IANA timezone (default: America/Los_Angeles)
 * @param {string} format - date-fns format string
 * @returns {string} Formatted date string
 */
export const formatForDisplay = (
  isoString,
  timezone = DEFAULT_TIMEZONE,
  format = 'MMM d, h:mm a zzz'
) => {
  if (!isoString) return 'Unknown';

  try {
    return formatInTimeZone(new Date(isoString), timezone, format);
  } catch (error) {
    console.warn(`[DateTime] Format failed: ${isoString}`, error);
    return 'Unknown';
  }
};

/**
 * Format as relative time ("2 hours ago", "in 30 minutes").
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string} Relative time string
 */
export const formatRelative = (isoString) => {
  if (!isoString) return 'Unknown';

  try {
    return formatDistanceToNow(new Date(isoString), { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Format alert effective/expires range.
 * @param {string} effective - Start time (ISO)
 * @param {string} expires - End time (ISO)
 * @param {string} timezone - Display timezone
 * @returns {string} Formatted range
 */
export const formatAlertTimeRange = (effective, expires, timezone = DEFAULT_TIMEZONE) => {
  const start = formatForDisplay(effective, timezone, 'MMM d, h:mm a');
  const end = formatForDisplay(expires, timezone, 'MMM d, h:mm a zzz');
  return `${start} - ${end}`;
};

/**
 * Check if alert is currently active.
 * @param {string} effective - Start time (ISO)
 * @param {string} expires - End time (ISO)
 * @returns {boolean}
 */
export const isAlertActive = (effective, expires) => {
  const now = new Date();
  const start = effective ? new Date(effective) : new Date(0);
  const end = expires ? new Date(expires) : new Date('2099-12-31');

  return now >= start && now <= end;
};

/**
 * Get minutes until alert expires (for countdown displays).
 * @param {string} expires - Expiration time (ISO)
 * @returns {number} Minutes until expiration (negative if expired)
 */
export const minutesUntilExpiry = (expires) => {
  if (!expires) return Infinity;
  return differenceInMinutes(new Date(expires), new Date());
};

/**
 * Sort comparison function for alerts by time.
 * @param {Object} a - Alert object with effective/sent
 * @param {Object} b - Alert object with effective/sent
 * @returns {number} Comparison result (newest first)
 */
export const compareAlertTimes = (a, b) => {
  const timeA = new Date(a.effective || a.sent || 0);
  const timeB = new Date(b.effective || b.sent || 0);
  return timeB - timeA; // Descending (newest first)
};

/**
 * Get current time in specified timezone (for display).
 * @param {string} timezone - IANA timezone
 * @returns {string} Formatted current time
 */
export const getCurrentTimeInZone = (timezone = DEFAULT_TIMEZONE) => {
  return formatInTimeZone(new Date(), timezone, 'h:mm a zzz');
};

/**
 * Format date only (no time).
 * @param {string} isoString - ISO 8601 timestamp
 * @param {string} timezone - IANA timezone
 * @returns {string} Formatted date
 */
export const formatDateOnly = (isoString, timezone = DEFAULT_TIMEZONE) => {
  return formatForDisplay(isoString, timezone, 'MMMM d, yyyy');
};

/**
 * Format time only (no date).
 * @param {string} isoString - ISO 8601 timestamp
 * @param {string} timezone - IANA timezone
 * @returns {string} Formatted time
 */
export const formatTimeOnly = (isoString, timezone = DEFAULT_TIMEZONE) => {
  return formatForDisplay(isoString, timezone, 'h:mm a');
};

/**
 * Get the start of day in specified timezone.
 * @param {Date} date - Date object
 * @param {string} timezone - IANA timezone
 * @returns {Date} Start of day in that timezone
 */
export const getStartOfDayInZone = (date, timezone = DEFAULT_TIMEZONE) => {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(0, 0, 0, 0);
  return zonedDate;
};

/**
 * Check if two timestamps are on the same day in the given timezone.
 * @param {string} isoA - First timestamp
 * @param {string} isoB - Second timestamp
 * @param {string} timezone - IANA timezone
 * @returns {boolean}
 */
export const isSameDay = (isoA, isoB, timezone = DEFAULT_TIMEZONE) => {
  if (!isoA || !isoB) return false;
  const dayA = formatForDisplay(isoA, timezone, 'yyyy-MM-dd');
  const dayB = formatForDisplay(isoB, timezone, 'yyyy-MM-dd');
  return dayA === dayB;
};

/**
 * Get urgency based on expiration time.
 * @param {string} expires - Expiration time (ISO)
 * @returns {'imminent' | 'soon' | 'later' | 'expired'}
 */
export const getExpiryUrgency = (expires) => {
  const minutes = minutesUntilExpiry(expires);
  if (minutes < 0) return 'expired';
  if (minutes <= 30) return 'imminent';
  if (minutes <= 120) return 'soon';
  return 'later';
};
