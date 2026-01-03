/**
 * Mock Environment Canada Alert Data
 * Based on CAP (Common Alerting Protocol) format used by ECCC
 * https://dd.weather.gc.ca/alerts/cap/
 */

// Standard EC CAP alert (Winter Storm Warning)
export const mockECAlert = {
  identifier: 'urn:oid:2.49.0.0.124.test-ec-001',
  sender: 'cap-pac@canada.ca',
  sent: '2025-01-03T18:00:00-00:00',
  status: 'Actual',
  msgType: 'Alert',
  scope: 'Public',
  code: ['profile:CAP-CP:0.4'],
  references: '',
  info: {
    language: 'en-CA',
    category: 'Met',
    event: 'winter storm warning',
    responseType: 'Prepare',
    urgency: 'Expected',
    severity: 'Moderate',
    certainty: 'Likely',
    audience: 'general public',
    effective: '2025-01-03T18:00:00-00:00',
    onset: '2025-01-03T20:00:00-00:00',
    expires: '2025-01-04T06:00:00-00:00',
    senderName: 'Environment and Climate Change Canada',
    headline: 'Winter Storm Warning in effect',
    description: 'Significant snowfall expected. Temperatures dropping to -5°C overnight with winds gusting to 60 km/h. Total accumulation 15 to 25 cm expected.',
    instruction: 'Consider postponing non-essential travel until conditions improve. Visibility may be significantly reduced at times in heavy snow.',
    web: 'https://weather.gc.ca',
    area: {
      areaDesc: 'Greater Vancouver',
      polygon: '49.2,-123.2 49.3,-123.2 49.3,-123.0 49.2,-123.0 49.2,-123.2',
      geocode: {
        valueName: 'layer:EC-MSC-SMC:1.0:CLC',
        value: '059150'
      }
    },
    parameter: [
      { valueName: 'layer:EC-MSC-SMC:1.0:Alert_Type', value: 'warning' },
      { valueName: 'layer:EC-MSC-SMC:1.1:Broadcast_Intrusive', value: 'No' }
    ]
  }
};

// French language alert
export const mockECAlertFrench = {
  ...mockECAlert,
  identifier: 'urn:oid:2.49.0.0.124.test-ec-002-fr',
  info: {
    ...mockECAlert.info,
    language: 'fr-CA',
    headline: 'Avertissement de tempête hivernale en vigueur',
    description: 'Chute de neige importante prévue. Températures descendant à -5°C pendant la nuit avec des rafales de vent atteignant 60 km/h. Accumulation totale de 15 à 25 cm prévue.',
    instruction: 'Envisagez de reporter les déplacements non essentiels jusqu\'à ce que les conditions s\'améliorent.',
    senderName: 'Environnement et Changement climatique Canada'
  }
};

// Arctic outflow warning (BC specific)
export const mockECAlertArcticOutflow = {
  ...mockECAlert,
  identifier: 'urn:oid:2.49.0.0.124.test-ec-003',
  info: {
    ...mockECAlert.info,
    event: 'arctic outflow warning',
    headline: 'Arctic Outflow Warning in effect',
    description: 'Very cold arctic air will flow through mountain passes tonight. Temperatures near -20°C expected in valleys.',
    area: {
      areaDesc: 'Fraser Valley',
      polygon: '49.0,-122.5 49.3,-122.5 49.3,-121.5 49.0,-121.5 49.0,-122.5'
    }
  }
};

// High streamflow advisory
export const mockECAlertStreamflow = {
  ...mockECAlert,
  identifier: 'urn:oid:2.49.0.0.124.test-ec-004',
  sender: 'bc.flood@gov.bc.ca',
  info: {
    ...mockECAlert.info,
    category: 'Hydro',
    event: 'high streamflow advisory',
    headline: 'High Streamflow Advisory - Fraser River',
    description: 'River levels rising rapidly due to heavy rainfall. Minor flooding of low-lying areas is possible.',
    urgency: 'Expected',
    severity: 'Minor',
    area: {
      areaDesc: 'Fraser River from Hope to Mission',
      polygon: '49.1,-122.0 49.4,-122.0 49.4,-121.0 49.1,-121.0 49.1,-122.0'
    }
  }
};

// Tsunami alert (rare but critical)
export const mockECAlertTsunami = {
  ...mockECAlert,
  identifier: 'urn:oid:2.49.0.0.124.test-ec-tsunami',
  info: {
    ...mockECAlert.info,
    category: 'Geo',
    event: 'tsunami warning',
    urgency: 'Immediate',
    severity: 'Extreme',
    certainty: 'Observed',
    responseType: 'Evacuate',
    headline: 'TSUNAMI WARNING for BC Coast',
    description: 'A TSUNAMI WARNING IS IN EFFECT. Dangerous waves expected. First wave may not be the largest.',
    instruction: 'MOVE TO HIGH GROUND IMMEDIATELY. Go to 20 metres above sea level or 2 km inland.',
    area: {
      areaDesc: 'BC Coastal Waters',
      polygon: '48.3,-125.5 50.0,-125.5 50.0,-122.5 48.3,-122.5 48.3,-125.5'
    }
  }
};

// Bilingual alert pair (as returned from EC)
export const mockECAlertBilingual = {
  identifier: 'urn:oid:2.49.0.0.124.test-ec-bilingual',
  sender: 'cap-pac@canada.ca',
  sent: '2025-01-03T18:00:00-00:00',
  status: 'Actual',
  msgType: 'Alert',
  scope: 'Public',
  // EC returns info as array for bilingual alerts
  info: [
    {
      language: 'en-CA',
      event: 'wind warning',
      headline: 'Wind Warning in effect for Greater Victoria',
      description: 'Strong winds gusting to 90 km/h expected.',
      area: {
        areaDesc: 'Greater Victoria',
        polygon: '48.4,-123.6 48.5,-123.6 48.5,-123.2 48.4,-123.2 48.4,-123.6'
      }
    },
    {
      language: 'fr-CA',
      event: 'avertissement de vent',
      headline: 'Avertissement de vent en vigueur pour le Grand Victoria',
      description: 'Vents forts avec rafales atteignant 90 km/h prévus.',
      area: {
        areaDesc: 'Grand Victoria',
        polygon: '48.4,-123.6 48.5,-123.6 48.5,-123.2 48.4,-123.2 48.4,-123.6'
      }
    }
  ]
};

// Full EC response structure (CAP-CP XML parsed to JSON)
export const mockECResponse = {
  alerts: [
    mockECAlert,
    mockECAlertFrench,
    mockECAlertArcticOutflow
  ],
  metadata: {
    source: 'Environment and Climate Change Canada',
    updated: '2025-01-03T18:00:00Z',
    region: 'British Columbia'
  }
};

// EC severity mapping reference
export const EC_SEVERITY_MAP = {
  'Extreme': 'EMERGENCY',
  'Severe': 'WARNING',
  'Moderate': 'WATCH',
  'Minor': 'ADVISORY',
  'Unknown': 'STATEMENT'
};

// EC event type to NWS-style severity
export const EC_EVENT_SEVERITY = {
  'tsunami warning': 'EMERGENCY',
  'earthquake': 'EMERGENCY',
  'tornado warning': 'EMERGENCY',
  'winter storm warning': 'WARNING',
  'blizzard warning': 'WARNING',
  'arctic outflow warning': 'WARNING',
  'wind warning': 'WARNING',
  'rainfall warning': 'WARNING',
  'snowfall warning': 'WARNING',
  'freezing rain warning': 'WARNING',
  'winter storm watch': 'WATCH',
  'wind watch': 'WATCH',
  'high streamflow advisory': 'ADVISORY',
  'frost advisory': 'ADVISORY',
  'special weather statement': 'STATEMENT'
};
