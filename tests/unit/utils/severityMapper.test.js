/**
 * severityMapper.js Unit Tests
 * Tests for unified US/CA severity mapping
 */

import { describe, it, expect } from 'vitest';
import {
  UNIFIED_SEVERITY,
  mapNWSSeverity,
  mapECSeverity,
  getSeverityByLevel,
  compareSeverity,
  applyUnifiedSeverity,
  getSeverityClassName,
  parseSeverityString
} from '@utils/severityMapper';

describe('severityMapper', () => {

  // ==========================================
  // UNIFIED_SEVERITY Constants (5 tests)
  // ==========================================
  describe('UNIFIED_SEVERITY', () => {

    it('has 5 severity levels', () => {
      expect(Object.keys(UNIFIED_SEVERITY).length).toBe(5);
    });

    it('CRITICAL is level 4', () => {
      expect(UNIFIED_SEVERITY.CRITICAL.level).toBe(4);
    });

    it('INFO is level 0', () => {
      expect(UNIFIED_SEVERITY.INFO.level).toBe(0);
    });

    it('all levels have colors defined', () => {
      Object.values(UNIFIED_SEVERITY).forEach(s => {
        expect(s.color).toMatch(/^#[A-F0-9]{6}$/i);
      });
    });

    it('all levels have labels and descriptions', () => {
      Object.values(UNIFIED_SEVERITY).forEach(s => {
        expect(s.label).toBeDefined();
        expect(s.description).toBeDefined();
      });
    });
  });

  // ==========================================
  // NWS Severity Mapping (8 tests)
  // ==========================================
  describe('mapNWSSeverity', () => {

    it('maps Extreme to CRITICAL (level 4)', () => {
      const result = mapNWSSeverity('Extreme', 'Immediate', 'Observed');
      expect(result.level).toBe(4);
    });

    it('maps Severe to HIGH (level 3)', () => {
      const result = mapNWSSeverity('Severe');
      expect(result.level).toBe(3);
    });

    it('maps Moderate to MODERATE (level 2)', () => {
      const result = mapNWSSeverity('Moderate');
      expect(result.level).toBe(2);
    });

    it('maps Minor to LOW (level 1)', () => {
      const result = mapNWSSeverity('Minor');
      expect(result.level).toBe(1);
    });

    it('maps Unknown to INFO (level 0)', () => {
      const result = mapNWSSeverity('Unknown');
      expect(result.level).toBe(0);
    });

    it('boosts severity for Immediate urgency', () => {
      const base = mapNWSSeverity('Moderate');
      const boosted = mapNWSSeverity('Moderate', 'Immediate');
      expect(boosted.level).toBeGreaterThan(base.level);
    });

    it('boosts severity for Observed certainty', () => {
      const base = mapNWSSeverity('Moderate', 'Unknown', 'Unknown');
      const boosted = mapNWSSeverity('Moderate', 'Unknown', 'Observed');
      expect(boosted.level).toBeGreaterThanOrEqual(base.level);
    });

    it('clamps severity to max level 4', () => {
      const result = mapNWSSeverity('Extreme', 'Immediate', 'Observed');
      expect(result.level).toBeLessThanOrEqual(4);
    });
  });

  // ==========================================
  // EC Severity Mapping (8 tests)
  // ==========================================
  describe('mapECSeverity', () => {

    it('maps warning to HIGH (level 3)', () => {
      const result = mapECSeverity('warning');
      expect(result.level).toBe(3);
    });

    it('maps watch to MODERATE (level 2)', () => {
      const result = mapECSeverity('watch');
      expect(result.level).toBe(2);
    });

    it('maps advisory to LOW (level 1)', () => {
      const result = mapECSeverity('advisory');
      expect(result.level).toBe(1);
    });

    it('maps statement to INFO (level 0)', () => {
      const result = mapECSeverity('statement');
      expect(result.level).toBe(0);
    });

    it('boosts tsunami warning to CRITICAL', () => {
      const result = mapECSeverity('warning', 'Tsunami');
      expect(result.level).toBe(4);
    });

    it('boosts tornado warning to CRITICAL', () => {
      const result = mapECSeverity('warning', 'Tornado');
      expect(result.level).toBe(4);
    });

    it('boosts tornado watch to HIGH', () => {
      const result = mapECSeverity('watch', 'Tornado');
      expect(result.level).toBe(3);
    });

    it('handles case insensitivity', () => {
      const result = mapECSeverity('WARNING', 'TSUNAMI');
      expect(result.level).toBe(4);
    });
  });

  // ==========================================
  // getSeverityByLevel (4 tests)
  // ==========================================
  describe('getSeverityByLevel', () => {

    it('returns CRITICAL for level 4', () => {
      expect(getSeverityByLevel(4).label).toBe('Critical');
    });

    it('returns INFO for level 0', () => {
      expect(getSeverityByLevel(0).label).toBe('Informational');
    });

    it('clamps level > 4 to CRITICAL', () => {
      expect(getSeverityByLevel(10).level).toBe(4);
    });

    it('clamps level < 0 to INFO', () => {
      expect(getSeverityByLevel(-5).level).toBe(0);
    });
  });

  // ==========================================
  // compareSeverity (5 tests)
  // ==========================================
  describe('compareSeverity', () => {

    it('returns negative when A is higher severity', () => {
      const alertA = { unifiedSeverity: UNIFIED_SEVERITY.CRITICAL };
      const alertB = { unifiedSeverity: UNIFIED_SEVERITY.LOW };
      expect(compareSeverity(alertA, alertB)).toBeLessThan(0);
    });

    it('returns positive when B is higher severity', () => {
      const alertA = { unifiedSeverity: UNIFIED_SEVERITY.LOW };
      const alertB = { unifiedSeverity: UNIFIED_SEVERITY.CRITICAL };
      expect(compareSeverity(alertA, alertB)).toBeGreaterThan(0);
    });

    it('returns 0 for equal severity', () => {
      const alertA = { unifiedSeverity: UNIFIED_SEVERITY.MODERATE };
      const alertB = { unifiedSeverity: UNIFIED_SEVERITY.MODERATE };
      expect(compareSeverity(alertA, alertB)).toBe(0);
    });

    it('handles missing unifiedSeverity', () => {
      const alertA = {};
      const alertB = { unifiedSeverity: UNIFIED_SEVERITY.HIGH };
      expect(compareSeverity(alertA, alertB)).toBeGreaterThan(0);
    });

    it('sorts array correctly with highest first', () => {
      const alerts = [
        { unifiedSeverity: UNIFIED_SEVERITY.LOW },
        { unifiedSeverity: UNIFIED_SEVERITY.CRITICAL },
        { unifiedSeverity: UNIFIED_SEVERITY.MODERATE }
      ];
      const sorted = alerts.sort(compareSeverity);
      expect(sorted[0].unifiedSeverity.level).toBe(4);
      expect(sorted[2].unifiedSeverity.level).toBe(1);
    });
  });

  // ==========================================
  // applyUnifiedSeverity (6 tests)
  // ==========================================
  describe('applyUnifiedSeverity', () => {

    it('applies NWS mapping for US alerts', () => {
      const alert = { source: 'NWS', severity: 'Severe' };
      const result = applyUnifiedSeverity(alert);
      expect(result.unifiedSeverity.level).toBe(3);
    });

    it('applies EC mapping for Canadian alerts', () => {
      const alert = { source: 'EC', type: 'warning', event: 'Winter Storm' };
      const result = applyUnifiedSeverity(alert);
      expect(result.unifiedSeverity.level).toBe(3);
    });

    it('applies EC mapping for source containing Canada', () => {
      const alert = { source: 'Environment Canada', type: 'advisory' };
      const result = applyUnifiedSeverity(alert);
      expect(result.unifiedSeverity.level).toBe(1);
    });

    it('defaults to NWS mapping for unknown source', () => {
      const alert = { source: 'unknown', severity: 'Moderate' };
      const result = applyUnifiedSeverity(alert);
      expect(result.unifiedSeverity).toBeDefined();
    });

    it('returns null for null input', () => {
      expect(applyUnifiedSeverity(null)).toBeNull();
    });

    it('mutates original alert object', () => {
      const alert = { source: 'NWS', severity: 'Minor' };
      applyUnifiedSeverity(alert);
      expect(alert.unifiedSeverity).toBeDefined();
    });
  });

  // ==========================================
  // getSeverityClassName (4 tests)
  // ==========================================
  describe('getSeverityClassName', () => {

    it('returns severity-critical for level 4', () => {
      expect(getSeverityClassName(4)).toBe('severity-critical');
    });

    it('returns severity-info for level 0', () => {
      expect(getSeverityClassName(0)).toBe('severity-info');
    });

    it('returns severity-info for undefined level', () => {
      expect(getSeverityClassName(undefined)).toBe('severity-info');
    });

    it('handles all levels', () => {
      expect(getSeverityClassName(3)).toBe('severity-high');
      expect(getSeverityClassName(2)).toBe('severity-moderate');
      expect(getSeverityClassName(1)).toBe('severity-low');
    });
  });

  // ==========================================
  // parseSeverityString (6 tests)
  // ==========================================
  describe('parseSeverityString', () => {

    it('parses CRITICAL to level 4', () => {
      expect(parseSeverityString('CRITICAL')).toBe(4);
    });

    it('parses EMERGENCY to level 4', () => {
      expect(parseSeverityString('EMERGENCY')).toBe(4);
    });

    it('parses WARNING to level 3', () => {
      expect(parseSeverityString('WARNING')).toBe(3);
    });

    it('parses NWS severity EXTREME to level 4', () => {
      expect(parseSeverityString('EXTREME')).toBe(4);
    });

    it('handles case insensitivity', () => {
      expect(parseSeverityString('critical')).toBe(4);
      expect(parseSeverityString('Critical')).toBe(4);
    });

    it('returns 0 for unknown strings', () => {
      expect(parseSeverityString('unknown')).toBe(0);
      expect(parseSeverityString(null)).toBe(0);
    });
  });

});
