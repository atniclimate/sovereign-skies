/**
 * Unified severity mapping for US (NWS) and Canadian (ECCC) alerts.
 * Creates consistent prioritization across the border.
 *
 * @module utils/severityMapper
 */

// Unified severity levels (internal standard)
export const UNIFIED_SEVERITY = {
  CRITICAL: {
    level: 4,
    color: '#DC2626', // red-600
    label: 'Critical',
    description: 'Immediate threat to life or property'
  },
  HIGH: {
    level: 3,
    color: '#EA580C', // orange-600
    label: 'High',
    description: 'Significant threat, take action'
  },
  MODERATE: {
    level: 2,
    color: '#CA8A04', // yellow-600
    label: 'Moderate',
    description: 'Potential threat, be prepared'
  },
  LOW: {
    level: 1,
    color: '#16A34A', // green-600
    label: 'Low',
    description: 'Minor impact expected'
  },
  INFO: {
    level: 0,
    color: '#2563EB', // blue-600
    label: 'Informational',
    description: 'General information, no action needed'
  }
};

/**
 * NWS severity mapping.
 * NWS uses: Extreme, Severe, Moderate, Minor, Unknown
 * Combined with Certainty and Urgency for accurate mapping.
 */
const NWS_SEVERITY_MAP = {
  'Extreme': 4,
  'Severe': 3,
  'Moderate': 2,
  'Minor': 1,
  'Unknown': 0
};

const NWS_URGENCY_BOOST = {
  'Immediate': 1,
  'Expected': 0.5,
  'Future': 0,
  'Past': -1,
  'Unknown': 0
};

const NWS_CERTAINTY_BOOST = {
  'Observed': 0.5,
  'Likely': 0.25,
  'Possible': 0,
  'Unlikely': -0.5,
  'Unknown': 0
};

/**
 * Map NWS alert to unified severity.
 * @param {string} severity - NWS severity value
 * @param {string} urgency - NWS urgency value
 * @param {string} certainty - NWS certainty value
 * @returns {Object} Unified severity object
 */
export const mapNWSSeverity = (severity, urgency = 'Unknown', certainty = 'Unknown') => {
  const baseSeverity = NWS_SEVERITY_MAP[severity] ?? 0;
  const urgencyBoost = NWS_URGENCY_BOOST[urgency] ?? 0;
  const certaintyBoost = NWS_CERTAINTY_BOOST[certainty] ?? 0;

  const adjustedLevel = Math.min(4, Math.max(0,
    Math.round(baseSeverity + urgencyBoost + certaintyBoost)
  ));

  return getSeverityByLevel(adjustedLevel);
};

/**
 * Environment Canada severity mapping.
 * EC uses event types: warning, watch, advisory, statement, ended
 * Event category provides additional context.
 */
const EC_TYPE_MAP = {
  'warning': 3,    // High by default, can be boosted to Critical
  'watch': 2,      // Moderate
  'advisory': 1,   // Low
  'statement': 0,  // Info
  'ended': 0       // Info
};

// Events that should boost to CRITICAL when combined with "warning"
const EC_CRITICAL_EVENTS = [
  'tornado',
  'tsunami',
  'hurricane',
  'typhoon',
  'extreme cold',
  'extreme heat',
  'avalanche'
];

// Events that should be HIGH even as "watch"
const EC_HIGH_WATCH_EVENTS = [
  'tornado',
  'tsunami',
  'severe thunderstorm'
];

/**
 * Map Environment Canada alert to unified severity.
 * @param {string} type - EC alert type (warning, watch, advisory, statement)
 * @param {string} eventCategory - EC event category (e.g., "Winter Storm", "Tsunami")
 * @returns {Object} Unified severity object
 */
export const mapECSeverity = (type, eventCategory = '') => {
  const normalizedType = type?.toLowerCase() ?? 'statement';
  const normalizedEvent = eventCategory?.toLowerCase() ?? '';

  let baseLevel = EC_TYPE_MAP[normalizedType] ?? 0;

  // Boost warnings for critical events
  if (normalizedType === 'warning' &&
      EC_CRITICAL_EVENTS.some(e => normalizedEvent.includes(e))) {
    baseLevel = 4;
  }

  // Boost watches for high-impact events
  if (normalizedType === 'watch' &&
      EC_HIGH_WATCH_EVENTS.some(e => normalizedEvent.includes(e))) {
    baseLevel = 3;
  }

  return getSeverityByLevel(baseLevel);
};

/**
 * Get unified severity object by numeric level.
 * @param {number} level - Severity level (0-4)
 * @returns {Object} Unified severity object
 */
export const getSeverityByLevel = (level) => {
  const clampedLevel = Math.min(4, Math.max(0, level));
  const severityKeys = ['INFO', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
  return UNIFIED_SEVERITY[severityKeys[clampedLevel]];
};

/**
 * Compare two alerts by severity for sorting.
 * Returns negative if a > b (higher severity first)
 * @param {Object} alertA - First alert
 * @param {Object} alertB - Second alert
 * @returns {number} Comparison result
 */
export const compareSeverity = (alertA, alertB) => {
  const levelA = alertA?.unifiedSeverity?.level ?? 0;
  const levelB = alertB?.unifiedSeverity?.level ?? 0;
  return levelB - levelA; // Descending order (highest first)
};

/**
 * Apply unified severity to an alert object.
 * Detects source and applies appropriate mapper.
 * @param {Object} alert - Alert object to enhance
 * @returns {Object} Alert with unifiedSeverity added
 */
export const applyUnifiedSeverity = (alert) => {
  if (!alert) return alert;

  const source = alert.source?.toUpperCase() ?? '';

  if (source.includes('EC') || source.includes('CANADA')) {
    // Environment Canada alert
    const type = alert.type ?? alert.info?.category ?? 'statement';
    const event = alert.event ?? alert.info?.event ?? '';
    alert.unifiedSeverity = mapECSeverity(type, event);
  } else {
    // NWS alert (default)
    alert.unifiedSeverity = mapNWSSeverity(
      alert.severity,
      alert.urgency,
      alert.certainty
    );
  }

  return alert;
};

/**
 * Get CSS class name for severity level.
 * @param {number} level - Severity level (0-4)
 * @returns {string} CSS class name
 */
export const getSeverityClassName = (level) => {
  const classes = {
    4: 'severity-critical',
    3: 'severity-high',
    2: 'severity-moderate',
    1: 'severity-low',
    0: 'severity-info'
  };
  return classes[level] ?? 'severity-info';
};

/**
 * Get severity level from legacy string format.
 * Handles both NWS and internal severity strings.
 * @param {string} severityString - Severity string
 * @returns {number} Numeric level
 */
export const parseSeverityString = (severityString) => {
  const normalized = severityString?.toUpperCase() ?? '';

  // Check unified severity names
  if (normalized === 'CRITICAL' || normalized === 'EMERGENCY') return 4;
  if (normalized === 'HIGH' || normalized === 'WARNING') return 3;
  if (normalized === 'MODERATE' || normalized === 'WATCH') return 2;
  if (normalized === 'LOW' || normalized === 'ADVISORY') return 1;
  if (normalized === 'INFO' || normalized === 'STATEMENT') return 0;

  // Check NWS severity names
  if (normalized === 'EXTREME') return 4;
  if (normalized === 'SEVERE') return 3;
  if (normalized === 'MINOR') return 1;

  return 0;
};
