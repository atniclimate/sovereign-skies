/**
 * Mock NWS Alert Data
 * Based on actual NWS API response structure
 * https://api.weather.gov/alerts/active
 */

// Standard NWS alert with geometry (Whatcom County Winter Storm)
export const mockNWSAlert = {
  id: 'urn:oid:2.49.0.1.840.0.test-001',
  areaDesc: 'Whatcom County, WA',
  geocode: {
    UGC: ['WAZ001'],
    SAME: ['053073']
  },
  affectedZones: ['https://api.weather.gov/zones/forecast/WAZ001'],
  sent: '2025-01-03T10:00:00-08:00',
  effective: '2025-01-03T10:00:00-08:00',
  onset: '2025-01-03T12:00:00-08:00',
  expires: '2025-01-03T22:00:00-08:00',
  ends: '2025-01-04T06:00:00-08:00',
  status: 'Actual',
  messageType: 'Alert',
  category: 'Met',
  severity: 'Moderate',
  certainty: 'Likely',
  urgency: 'Expected',
  event: 'Winter Storm Warning',
  sender: 'w-nws.webmaster@noaa.gov',
  senderName: 'NWS Seattle WA',
  headline: 'Winter Storm Warning issued January 3 at 10:00AM PST until January 3 at 10:00PM PST by NWS Seattle WA',
  description: 'Heavy snow expected. Total snow accumulations of 6 to 12 inches. Winds gusting as high as 45 mph.',
  instruction: 'Travel should be restricted to emergencies only. If you must travel, keep an extra flashlight, food, and water in your vehicle in case of an emergency.',
  response: 'Prepare',
  parameters: {
    AWIPSidentifier: ['WSASEW'],
    WMOidentifier: ['WWUS46 KSEW 031800'],
    NWSheadline: ['WINTER STORM WARNING IN EFFECT UNTIL 10 PM PST THIS EVENING']
  }
};

// Alert without geometry (requires zone lookup)
export const mockNWSAlertNoGeometry = {
  ...mockNWSAlert,
  id: 'urn:oid:2.49.0.1.840.0.test-002',
  areaDesc: 'San Juan County, WA',
  geocode: {
    UGC: ['WAZ002'],
    SAME: ['053055']
  },
  affectedZones: ['https://api.weather.gov/zones/forecast/WAZ002'],
  event: 'Frost Advisory',
  severity: 'Minor',
  headline: 'Frost Advisory issued January 3'
};

// Extreme urgency alert (Tsunami Warning)
export const mockNWSAlertExtreme = {
  ...mockNWSAlert,
  id: 'urn:oid:2.49.0.1.840.0.test-extreme',
  areaDesc: 'Coastal Whatcom County, WA',
  geocode: {
    UGC: ['WAZ503'],
    SAME: ['053073']
  },
  severity: 'Extreme',
  urgency: 'Immediate',
  certainty: 'Observed',
  event: 'Tsunami Warning',
  headline: 'Tsunami Warning for the Pacific Coast',
  description: 'A TSUNAMI WARNING IS IN EFFECT. Dangerous coastal flooding and powerful currents are possible.',
  instruction: 'Move immediately to higher ground.',
  response: 'Evacuate'
};

// Multi-zone flood warning
export const mockNWSAlertMultiZone = {
  ...mockNWSAlert,
  id: 'urn:oid:2.49.0.1.840.0.test-multi',
  areaDesc: 'Whatcom County; Skagit County; Snohomish County, WA',
  geocode: {
    UGC: ['WAZ001', 'WAZ003', 'WAZ004'],
    SAME: ['053073', '053057', '053061']
  },
  affectedZones: [
    'https://api.weather.gov/zones/forecast/WAZ001',
    'https://api.weather.gov/zones/forecast/WAZ003',
    'https://api.weather.gov/zones/forecast/WAZ004'
  ],
  event: 'Flood Warning',
  severity: 'Severe',
  headline: 'Flood Warning for Nooksack River Basin'
};

// Marine zone alert
export const mockNWSAlertMarine = {
  ...mockNWSAlert,
  id: 'urn:oid:2.49.0.1.840.0.test-marine',
  areaDesc: 'Strait of Juan de Fuca',
  geocode: {
    UGC: ['PZZ110'],
    SAME: []
  },
  affectedZones: ['https://api.weather.gov/zones/marine/PZZ110'],
  event: 'Small Craft Advisory',
  severity: 'Moderate',
  urgency: 'Expected'
};

// Full NWS GeoJSON response structure
export const mockNWSResponse = {
  '@context': [
    'https://geojson.org/geojson-ld/geojson-context.jsonld',
    {
      '@version': '1.1',
      wx: 'https://api.weather.gov/ontology#',
      s: 'https://schema.org/'
    }
  ],
  type: 'FeatureCollection',
  features: [
    {
      id: mockNWSAlert.id,
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.5, 48.7],
          [-122.3, 48.7],
          [-122.3, 48.9],
          [-122.5, 48.9],
          [-122.5, 48.7]
        ]]
      },
      properties: mockNWSAlert
    },
    {
      id: mockNWSAlertNoGeometry.id,
      type: 'Feature',
      geometry: null,
      properties: mockNWSAlertNoGeometry
    },
    {
      id: mockNWSAlertExtreme.id,
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-124.5, 48.0],
          [-122.5, 48.0],
          [-122.5, 49.0],
          [-124.5, 49.0],
          [-124.5, 48.0]
        ]]
      },
      properties: mockNWSAlertExtreme
    }
  ],
  title: 'Current watches, warnings, and advisories for WA, OR, ID',
  updated: '2025-01-03T18:30:00+00:00'
};

// Empty response (no active alerts)
export const mockNWSResponseEmpty = {
  ...mockNWSResponse,
  features: [],
  title: 'No active alerts'
};

// Malformed response for error testing
export const mockNWSResponseMalformed = {
  invalid: 'structure',
  missing: 'features'
};
