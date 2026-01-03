/**
 * units.js Unit Tests
 * Tests for cross-border measurement conversion utilities
 */

import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  normalizeTemperature,
  kphToMph,
  mphToKph,
  kmToMiles,
  milesToKm,
  mmToInches,
  inchesToMm,
  detectMeasurementSystem,
  extractTemperatures,
  formatTemperatureBilingual,
  formatWindSpeedBilingual
} from '@utils/units';

describe('units', () => {

  // ==========================================
  // Temperature Conversion (10 tests)
  // ==========================================
  describe('celsiusToFahrenheit', () => {

    it('converts 0°C to 32°F', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
    });

    it('converts -40°C to -40°F (intersection point)', () => {
      expect(celsiusToFahrenheit(-40)).toBe(-40);
    });

    it('converts 100°C to 212°F', () => {
      expect(celsiusToFahrenheit(100)).toBe(212);
    });

    it('converts negative temperatures', () => {
      expect(celsiusToFahrenheit(-20)).toBe(-4);
    });

    it('handles null input', () => {
      expect(celsiusToFahrenheit(null)).toBeNull();
    });

    it('handles undefined input', () => {
      expect(celsiusToFahrenheit(undefined)).toBeNull();
    });

    it('handles NaN input', () => {
      expect(celsiusToFahrenheit(NaN)).toBeNull();
    });
  });

  describe('fahrenheitToCelsius', () => {

    it('converts 32°F to 0°C', () => {
      expect(fahrenheitToCelsius(32)).toBe(0);
    });

    it('converts -40°F to -40°C', () => {
      expect(fahrenheitToCelsius(-40)).toBe(-40);
    });

    it('handles null input', () => {
      expect(fahrenheitToCelsius(null)).toBeNull();
    });
  });

  describe('normalizeTemperature', () => {

    it('converts C to F with original preserved', () => {
      const result = normalizeTemperature(0, 'C', 'F');
      expect(result.value).toBe(32);
      expect(result.unit).toBe('F');
      expect(result.original).toEqual({ value: 0, unit: 'C' });
    });

    it('converts F to C', () => {
      const result = normalizeTemperature(32, 'F', 'C');
      expect(result.value).toBe(0);
      expect(result.unit).toBe('C');
    });

    it('preserves value when source equals target', () => {
      const result = normalizeTemperature(25, 'C', 'C');
      expect(result.value).toBe(25);
    });

    it('returns null for null input', () => {
      expect(normalizeTemperature(null, 'C')).toBeNull();
    });
  });

  // ==========================================
  // Wind Speed Conversion (4 tests)
  // ==========================================
  describe('wind speed conversion', () => {

    it('converts km/h to mph', () => {
      expect(kphToMph(100)).toBe(62);
    });

    it('converts mph to km/h', () => {
      expect(mphToKph(60)).toBe(97);
    });

    it('handles null km/h', () => {
      expect(kphToMph(null)).toBeNull();
    });

    it('handles null mph', () => {
      expect(mphToKph(null)).toBeNull();
    });
  });

  // ==========================================
  // Distance Conversion (4 tests)
  // ==========================================
  describe('distance conversion', () => {

    it('converts km to miles', () => {
      expect(kmToMiles(100)).toBe(62.1);
    });

    it('converts miles to km', () => {
      expect(milesToKm(60)).toBe(96.6);
    });

    it('handles null km', () => {
      expect(kmToMiles(null)).toBeNull();
    });

    it('handles null miles', () => {
      expect(milesToKm(null)).toBeNull();
    });
  });

  // ==========================================
  // Precipitation Conversion (4 tests)
  // ==========================================
  describe('precipitation conversion', () => {

    it('converts mm to inches', () => {
      expect(mmToInches(25.4)).toBe(1);
    });

    it('converts inches to mm', () => {
      expect(inchesToMm(1)).toBe(25.4);
    });

    it('handles null mm', () => {
      expect(mmToInches(null)).toBeNull();
    });

    it('handles null inches', () => {
      expect(inchesToMm(null)).toBeNull();
    });
  });

  // ==========================================
  // Measurement System Detection (6 tests)
  // ==========================================
  describe('detectMeasurementSystem', () => {

    it('returns metric for EC source', () => {
      expect(detectMeasurementSystem('EC')).toBe('metric');
    });

    it('returns metric for Environment Canada', () => {
      expect(detectMeasurementSystem('Environment Canada')).toBe('metric');
    });

    it('returns metric for ECCC', () => {
      expect(detectMeasurementSystem('ECCC')).toBe('metric');
    });

    it('returns imperial for NWS source', () => {
      expect(detectMeasurementSystem('NWS')).toBe('imperial');
    });

    it('returns imperial for unknown source', () => {
      expect(detectMeasurementSystem('unknown')).toBe('imperial');
    });

    it('handles null source', () => {
      expect(detectMeasurementSystem(null)).toBe('imperial');
    });
  });

  // ==========================================
  // Temperature Extraction (8 tests)
  // ==========================================
  describe('extractTemperatures', () => {

    it('extracts Celsius from EC alert text', () => {
      const text = 'Temperatures dropping to -5°C overnight.';
      const temps = extractTemperatures(text, 'metric');
      expect(temps.length).toBe(1);
      expect(temps[0].celsius).toBe(-5);
      expect(temps[0].fahrenheit).toBe(23);
    });

    it('extracts multiple temperatures', () => {
      const text = 'High of 25°C, low of -10°C expected.';
      const temps = extractTemperatures(text);
      expect(temps.length).toBe(2);
    });

    it('extracts Fahrenheit', () => {
      const text = 'Wind chill near -20°F.';
      const temps = extractTemperatures(text);
      expect(temps.length).toBe(1);
      expect(temps[0].fahrenheit).toBe(-20);
      expect(temps[0].celsius).toBe(-29);
    });

    it('handles "degrees Celsius" format', () => {
      const text = 'Low of -15 degrees Celsius expected.';
      const temps = extractTemperatures(text);
      expect(temps.length).toBe(1);
      expect(temps[0].celsius).toBe(-15);
    });

    it('handles "degrees Fahrenheit" format', () => {
      const text = 'Highs near 95 degrees Fahrenheit.';
      const temps = extractTemperatures(text);
      expect(temps.length).toBe(1);
      expect(temps[0].fahrenheit).toBe(95);
    });

    it('returns empty array for text without temperatures', () => {
      expect(extractTemperatures('No temperature mentioned.')).toEqual([]);
    });

    it('returns empty array for null text', () => {
      expect(extractTemperatures(null)).toEqual([]);
    });

    it('preserves original text in result', () => {
      const text = 'Temperatures near -5°C';
      const temps = extractTemperatures(text);
      expect(temps[0].original).toBe('-5°C');
    });
  });

  // ==========================================
  // Bilingual Formatting (4 tests)
  // ==========================================
  describe('formatTemperatureBilingual', () => {

    it('formats Fahrenheit with Celsius in parentheses', () => {
      const result = formatTemperatureBilingual(32, 'F');
      expect(result).toBe('32°F (0°C)');
    });

    it('formats Celsius with Fahrenheit in parentheses', () => {
      const result = formatTemperatureBilingual(0, 'C');
      expect(result).toBe('0°C (32°F)');
    });

    it('returns N/A for null', () => {
      expect(formatTemperatureBilingual(null)).toBe('N/A');
    });
  });

  describe('formatWindSpeedBilingual', () => {

    it('formats mph with km/h in parentheses', () => {
      const result = formatWindSpeedBilingual(60, 'mph');
      expect(result).toBe('60 mph (97 km/h)');
    });

    it('returns N/A for null', () => {
      expect(formatWindSpeedBilingual(null)).toBe('N/A');
    });
  });

});
