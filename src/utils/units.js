/**
 * Unit conversion utilities for cross-border data harmonization.
 * Handles US (imperial) and Canadian (metric) measurement systems.
 *
 * @module utils/units
 */

// Temperature conversion
export const celsiusToFahrenheit = (celsius) => {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return null;
  return Math.round((celsius * 9/5) + 32);
};

export const fahrenheitToCelsius = (fahrenheit) => {
  if (fahrenheit === null || fahrenheit === undefined || isNaN(fahrenheit)) return null;
  return Math.round((fahrenheit - 32) * 5/9);
};

/**
 * Normalize temperature to target unit with original preserved.
 * @param {number} value - Temperature value
 * @param {string} sourceUnit - 'C' or 'F'
 * @param {string} targetUnit - 'C' or 'F' (default: 'F' for US-centric display)
 * @returns {{ value: number, unit: string, original: { value: number, unit: string } } | null}
 */
export const normalizeTemperature = (value, sourceUnit, targetUnit = 'F') => {
  if (value === null || value === undefined) return null;

  const normalized = sourceUnit === targetUnit
    ? value
    : sourceUnit === 'C'
      ? celsiusToFahrenheit(value)
      : fahrenheitToCelsius(value);

  return {
    value: normalized,
    unit: targetUnit,
    original: { value, unit: sourceUnit }
  };
};

// Wind speed conversion
export const kphToMph = (kph) => {
  if (kph === null || kph === undefined || isNaN(kph)) return null;
  return Math.round(kph * 0.621371);
};

export const mphToKph = (mph) => {
  if (mph === null || mph === undefined || isNaN(mph)) return null;
  return Math.round(mph * 1.60934);
};

// Distance conversion
export const kmToMiles = (km) => {
  if (km === null || km === undefined || isNaN(km)) return null;
  return Math.round(km * 0.621371 * 10) / 10;
};

export const milesToKm = (miles) => {
  if (miles === null || miles === undefined || isNaN(miles)) return null;
  return Math.round(miles * 1.60934 * 10) / 10;
};

// Precipitation conversion
export const mmToInches = (mm) => {
  if (mm === null || mm === undefined || isNaN(mm)) return null;
  return Math.round(mm * 0.0393701 * 100) / 100;
};

export const inchesToMm = (inches) => {
  if (inches === null || inches === undefined || isNaN(inches)) return null;
  return Math.round(inches * 25.4 * 10) / 10;
};

/**
 * Detect measurement system from alert source.
 * @param {string} source - 'NWS', 'EC', or similar
 * @returns {'imperial' | 'metric'}
 */
export const detectMeasurementSystem = (source) => {
  const metricSources = ['EC', 'ECCC', 'Environment Canada', 'CA'];
  return metricSources.some(s => source?.toUpperCase().includes(s)) ? 'metric' : 'imperial';
};

/**
 * Extract and convert temperature mentions from alert text.
 * Handles patterns like "-5°C", "32°F", "-5 degrees Celsius"
 * @param {string} text - Alert description text
 * @param {string} sourceSystem - 'metric' or 'imperial'
 * @returns {Array<{ original: string, fahrenheit: number, celsius: number }>}
 */
export const extractTemperatures = (text, sourceSystem = 'metric') => {
  if (!text) return [];

  const patterns = [
    /(-?\d+(?:\.\d+)?)\s*°?\s*C(?:elsius)?/gi,
    /(-?\d+(?:\.\d+)?)\s*°?\s*F(?:ahrenheit)?/gi,
    /(-?\d+(?:\.\d+)?)\s*degrees?\s+C(?:elsius)?/gi,
    /(-?\d+(?:\.\d+)?)\s*degrees?\s+F(?:ahrenheit)?/gi
  ];

  const temperatures = [];
  const seen = new Set(); // Avoid duplicates from overlapping patterns

  patterns.forEach((pattern, index) => {
    const isCelsius = index % 2 === 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const key = `${match[0]}-${match.index}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const value = parseFloat(match[1]);
      temperatures.push({
        original: match[0],
        fahrenheit: isCelsius ? celsiusToFahrenheit(value) : Math.round(value),
        celsius: isCelsius ? Math.round(value) : fahrenheitToCelsius(value)
      });
    }
  });

  return temperatures;
};

/**
 * Format temperature with both units for bilingual display.
 * @param {number} value - Temperature value
 * @param {string} unit - 'C' or 'F'
 * @returns {string} Formatted string like "32°F (0°C)"
 */
export const formatTemperatureBilingual = (value, unit = 'F') => {
  if (value === null || value === undefined) return 'N/A';

  if (unit === 'F') {
    const celsius = fahrenheitToCelsius(value);
    return `${value}°F (${celsius}°C)`;
  } else {
    const fahrenheit = celsiusToFahrenheit(value);
    return `${value}°C (${fahrenheit}°F)`;
  }
};

/**
 * Format wind speed with both units.
 * @param {number} value - Wind speed value
 * @param {string} unit - 'mph' or 'kph'
 * @returns {string} Formatted string like "50 mph (80 km/h)"
 */
export const formatWindSpeedBilingual = (value, unit = 'mph') => {
  if (value === null || value === undefined) return 'N/A';

  if (unit === 'mph') {
    const kph = mphToKph(value);
    return `${value} mph (${kph} km/h)`;
  } else {
    const mph = kphToMph(value);
    return `${value} km/h (${mph} mph)`;
  }
};
