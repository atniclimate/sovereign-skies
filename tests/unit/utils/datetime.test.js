/**
 * datetime.js Unit Tests
 * Tests for centralized date/time handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_TIMEZONE,
  TIMEZONE_MAP,
  parseAlertTime,
  formatForDisplay,
  formatRelative,
  formatAlertTimeRange,
  isAlertActive,
  minutesUntilExpiry,
  compareAlertTimes,
  getCurrentTimeInZone,
  formatDateOnly,
  formatTimeOnly,
  isSameDay,
  getExpiryUrgency
} from '@utils/datetime';

describe('datetime', () => {

  // ==========================================
  // Constants (3 tests)
  // ==========================================
  describe('constants', () => {

    it('DEFAULT_TIMEZONE is Pacific', () => {
      expect(DEFAULT_TIMEZONE).toBe('America/Los_Angeles');
    });

    it('TIMEZONE_MAP includes PST/PDT', () => {
      expect(TIMEZONE_MAP.PST).toBe('America/Los_Angeles');
      expect(TIMEZONE_MAP.PDT).toBe('America/Los_Angeles');
    });

    it('TIMEZONE_MAP includes Canadian timezones', () => {
      expect(TIMEZONE_MAP.PT).toBe('America/Vancouver');
      expect(TIMEZONE_MAP.MT).toBe('America/Edmonton');
    });
  });

  // ==========================================
  // parseAlertTime (8 tests)
  // ==========================================
  describe('parseAlertTime', () => {

    it('parses ISO format with positive timezone offset', () => {
      const result = parseAlertTime('2025-01-03T10:00:00+05:30');
      expect(result).toBe('2025-01-03T04:30:00.000Z');
    });

    it('parses ISO format with negative timezone offset', () => {
      const result = parseAlertTime('2025-01-03T10:00:00-08:00');
      expect(result).toBe('2025-01-03T18:00:00.000Z');
    });

    it('parses UTC format', () => {
      const result = parseAlertTime('2025-01-03T18:00:00Z');
      expect(result).toBe('2025-01-03T18:00:00.000Z');
    });

    it('parses compact ISO format from EC', () => {
      const result = parseAlertTime('20250103T180000Z', 'EC');
      expect(result).toBe('2025-01-03T18:00:00.000Z');
    });

    it('parses compact ISO without Z', () => {
      const result = parseAlertTime('20250103T180000', 'EC');
      expect(result).toBe('2025-01-03T18:00:00.000Z');
    });

    it('returns null for invalid input', () => {
      expect(parseAlertTime('not a date')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseAlertTime(null)).toBeNull();
    });

    it('handles NWS format explicitly', () => {
      const result = parseAlertTime('2025-01-03T10:00:00-08:00', 'NWS');
      expect(result).toBe('2025-01-03T18:00:00.000Z');
    });
  });

  // ==========================================
  // formatForDisplay (5 tests)
  // ==========================================
  describe('formatForDisplay', () => {

    it('formats in Pacific timezone', () => {
      const result = formatForDisplay('2025-01-03T18:00:00.000Z', 'America/Los_Angeles');
      expect(result).toContain('10:00');
      expect(result).toContain('AM');
    });

    it('formats in Mountain timezone', () => {
      const result = formatForDisplay('2025-01-03T18:00:00.000Z', 'America/Denver');
      expect(result).toContain('11:00');
    });

    it('uses default timezone when not specified', () => {
      const result = formatForDisplay('2025-01-03T18:00:00.000Z');
      expect(result).not.toBe('Unknown');
    });

    it('supports custom format string', () => {
      const result = formatForDisplay('2025-01-03T18:00:00.000Z', 'America/Los_Angeles', 'yyyy-MM-dd');
      expect(result).toBe('2025-01-03');
    });

    it('returns Unknown for null input', () => {
      expect(formatForDisplay(null)).toBe('Unknown');
    });
  });

  // ==========================================
  // formatRelative (3 tests)
  // ==========================================
  describe('formatRelative', () => {

    it('returns relative time for past dates', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const result = formatRelative(pastDate);
      expect(result).toContain('ago');
    });

    it('returns relative time for future dates', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      const result = formatRelative(futureDate);
      expect(result).toContain('in');
    });

    it('returns Unknown for null', () => {
      expect(formatRelative(null)).toBe('Unknown');
    });
  });

  // ==========================================
  // formatAlertTimeRange (2 tests)
  // ==========================================
  describe('formatAlertTimeRange', () => {

    it('formats start and end times', () => {
      const result = formatAlertTimeRange(
        '2025-01-03T10:00:00.000Z',
        '2025-01-03T18:00:00.000Z'
      );
      expect(result).toContain(' - ');
    });

    it('includes timezone in end time', () => {
      const result = formatAlertTimeRange(
        '2025-01-03T10:00:00.000Z',
        '2025-01-03T18:00:00.000Z',
        'America/Los_Angeles'
      );
      expect(result).toMatch(/PST|PDT|PT/);
    });
  });

  // ==========================================
  // isAlertActive (5 tests)
  // ==========================================
  describe('isAlertActive', () => {

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-03T15:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for active alert', () => {
      expect(isAlertActive(
        '2025-01-03T10:00:00Z',
        '2025-01-03T20:00:00Z'
      )).toBe(true);
    });

    it('returns false for expired alert', () => {
      expect(isAlertActive(
        '2025-01-03T10:00:00Z',
        '2025-01-03T14:00:00Z'
      )).toBe(false);
    });

    it('returns false for future alert', () => {
      expect(isAlertActive(
        '2025-01-03T16:00:00Z',
        '2025-01-03T20:00:00Z'
      )).toBe(false);
    });

    it('handles null effective (starts from epoch)', () => {
      expect(isAlertActive(null, '2025-01-03T20:00:00Z')).toBe(true);
    });

    it('handles null expires (ends far future)', () => {
      expect(isAlertActive('2025-01-03T10:00:00Z', null)).toBe(true);
    });
  });

  // ==========================================
  // minutesUntilExpiry (4 tests)
  // ==========================================
  describe('minutesUntilExpiry', () => {

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-03T15:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns positive for future expiry', () => {
      const result = minutesUntilExpiry('2025-01-03T16:00:00Z');
      expect(result).toBe(60);
    });

    it('returns negative for past expiry', () => {
      const result = minutesUntilExpiry('2025-01-03T14:00:00Z');
      expect(result).toBe(-60);
    });

    it('returns Infinity for null expiry', () => {
      expect(minutesUntilExpiry(null)).toBe(Infinity);
    });

    it('returns 0 for current time expiry', () => {
      const result = minutesUntilExpiry('2025-01-03T15:00:00Z');
      expect(result).toBe(0);
    });
  });

  // ==========================================
  // compareAlertTimes (4 tests)
  // ==========================================
  describe('compareAlertTimes', () => {

    it('sorts newest first', () => {
      const alerts = [
        { effective: '2025-01-03T10:00:00Z' },
        { effective: '2025-01-03T15:00:00Z' },
        { effective: '2025-01-03T12:00:00Z' }
      ];
      const sorted = alerts.sort(compareAlertTimes);
      expect(sorted[0].effective).toBe('2025-01-03T15:00:00Z');
      expect(sorted[2].effective).toBe('2025-01-03T10:00:00Z');
    });

    it('uses sent as fallback when effective is missing', () => {
      const alerts = [
        { sent: '2025-01-03T10:00:00Z' },
        { sent: '2025-01-03T15:00:00Z' }
      ];
      const sorted = alerts.sort(compareAlertTimes);
      expect(sorted[0].sent).toBe('2025-01-03T15:00:00Z');
    });

    it('handles missing timestamps', () => {
      const alerts = [
        { effective: '2025-01-03T10:00:00Z' },
        {}
      ];
      const sorted = alerts.sort(compareAlertTimes);
      expect(sorted[0].effective).toBe('2025-01-03T10:00:00Z');
    });

    it('maintains stable order for equal times', () => {
      const alerts = [
        { id: 'first', effective: '2025-01-03T10:00:00Z' },
        { id: 'second', effective: '2025-01-03T10:00:00Z' }
      ];
      const sorted = alerts.sort(compareAlertTimes);
      expect(sorted[0].id).toBe('first');
    });
  });

  // ==========================================
  // Helper Functions (6 tests)
  // ==========================================
  describe('helper functions', () => {

    it('getCurrentTimeInZone returns formatted time', () => {
      const result = getCurrentTimeInZone('America/Los_Angeles');
      expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });

    it('formatDateOnly returns date without time', () => {
      const result = formatDateOnly('2025-01-03T18:00:00.000Z');
      expect(result).toContain('January');
      expect(result).toContain('2025');
      expect(result).not.toContain(':');
    });

    it('formatTimeOnly returns time without date', () => {
      const result = formatTimeOnly('2025-01-03T18:00:00.000Z', 'America/Los_Angeles');
      expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });

    it('isSameDay returns true for same day', () => {
      expect(isSameDay(
        '2025-01-03T10:00:00Z',
        '2025-01-03T18:00:00Z',
        'America/Los_Angeles'
      )).toBe(true);
    });

    it('isSameDay returns false for different days', () => {
      expect(isSameDay(
        '2025-01-03T10:00:00Z',
        '2025-01-04T10:00:00Z'
      )).toBe(false);
    });

    it('isSameDay handles null inputs', () => {
      expect(isSameDay(null, '2025-01-03T10:00:00Z')).toBe(false);
    });
  });

  // ==========================================
  // getExpiryUrgency (4 tests)
  // ==========================================
  describe('getExpiryUrgency', () => {

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-03T15:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns imminent for < 30 minutes', () => {
      expect(getExpiryUrgency('2025-01-03T15:20:00Z')).toBe('imminent');
    });

    it('returns soon for 30-120 minutes', () => {
      expect(getExpiryUrgency('2025-01-03T16:00:00Z')).toBe('soon');
    });

    it('returns later for > 120 minutes', () => {
      expect(getExpiryUrgency('2025-01-03T20:00:00Z')).toBe('later');
    });

    it('returns expired for past expiry', () => {
      expect(getExpiryUrgency('2025-01-03T14:00:00Z')).toBe('expired');
    });
  });

});
