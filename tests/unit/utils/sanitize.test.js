/**
 * sanitize.js Unit Tests
 * Tests for XSS sanitization and safe content handling
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeAlertHTML,
  sanitizeToText,
  sanitizeURL,
  escapeHTML,
  unescapeHTML,
  sanitizeAlert,
  sanitizeAlerts,
  hasSuspiciousContent
} from '@utils/sanitize';

describe('sanitize', () => {

  // ==========================================
  // sanitizeAlertHTML (10 tests)
  // ==========================================
  describe('sanitizeAlertHTML', () => {

    it('allows safe paragraph tags', () => {
      const html = '<p>Weather alert for your area.</p>';
      expect(sanitizeAlertHTML(html)).toBe('<p>Weather alert for your area.</p>');
    });

    it('allows basic formatting tags', () => {
      const html = '<strong>Warning:</strong> <em>Severe</em> weather expected';
      expect(sanitizeAlertHTML(html)).toBe('<strong>Warning:</strong> <em>Severe</em> weather expected');
    });

    it('allows list elements', () => {
      const html = '<ul><li>High winds</li><li>Heavy rain</li></ul>';
      expect(sanitizeAlertHTML(html)).toBe('<ul><li>High winds</li><li>Heavy rain</li></ul>');
    });

    it('allows br tags', () => {
      const html = 'Line 1<br>Line 2<br/>Line 3';
      const result = sanitizeAlertHTML(html);
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });

    it('removes script tags', () => {
      const html = 'Alert<script>alert("xss")</script> content';
      expect(sanitizeAlertHTML(html)).toBe('Alert content');
    });

    it('removes onclick handlers', () => {
      const html = '<p onclick="alert(1)">Click me</p>';
      expect(sanitizeAlertHTML(html)).toBe('<p>Click me</p>');
    });

    it('removes onerror handlers', () => {
      const html = '<img onerror="alert(1)" src="invalid">';
      expect(sanitizeAlertHTML(html)).toBe('');
    });

    it('removes style tags', () => {
      const html = '<style>body { display: none; }</style><p>Content</p>';
      expect(sanitizeAlertHTML(html)).toBe('<p>Content</p>');
    });

    it('removes iframes', () => {
      const html = '<iframe src="https://evil.com"></iframe><p>Alert</p>';
      expect(sanitizeAlertHTML(html)).toBe('<p>Alert</p>');
    });

    it('returns empty string for null/undefined input', () => {
      expect(sanitizeAlertHTML(null)).toBe('');
      expect(sanitizeAlertHTML(undefined)).toBe('');
      expect(sanitizeAlertHTML('')).toBe('');
    });

  });

  // ==========================================
  // sanitizeToText (6 tests)
  // ==========================================
  describe('sanitizeToText', () => {

    it('strips all HTML tags', () => {
      const html = '<p>Plain <strong>text</strong> content</p>';
      expect(sanitizeToText(html)).toBe('Plain text content');
    });

    it('removes script content', () => {
      const html = 'Before<script>evil()</script>After';
      expect(sanitizeToText(html)).toBe('BeforeAfter');
    });

    it('handles nested tags', () => {
      const html = '<div><p><span>Deep <em>nested</em></span></p></div>';
      expect(sanitizeToText(html)).toBe('Deep nested');
    });

    it('preserves plain text', () => {
      const text = 'No HTML here, just plain text.';
      expect(sanitizeToText(text)).toBe('No HTML here, just plain text.');
    });

    it('handles empty strings', () => {
      expect(sanitizeToText('')).toBe('');
    });

    it('returns empty for non-string input', () => {
      expect(sanitizeToText(123)).toBe('');
      expect(sanitizeToText({})).toBe('');
    });

  });

  // ==========================================
  // sanitizeURL (10 tests)
  // ==========================================
  describe('sanitizeURL', () => {

    it('allows https URLs', () => {
      const url = 'https://weather.gov/alerts';
      expect(sanitizeURL(url)).toBe('https://weather.gov/alerts');
    });

    it('allows http URLs', () => {
      const url = 'http://weather.gc.ca/warnings';
      expect(sanitizeURL(url)).toBe('http://weather.gc.ca/warnings');
    });

    it('allows mailto URLs', () => {
      const url = 'mailto:alerts@weather.gov';
      expect(sanitizeURL(url)).toBe('mailto:alerts@weather.gov');
    });

    it('blocks javascript: protocol', () => {
      const url = 'javascript:alert(1)';
      expect(sanitizeURL(url)).toBeNull();
    });

    it('blocks data: protocol', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      expect(sanitizeURL(url)).toBeNull();
    });

    it('blocks vbscript: protocol', () => {
      const url = 'vbscript:msgbox("xss")';
      expect(sanitizeURL(url)).toBeNull();
    });

    it('allows relative paths starting with /', () => {
      const url = '/alerts/current';
      expect(sanitizeURL(url)).toBe('/alerts/current');
    });

    it('allows relative paths starting with alphanumeric', () => {
      const url = 'alerts/current';
      expect(sanitizeURL(url)).toBe('alerts/current');
    });

    it('blocks suspicious patterns in relative URLs', () => {
      const url = '/path/javascript:alert(1)';
      expect(sanitizeURL(url)).toBeNull();
    });

    it('returns null for empty/null input', () => {
      expect(sanitizeURL(null)).toBeNull();
      expect(sanitizeURL('')).toBeNull();
      expect(sanitizeURL(undefined)).toBeNull();
    });

  });

  // ==========================================
  // escapeHTML (6 tests)
  // ==========================================
  describe('escapeHTML', () => {

    it('escapes angle brackets', () => {
      expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes ampersands', () => {
      expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes quotes', () => {
      expect(escapeHTML('"Hello"')).toBe('&quot;Hello&quot;');
    });

    it('escapes single quotes', () => {
      expect(escapeHTML("It's fine")).toBe("It&#x27;s fine");
    });

    it('escapes forward slashes', () => {
      expect(escapeHTML('path/to/file')).toBe('path&#x2F;to&#x2F;file');
    });

    it('returns empty for non-string input', () => {
      expect(escapeHTML(null)).toBe('');
      expect(escapeHTML(undefined)).toBe('');
    });

  });

  // ==========================================
  // unescapeHTML (5 tests)
  // ==========================================
  describe('unescapeHTML', () => {

    it('unescapes angle brackets', () => {
      expect(unescapeHTML('&lt;script&gt;')).toBe('<script>');
    });

    it('unescapes ampersands', () => {
      expect(unescapeHTML('Tom &amp; Jerry')).toBe('Tom & Jerry');
    });

    it('unescapes quotes', () => {
      expect(unescapeHTML('&quot;Hello&quot;')).toBe('"Hello"');
    });

    it('unescapes nbsp', () => {
      expect(unescapeHTML('Hello&nbsp;World')).toBe('Hello World');
    });

    it('returns empty for non-string input', () => {
      expect(unescapeHTML(null)).toBe('');
      expect(unescapeHTML(undefined)).toBe('');
    });

  });

  // ==========================================
  // sanitizeAlert (7 tests)
  // ==========================================
  describe('sanitizeAlert', () => {

    it('sanitizes headline as plain text', () => {
      const alert = { headline: '<b>Severe</b> Weather Alert' };
      const result = sanitizeAlert(alert);
      expect(result.headline).toBe('Severe Weather Alert');
    });

    it('sanitizes description with allowed HTML', () => {
      const alert = { description: '<p>Heavy rain expected</p><script>bad()</script>' };
      const result = sanitizeAlert(alert);
      expect(result.description).toBe('<p>Heavy rain expected</p>');
    });

    it('sanitizes instruction with allowed HTML', () => {
      const alert = {
        instruction: '<ul><li>Stay indoors</li></ul><iframe src="evil.com"></iframe>'
      };
      const result = sanitizeAlert(alert);
      expect(result.instruction).toBe('<ul><li>Stay indoors</li></ul>');
    });

    it('sanitizes areaDesc as plain text', () => {
      const alert = { areaDesc: '<em>King County</em>' };
      const result = sanitizeAlert(alert);
      expect(result.areaDesc).toBe('King County');
    });

    it('sanitizes URLs', () => {
      const alert = { link: 'javascript:alert(1)' };
      const result = sanitizeAlert(alert);
      expect(result.link).toBeNull();
    });

    it('preserves valid URLs', () => {
      const alert = { link: 'https://weather.gov/alert/123' };
      const result = sanitizeAlert(alert);
      expect(result.link).toBe('https://weather.gov/alert/123');
    });

    it('returns null for null input', () => {
      expect(sanitizeAlert(null)).toBeNull();
    });

  });

  // ==========================================
  // sanitizeAlerts (3 tests)
  // ==========================================
  describe('sanitizeAlerts', () => {

    it('sanitizes array of alerts', () => {
      const alerts = [
        { headline: '<b>Alert 1</b>' },
        { headline: '<script>bad</script>Alert 2' }
      ];
      const result = sanitizeAlerts(alerts);
      expect(result).toHaveLength(2);
      expect(result[0].headline).toBe('Alert 1');
      expect(result[1].headline).toBe('Alert 2');
    });

    it('filters out null results', () => {
      const alerts = [{ headline: 'Valid' }, null, { headline: 'Also valid' }];
      const result = sanitizeAlerts(alerts);
      expect(result).toHaveLength(2);
    });

    it('returns empty array for non-array input', () => {
      expect(sanitizeAlerts(null)).toEqual([]);
      expect(sanitizeAlerts(undefined)).toEqual([]);
      expect(sanitizeAlerts('string')).toEqual([]);
    });

  });

  // ==========================================
  // hasSuspiciousContent (8 tests)
  // ==========================================
  describe('hasSuspiciousContent', () => {

    it('detects script tags', () => {
      expect(hasSuspiciousContent('<script>bad()</script>')).toBe(true);
    });

    it('detects javascript: protocol', () => {
      expect(hasSuspiciousContent('javascript:alert(1)')).toBe(true);
    });

    it('detects data:text/html', () => {
      expect(hasSuspiciousContent('data:text/html,<script>')).toBe(true);
    });

    it('detects onclick handlers', () => {
      expect(hasSuspiciousContent('onclick=alert(1)')).toBe(true);
    });

    it('detects onerror handlers', () => {
      expect(hasSuspiciousContent('onerror=bad()')).toBe(true);
    });

    it('detects iframe tags', () => {
      expect(hasSuspiciousContent('<iframe src="evil.com">')).toBe(true);
    });

    it('returns false for safe content', () => {
      expect(hasSuspiciousContent('Normal weather alert content')).toBe(false);
    });

    it('returns false for null/empty input', () => {
      expect(hasSuspiciousContent(null)).toBe(false);
      expect(hasSuspiciousContent('')).toBe(false);
    });

  });

});
