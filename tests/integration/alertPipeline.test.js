/**
 * Alert Pipeline Integration Tests
 * End-to-end testing of the alert processing pipeline:
 * Fetch → Parse → Match → Sort → Sanitize → Display
 *
 * Tests cross-border data harmonization between NWS (US) and EC (Canada)
 * alert sources with unified severity mapping.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock data
import {
  mockNWSAlert,
  mockNWSAlertExtreme,
  mockNWSAlertMultiZone,
  mockNWSResponse
} from '../mocks/nwsAlerts';
import {
  mockECAlert,
  mockECAlertArcticOutflow,
  mockECAlertTsunami
} from '../mocks/ecAlerts';
import { mockTribalBoundaries, mockTestPoints } from '../mocks/zones';

// Utilities under test
import { applyUnifiedSeverity, compareSeverity, mapNWSSeverity, mapECSeverity } from '@utils/severityMapper';
import { parseAlertTime, isAlertActive, formatForDisplay } from '@utils/datetime';
import { sanitizeAlert, sanitizeAlerts, hasSuspiciousContent } from '@utils/sanitize';
import { safeParseJSON, safeParseXML, safeProcessBatch } from '@utils/safeParse';
import { matchAlertsToTribes, getAlertsForTribe } from '@services/alertMatcher';

describe('Alert Pipeline Integration', () => {

  // ==========================================
  // Full Pipeline: Fetch → Parse → Match → Sort → Display (7 tests)
  // ==========================================
  describe('Full Pipeline: Fetch → Parse → Match → Sort → Display', () => {

    it('processes NWS alerts through complete pipeline', () => {
      // Simulate fetched NWS data
      const rawAlert = mockNWSAlert;

      // Step 1: Parse (already JSON from NWS API)
      const parsed = safeParseJSON(JSON.stringify(rawAlert));
      expect(parsed).not.toBeNull();
      expect(parsed.id).toBe(rawAlert.id);

      // Step 2: Apply unified severity
      const withSeverity = applyUnifiedSeverity({
        source: 'NWS',
        severity: parsed.severity,
        urgency: parsed.urgency,
        certainty: parsed.certainty,
        event: parsed.event
      });
      expect(withSeverity.unifiedSeverity).toBeDefined();
      expect(withSeverity.unifiedSeverity.level).toBeGreaterThanOrEqual(0);
      expect(withSeverity.unifiedSeverity.level).toBeLessThanOrEqual(4);

      // Step 3: Sanitize
      const sanitized = sanitizeAlert({ ...parsed, ...withSeverity });
      expect(sanitized.headline).toBe(rawAlert.headline);
      expect(sanitized.description).toBeTruthy();

      // Step 4: Parse timestamps
      const effectiveTime = parseAlertTime(parsed.effective, 'NWS');
      expect(effectiveTime).not.toBeNull();
      expect(effectiveTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('processes EC alerts through complete pipeline', () => {
      const rawAlert = mockECAlert;

      // Step 1: Parse info structure
      const info = rawAlert.info;
      expect(info.event).toBeDefined();

      // Step 2: Apply unified severity (EC uses type-based mapping)
      const withSeverity = applyUnifiedSeverity({
        source: 'EC',
        type: 'warning',
        event: info.event
      });
      expect(withSeverity.unifiedSeverity).toBeDefined();

      // Step 3: Sanitize
      const sanitized = sanitizeAlert({
        ...rawAlert,
        headline: info.headline,
        description: info.description,
        instruction: info.instruction
      });
      expect(sanitized.headline).toContain('Winter Storm');

      // Step 4: Parse timestamps
      const effectiveTime = parseAlertTime(info.effective, 'EC');
      expect(effectiveTime).not.toBeNull();
    });

    it('sorts mixed US and Canadian alerts by unified severity', () => {
      const alerts = [
        // Low severity US alert
        {
          id: 'us-1',
          source: 'NWS',
          severity: 'Minor',
          urgency: 'Expected',
          certainty: 'Possible',
          event: 'Frost Advisory'
        },
        // High severity Canadian alert (warning = level 3)
        {
          id: 'ca-1',
          source: 'EC',
          type: 'warning',
          event: 'winter storm warning'
        },
        // Critical severity US alert
        {
          id: 'us-2',
          source: 'NWS',
          severity: 'Extreme',
          urgency: 'Immediate',
          certainty: 'Observed',
          event: 'Tsunami Warning'
        }
      ];

      // Apply unified severity to all
      alerts.forEach(alert => applyUnifiedSeverity(alert));

      // Sort by severity
      alerts.sort(compareSeverity);

      // Highest severity first
      expect(alerts[0].id).toBe('us-2');  // Tsunami Warning (Critical)
      expect(alerts[1].id).toBe('ca-1');  // Winter Storm Warning (High)
      expect(alerts[2].id).toBe('us-1');  // Frost Advisory (Low)
    });

    it('filters to only active alerts based on timestamps', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
      const oneHourFromNow = new Date(now.getTime() + 3600000).toISOString();
      const twoHoursAgo = new Date(now.getTime() - 7200000).toISOString();
      const threeHoursAgo = new Date(now.getTime() - 10800000).toISOString();

      const alerts = [
        { id: 'active', effective: oneHourAgo, expires: oneHourFromNow },
        { id: 'expired', effective: threeHoursAgo, expires: twoHoursAgo },
        { id: 'future', effective: oneHourFromNow, expires: new Date(now.getTime() + 7200000).toISOString() }
      ];

      const activeAlerts = alerts.filter(a => isAlertActive(a.effective, a.expires));

      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].id).toBe('active');
    });

    it('handles malformed alerts gracefully in batch processing', () => {
      const alerts = [
        { id: 'good-1', headline: 'Valid Alert 1' },
        null,  // Invalid
        { id: 'good-2', headline: 'Valid Alert 2' },
        undefined,  // Invalid
        'not an object',  // Invalid
        { id: 'good-3', headline: 'Valid Alert 3' }
      ];

      const processed = safeProcessBatch(
        alerts,
        (alert) => {
          if (!alert || typeof alert !== 'object') return null;
          return sanitizeAlert(alert);
        },
        'AlertPipeline'
      );

      expect(processed).toHaveLength(3);
      expect(processed.map(a => a.id)).toEqual(['good-1', 'good-2', 'good-3']);
    });

    it('maintains data integrity through pipeline transformations', () => {
      const original = {
        id: 'integrity-test',
        event: 'Winter Storm Warning',
        headline: 'Winter Storm Warning issued',
        description: 'Heavy snow expected with accumulations of 8-12 inches.',
        instruction: 'Stay home if possible.',
        areaDesc: 'Whatcom County',
        effective: '2025-01-03T10:00:00-08:00',
        expires: '2025-01-03T22:00:00-08:00',
        severity: 'Moderate',
        urgency: 'Expected',
        certainty: 'Likely'
      };

      // Run through pipeline
      const withSeverity = { ...original };
      applyUnifiedSeverity({
        source: 'NWS',
        severity: withSeverity.severity,
        urgency: withSeverity.urgency,
        certainty: withSeverity.certainty,
        event: withSeverity.event
      });

      const sanitized = sanitizeAlert(withSeverity);

      // Verify critical fields preserved
      expect(sanitized.id).toBe(original.id);
      expect(sanitized.event).toBe(original.event);
      expect(sanitized.areaDesc).toBe(original.areaDesc);
    });

    it('properly sanitizes XSS attempts in alert content', () => {
      const maliciousAlert = {
        id: 'xss-test',
        headline: '<script>alert("XSS")</script>Winter Storm Warning',
        description: '<img src="x" onerror="alert(1)">Heavy snow expected.',
        instruction: '<a href="javascript:alert(1)">Click here</a>',
        areaDesc: 'Whatcom County<iframe src="evil.com"></iframe>'
      };

      const sanitized = sanitizeAlert(maliciousAlert);

      // XSS vectors should be removed
      expect(sanitized.headline).not.toContain('<script>');
      expect(sanitized.description).not.toContain('onerror');
      expect(sanitized.instruction).not.toContain('javascript:');
      expect(sanitized.areaDesc).not.toContain('<iframe');

      // Content should be preserved
      expect(sanitized.headline).toContain('Winter Storm Warning');
      expect(sanitized.description).toContain('Heavy snow');
    });

  });

  // ==========================================
  // Cross-Border Data Consistency (5 tests)
  // ==========================================
  describe('Cross-Border Data Consistency', () => {

    it('maps NWS severity levels correctly', () => {
      // Extreme + Immediate + Observed = Critical (4)
      const extreme = mapNWSSeverity('Extreme', 'Immediate', 'Observed');
      expect(extreme.level).toBe(4);

      // Severe + Expected + Likely = High (3) or Critical (4) depending on boosts
      // Base 3 + 0.5 (Expected) + 0.25 (Likely) = 3.75 rounds to 4
      const severe = mapNWSSeverity('Severe', 'Expected', 'Likely');
      expect(severe.level).toBeGreaterThanOrEqual(3);
      expect(severe.level).toBeLessThanOrEqual(4);

      // Moderate + Future + Possible = Moderate (2)
      // Base 2 + 0 (Future) + 0 (Possible) = 2
      const moderate = mapNWSSeverity('Moderate', 'Future', 'Possible');
      expect(moderate.level).toBe(2);

      // Minor + Future + Unlikely = Low (1) or Info (0)
      const minor = mapNWSSeverity('Minor', 'Future', 'Unlikely');
      expect(minor.level).toBeLessThanOrEqual(1);
    });

    it('maps EC severity types correctly', () => {
      // Warning = High (3)
      const warning = mapECSeverity('warning', 'winter storm');
      expect(warning.level).toBe(3);

      // Watch = Moderate (2)
      const watch = mapECSeverity('watch', 'winter storm');
      expect(watch.level).toBe(2);

      // Advisory = Low (1)
      const advisory = mapECSeverity('advisory', 'frost');
      expect(advisory.level).toBe(1);

      // Statement = Info (0)
      const statement = mapECSeverity('statement', 'general');
      expect(statement.level).toBe(0);
    });

    it('boosts EC critical events to appropriate severity', () => {
      // Tsunami warning should be Critical (4)
      const tsunami = mapECSeverity('warning', 'tsunami');
      expect(tsunami.level).toBe(4);

      // Tornado watch should be High (3) - boosted from Moderate
      const tornadoWatch = mapECSeverity('watch', 'tornado');
      expect(tornadoWatch.level).toBe(3);
    });

    it('maintains consistent ordering across border', () => {
      const mixedAlerts = [
        // Canadian advisory (level 1)
        { id: 'ca-adv', source: 'EC', type: 'advisory', event: 'frost' },
        // US Extreme (level 4)
        { id: 'us-ext', source: 'NWS', severity: 'Extreme', urgency: 'Immediate', certainty: 'Observed', event: 'Tsunami' },
        // Canadian warning (level 3)
        { id: 'ca-warn', source: 'EC', type: 'warning', event: 'winter storm' },
        // US Minor (level 1)
        { id: 'us-min', source: 'NWS', severity: 'Minor', urgency: 'Expected', certainty: 'Likely', event: 'Frost' }
      ];

      mixedAlerts.forEach(alert => applyUnifiedSeverity(alert));
      mixedAlerts.sort(compareSeverity);

      // Verify order: Critical > High > Low (equal) > Low (equal)
      expect(mixedAlerts[0].id).toBe('us-ext');  // Critical
      expect(mixedAlerts[1].id).toBe('ca-warn'); // High
      // Last two can be in either order (both Low)
      const lowIds = [mixedAlerts[2].id, mixedAlerts[3].id];
      expect(lowIds).toContain('ca-adv');
      expect(lowIds).toContain('us-min');
    });

    it('parses timestamps from both NWS and EC formats', () => {
      // NWS format with timezone offset
      const nwsTime = parseAlertTime('2025-01-03T10:00:00-08:00', 'NWS');
      expect(nwsTime).toBe('2025-01-03T18:00:00.000Z');

      // EC format with Z suffix
      const ecTimeZ = parseAlertTime('2025-01-03T18:00:00Z', 'EC');
      expect(ecTimeZ).toBe('2025-01-03T18:00:00.000Z');

      // Compact ISO format (sometimes used by EC)
      const compactTime = parseAlertTime('20250103T180000Z', 'EC');
      expect(compactTime).toBe('2025-01-03T18:00:00.000Z');
    });

  });

  // ==========================================
  // Zone Matching Integration (5 tests)
  // ==========================================
  describe('Zone Matching Integration', () => {

    it('matches alerts to tribal boundaries using centroid', () => {
      // Create alert with geometry covering Lummi reservation area
      const alertWithGeometry = {
        id: 'lummi-area-alert',
        event: 'Winter Storm Warning',
        severity: 'WARNING',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.80, 48.70],
            [-122.50, 48.70],
            [-122.50, 48.90],
            [-122.80, 48.90],
            [-122.80, 48.70]
          ]]
        }
      };

      const tribalAlerts = matchAlertsToTribes([alertWithGeometry], mockTribalBoundaries);

      // Lummi reservation (centroid at -122.65, 48.80) should match
      expect(tribalAlerts['5300100']).toBe('WARNING');
    });

    it('returns highest severity when multiple alerts affect same tribe', () => {
      const alerts = [
        {
          id: 'low-alert',
          severity: 'ADVISORY',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-122.80, 48.70],
              [-122.50, 48.70],
              [-122.50, 48.90],
              [-122.80, 48.90],
              [-122.80, 48.70]
            ]]
          }
        },
        {
          id: 'high-alert',
          severity: 'EMERGENCY',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-122.80, 48.70],
              [-122.50, 48.70],
              [-122.50, 48.90],
              [-122.80, 48.90],
              [-122.80, 48.70]
            ]]
          }
        }
      ];

      const tribalAlerts = matchAlertsToTribes(alerts, mockTribalBoundaries);

      // Should return highest severity
      expect(tribalAlerts['5300100']).toBe('EMERGENCY');
    });

    it('gets all alerts affecting a specific tribe', () => {
      const alerts = [
        {
          id: 'alert-1',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-122.80, 48.70],
              [-122.50, 48.70],
              [-122.50, 48.90],
              [-122.80, 48.90],
              [-122.80, 48.70]
            ]]
          }
        },
        {
          id: 'alert-2',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-122.80, 48.70],
              [-122.60, 48.70],
              [-122.60, 48.85],
              [-122.80, 48.85],
              [-122.80, 48.70]
            ]]
          }
        },
        {
          id: 'alert-far',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-130.0, 45.0],
              [-129.0, 45.0],
              [-129.0, 46.0],
              [-130.0, 46.0],
              [-130.0, 45.0]
            ]]
          }
        }
      ];

      const lummiTribe = mockTribalBoundaries.features.find(
        f => f.properties.GEOID === '5300100'
      );

      const affectingAlerts = getAlertsForTribe(alerts, lummiTribe);

      expect(affectingAlerts).toHaveLength(2);
      expect(affectingAlerts.map(a => a.id)).toContain('alert-1');
      expect(affectingAlerts.map(a => a.id)).toContain('alert-2');
      expect(affectingAlerts.map(a => a.id)).not.toContain('alert-far');
    });

    it('handles alerts without geometry gracefully', () => {
      const alerts = [
        { id: 'no-geom', event: 'Alert without geometry' },
        {
          id: 'with-geom',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-122.80, 48.70],
              [-122.50, 48.70],
              [-122.50, 48.90],
              [-122.80, 48.90],
              [-122.80, 48.70]
            ]]
          },
          severity: 'WARNING'
        }
      ];

      // Should not throw, should process what it can
      const tribalAlerts = matchAlertsToTribes(alerts, mockTribalBoundaries);

      expect(tribalAlerts).toBeDefined();
      expect(tribalAlerts['5300100']).toBe('WARNING');
    });

    it('handles empty inputs gracefully', () => {
      expect(matchAlertsToTribes([], mockTribalBoundaries)).toEqual({});
      expect(matchAlertsToTribes(null, mockTribalBoundaries)).toEqual({});
      expect(matchAlertsToTribes([{ id: 'test' }], null)).toEqual({});
      expect(matchAlertsToTribes([{ id: 'test' }], { features: [] })).toEqual({});
    });

  });

  // ==========================================
  // Error Recovery Integration (5 tests)
  // ==========================================
  describe('Error Recovery Integration', () => {

    it('recovers from malformed JSON in alert data', () => {
      const malformedJSON = '{"id": "test", "headline": "Missing closing brace"';

      const result = safeParseJSON(malformedJSON, 'AlertParser');

      expect(result).toBeNull();  // Returns null instead of throwing
    });

    it('recovers from malformed XML in CAP data', () => {
      const malformedXML = '<alert><identifier>test<identifier></alert>';

      const result = safeParseXML(malformedXML, 'CAPParser');

      expect(result).toBeNull();  // Returns null instead of throwing
    });

    it('continues processing valid alerts when some are malformed', () => {
      const mixedAlerts = [
        { id: 'valid-1', headline: 'Valid Alert 1', event: 'Snow' },
        { id: 'valid-2', headline: 'Valid Alert 2', event: 'Rain' }
      ];

      // Simulate processing with one throwing error
      let errorCount = 0;
      const processed = safeProcessBatch(
        mixedAlerts,
        (alert, index) => {
          if (index === 0) {
            // Simulate processing that would throw on first item
            throw new Error('Simulated processing error');
          }
          return { ...alert, processed: true };
        },
        'AlertProcessor'
      );

      // Should have processed the second alert
      expect(processed).toHaveLength(1);
      expect(processed[0].id).toBe('valid-2');
    });

    it('detects suspicious content in alerts', () => {
      const suspiciousContent = '<script>alert("xss")</script>';
      const cleanContent = 'Winter Storm Warning for Whatcom County';

      expect(hasSuspiciousContent(suspiciousContent)).toBe(true);
      expect(hasSuspiciousContent(cleanContent)).toBe(false);
      expect(hasSuspiciousContent('<img onerror="hack()">')).toBe(true);
      expect(hasSuspiciousContent('javascript:void(0)')).toBe(true);
    });

    it('handles null/undefined gracefully in all pipeline stages', () => {
      // Severity mapping
      const nullSeverity = mapNWSSeverity(null, null, null);
      expect(nullSeverity).toBeDefined();
      expect(nullSeverity.level).toBe(0);

      // Timestamp parsing
      const nullTime = parseAlertTime(null, 'NWS');
      expect(nullTime).toBeNull();

      // Sanitization
      const nullSanitized = sanitizeAlert(null);
      expect(nullSanitized).toBeNull();

      const undefinedSanitized = sanitizeAlert(undefined);
      expect(undefinedSanitized).toBeNull();

      // Batch sanitization
      const emptyBatch = sanitizeAlerts(null);
      expect(emptyBatch).toEqual([]);
    });

  });

  // ==========================================
  // Performance and Edge Cases (3 tests)
  // ==========================================
  describe('Performance and Edge Cases', () => {

    it('handles large batch of alerts efficiently', () => {
      // Generate 100 mock alerts
      const largeAlertSet = Array.from({ length: 100 }, (_, i) => ({
        id: `alert-${i}`,
        event: `Test Event ${i}`,
        headline: `Test Headline ${i}`,
        description: `Test Description ${i}`,
        severity: ['Minor', 'Moderate', 'Severe', 'Extreme'][i % 4],
        urgency: 'Expected',
        certainty: 'Likely'
      }));

      const startTime = performance.now();

      // Process all alerts
      const processed = safeProcessBatch(
        largeAlertSet,
        (alert) => {
          applyUnifiedSeverity({
            source: 'NWS',
            severity: alert.severity,
            urgency: alert.urgency,
            certainty: alert.certainty,
            event: alert.event
          });
          return sanitizeAlert(alert);
        },
        'BatchTest'
      );

      const endTime = performance.now();

      expect(processed).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000);  // Should complete in under 1 second
    });

    it('handles alerts with very long content', () => {
      const longContent = 'A'.repeat(10000);
      const alertWithLongContent = {
        id: 'long-content',
        headline: longContent,
        description: longContent,
        instruction: longContent
      };

      const sanitized = sanitizeAlert(alertWithLongContent);

      expect(sanitized.headline).toBe(longContent);
      expect(sanitized.description.length).toBe(10000);
    });

    it('handles special characters and unicode in alerts', () => {
      const unicodeAlert = {
        id: 'unicode-test',
        headline: 'Alerte météo: températures extrêmes de -40°C',
        description: '⚠️ Attention! 🌨️ Neige abondante prévue.',
        areaDesc: 'Région de Québec — Zone A'
      };

      const sanitized = sanitizeAlert(unicodeAlert);

      expect(sanitized.headline).toContain('°C');
      expect(sanitized.description).toContain('⚠️');
      expect(sanitized.areaDesc).toContain('—');
    });

  });

});
