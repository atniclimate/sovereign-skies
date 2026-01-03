/**
 * safeParse.js Unit Tests
 * Tests for error-isolated parsing utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  safeParseXML,
  safeParseJSON,
  safeXMLText,
  safeXMLAttr,
  safeXMLQueryAll,
  safeProcessBatch,
  safeGet,
  safeParseNumber,
  safeParseCoordinates
} from '@utils/safeParse';

describe('safeParse', () => {

  // ==========================================
  // safeParseXML (6 tests)
  // ==========================================
  describe('safeParseXML', () => {

    it('parses valid XML', () => {
      const xml = '<root><item>Value</item></root>';
      const doc = safeParseXML(xml);
      expect(doc).not.toBeNull();
      expect(doc.querySelector('item').textContent).toBe('Value');
    });

    it('parses XML with attributes', () => {
      const xml = '<alert id="123"><headline>Warning</headline></alert>';
      const doc = safeParseXML(xml);
      expect(doc).not.toBeNull();
      expect(doc.querySelector('alert').getAttribute('id')).toBe('123');
    });

    it('returns null for malformed XML', () => {
      const xml = '<root><unclosed>';
      const doc = safeParseXML(xml);
      expect(doc).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(safeParseXML('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(safeParseXML(null)).toBeNull();
    });

    it('returns null for non-string input', () => {
      expect(safeParseXML(123)).toBeNull();
      expect(safeParseXML({})).toBeNull();
    });

  });

  // ==========================================
  // safeParseJSON (6 tests)
  // ==========================================
  describe('safeParseJSON', () => {

    it('parses valid JSON object', () => {
      const json = '{"name": "test", "value": 123}';
      const result = safeParseJSON(json);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('parses valid JSON array', () => {
      const json = '[1, 2, 3]';
      const result = safeParseJSON(json);
      expect(result).toEqual([1, 2, 3]);
    });

    it('parses nested JSON', () => {
      const json = '{"data": {"items": [1, 2]}}';
      const result = safeParseJSON(json);
      expect(result.data.items).toEqual([1, 2]);
    });

    it('returns null for malformed JSON', () => {
      const json = '{ invalid json }';
      expect(safeParseJSON(json)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(safeParseJSON('')).toBeNull();
    });

    it('returns null for non-string input', () => {
      expect(safeParseJSON(null)).toBeNull();
      expect(safeParseJSON(123)).toBeNull();
    });

  });

  // ==========================================
  // safeXMLText (5 tests)
  // ==========================================
  describe('safeXMLText', () => {

    let doc;

    beforeEach(() => {
      doc = new DOMParser().parseFromString(
        '<root><title>Test Title</title><empty></empty></root>',
        'text/xml'
      );
    });

    it('extracts text content from element', () => {
      expect(safeXMLText(doc, 'title')).toBe('Test Title');
    });

    it('returns default for missing element', () => {
      expect(safeXMLText(doc, 'missing')).toBe('');
      expect(safeXMLText(doc, 'missing', 'default')).toBe('default');
    });

    it('returns default for empty element', () => {
      expect(safeXMLText(doc, 'empty')).toBe('');
    });

    it('returns default for null element', () => {
      expect(safeXMLText(null, 'title')).toBe('');
      expect(safeXMLText(null, 'title', 'fallback')).toBe('fallback');
    });

    it('trims whitespace', () => {
      const docWithSpace = new DOMParser().parseFromString(
        '<root><title>  Spaced  </title></root>',
        'text/xml'
      );
      expect(safeXMLText(docWithSpace, 'title')).toBe('Spaced');
    });

  });

  // ==========================================
  // safeXMLAttr (4 tests)
  // ==========================================
  describe('safeXMLAttr', () => {

    let element;

    beforeEach(() => {
      const doc = new DOMParser().parseFromString(
        '<alert id="123" severity="high"></alert>',
        'text/xml'
      );
      element = doc.querySelector('alert');
    });

    it('extracts attribute value', () => {
      expect(safeXMLAttr(element, 'id')).toBe('123');
      expect(safeXMLAttr(element, 'severity')).toBe('high');
    });

    it('returns default for missing attribute', () => {
      expect(safeXMLAttr(element, 'missing')).toBe('');
      expect(safeXMLAttr(element, 'missing', 'fallback')).toBe('fallback');
    });

    it('returns default for null element', () => {
      expect(safeXMLAttr(null, 'id')).toBe('');
      expect(safeXMLAttr(null, 'id', 'default')).toBe('default');
    });

    it('handles undefined element', () => {
      expect(safeXMLAttr(undefined, 'id', 'safe')).toBe('safe');
    });

  });

  // ==========================================
  // safeXMLQueryAll (4 tests)
  // ==========================================
  describe('safeXMLQueryAll', () => {

    let doc;

    beforeEach(() => {
      doc = new DOMParser().parseFromString(
        '<root><item>A</item><item>B</item><item>C</item></root>',
        'text/xml'
      );
    });

    it('returns array of matching elements', () => {
      const items = safeXMLQueryAll(doc, 'item');
      expect(items).toHaveLength(3);
      expect(items[0].textContent).toBe('A');
    });

    it('returns empty array for no matches', () => {
      const items = safeXMLQueryAll(doc, 'missing');
      expect(items).toEqual([]);
    });

    it('returns empty array for null element', () => {
      expect(safeXMLQueryAll(null, 'item')).toEqual([]);
    });

    it('returns actual array (not NodeList)', () => {
      const items = safeXMLQueryAll(doc, 'item');
      expect(Array.isArray(items)).toBe(true);
    });

  });

  // ==========================================
  // safeProcessBatch (6 tests)
  // ==========================================
  describe('safeProcessBatch', () => {

    it('processes all items successfully', () => {
      const items = [1, 2, 3];
      const results = safeProcessBatch(items, (x) => x * 2);
      expect(results).toEqual([2, 4, 6]);
    });

    it('skips failed items and continues', () => {
      const items = [1, 2, 3];
      const results = safeProcessBatch(items, (x) => {
        if (x === 2) throw new Error('Skip this');
        return x * 2;
      });
      expect(results).toEqual([2, 6]);
    });

    it('filters out null/undefined results', () => {
      const items = [1, 2, 3];
      const results = safeProcessBatch(items, (x) => (x === 2 ? null : x));
      expect(results).toEqual([1, 3]);
    });

    it('provides index to processor', () => {
      const items = ['a', 'b', 'c'];
      const results = safeProcessBatch(items, (item, idx) => `${item}-${idx}`);
      expect(results).toEqual(['a-0', 'b-1', 'c-2']);
    });

    it('returns empty array for non-array input', () => {
      expect(safeProcessBatch(null, (x) => x)).toEqual([]);
      expect(safeProcessBatch('string', (x) => x)).toEqual([]);
    });

    it('handles all items failing', () => {
      const items = [1, 2, 3];
      const results = safeProcessBatch(items, () => {
        throw new Error('All fail');
      });
      expect(results).toEqual([]);
    });

  });

  // ==========================================
  // safeGet (7 tests)
  // ==========================================
  describe('safeGet', () => {

    const obj = {
      level1: {
        level2: {
          value: 'deep'
        },
        array: [1, 2, 3]
      },
      simple: 'top'
    };

    it('gets top-level property', () => {
      expect(safeGet(obj, 'simple')).toBe('top');
    });

    it('gets nested property', () => {
      expect(safeGet(obj, 'level1.level2.value')).toBe('deep');
    });

    it('returns default for missing path', () => {
      expect(safeGet(obj, 'missing.path')).toBeUndefined();
      expect(safeGet(obj, 'missing.path', 'default')).toBe('default');
    });

    it('returns default for null object', () => {
      expect(safeGet(null, 'any.path', 'fallback')).toBe('fallback');
    });

    it('returns default for undefined object', () => {
      expect(safeGet(undefined, 'any.path', 'fallback')).toBe('fallback');
    });

    it('handles partial path exists', () => {
      expect(safeGet(obj, 'level1.missing.deep', 'default')).toBe('default');
    });

    it('returns actual value if exists (even if falsy)', () => {
      const testObj = { zero: 0, empty: '', nullVal: null };
      expect(safeGet(testObj, 'zero', 'default')).toBe(0);
      expect(safeGet(testObj, 'empty', 'default')).toBe('');
      // null is treated as missing (returns default)
    });

  });

  // ==========================================
  // safeParseNumber (6 tests)
  // ==========================================
  describe('safeParseNumber', () => {

    it('returns number as-is', () => {
      expect(safeParseNumber(42)).toBe(42);
      expect(safeParseNumber(3.14)).toBe(3.14);
    });

    it('parses string numbers', () => {
      expect(safeParseNumber('42')).toBe(42);
      expect(safeParseNumber('3.14')).toBe(3.14);
    });

    it('parses negative numbers', () => {
      expect(safeParseNumber('-10')).toBe(-10);
      expect(safeParseNumber(-10)).toBe(-10);
    });

    it('returns default for NaN', () => {
      expect(safeParseNumber(NaN)).toBe(0);
      expect(safeParseNumber(NaN, 99)).toBe(99);
    });

    it('returns default for non-numeric strings', () => {
      expect(safeParseNumber('abc')).toBe(0);
      expect(safeParseNumber('abc', 100)).toBe(100);
    });

    it('returns default for non-number types', () => {
      expect(safeParseNumber(null)).toBe(0);
      expect(safeParseNumber(undefined)).toBe(0);
      expect(safeParseNumber({})).toBe(0);
    });

  });

  // ==========================================
  // safeParseCoordinates (8 tests)
  // ==========================================
  describe('safeParseCoordinates', () => {

    it('parses valid coordinates from numbers', () => {
      const result = safeParseCoordinates(47.6062, -122.3321);
      expect(result).toEqual([-122.3321, 47.6062]); // GeoJSON order [lon, lat]
    });

    it('parses valid coordinates from strings', () => {
      const result = safeParseCoordinates('47.6062', '-122.3321');
      expect(result).toEqual([-122.3321, 47.6062]);
    });

    it('returns null for invalid latitude (> 90)', () => {
      expect(safeParseCoordinates(91, -122)).toBeNull();
    });

    it('returns null for invalid latitude (< -90)', () => {
      expect(safeParseCoordinates(-91, -122)).toBeNull();
    });

    it('returns null for invalid longitude (> 180)', () => {
      expect(safeParseCoordinates(47, 181)).toBeNull();
    });

    it('returns null for invalid longitude (< -180)', () => {
      expect(safeParseCoordinates(47, -181)).toBeNull();
    });

    it('returns null for non-numeric input', () => {
      expect(safeParseCoordinates('abc', -122)).toBeNull();
      expect(safeParseCoordinates(47, 'xyz')).toBeNull();
    });

    it('handles edge case coordinates', () => {
      // North Pole
      expect(safeParseCoordinates(90, 0)).toEqual([0, 90]);
      // South Pole
      expect(safeParseCoordinates(-90, 0)).toEqual([0, -90]);
      // International Date Line
      expect(safeParseCoordinates(0, 180)).toEqual([180, 0]);
      expect(safeParseCoordinates(0, -180)).toEqual([-180, 0]);
    });

  });

});
