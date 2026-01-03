/**
 * Mock NWPS River Gauge Data
 * Based on NOAA National Water Prediction Service API
 * https://api.water.noaa.gov/nwps/v1/gauges
 */

// Standard gauge with normal conditions
export const mockGaugeNormal = {
  lid: 'NKWA1',
  name: 'Nooksack River near Deming',
  latitude: 48.8085,
  longitude: -122.2397,
  wfo: { abbreviation: 'SEW', name: 'Seattle' },
  rfc: { abbreviation: 'NWRFC', name: 'Northwest River Forecast Center' },
  state: { abbreviation: 'WA', name: 'Washington' },
  status: {
    observed: {
      primary: 8.45,
      primaryUnit: 'ft',
      secondary: 5200,
      secondaryUnit: 'cfs',
      floodCategory: 'no_flooding',
      validTime: '2025-01-03T18:00:00Z'
    },
    forecast: {
      primary: 9.2,
      primaryUnit: 'ft',
      floodCategory: 'no_flooding',
      validTime: '2025-01-04T06:00:00Z'
    }
  },
  flood: {
    stageflow: {
      action: { stage: 12.0, flow: 9000 },
      minor: { stage: 14.0, flow: 12500 },
      moderate: { stage: 18.0, flow: 22000 },
      major: { stage: 22.0, flow: 35000 }
    }
  }
};

// Gauge at action stage
export const mockGaugeAction = {
  ...mockGaugeNormal,
  lid: 'SKWA1',
  name: 'Skagit River near Mount Vernon',
  latitude: 48.4181,
  longitude: -122.3367,
  status: {
    observed: {
      primary: 24.5,
      primaryUnit: 'ft',
      secondary: 28000,
      secondaryUnit: 'cfs',
      floodCategory: 'action',
      validTime: '2025-01-03T18:00:00Z'
    },
    forecast: {
      primary: 26.0,
      floodCategory: 'minor',
      validTime: '2025-01-04T06:00:00Z'
    }
  }
};

// Gauge at minor flooding
export const mockGaugeMinorFlooding = {
  ...mockGaugeNormal,
  lid: 'SNWA1',
  name: 'Snoqualmie River near Carnation',
  latitude: 47.6581,
  longitude: -121.9139,
  status: {
    observed: {
      primary: 56.2,
      primaryUnit: 'ft',
      secondary: 12500,
      secondaryUnit: 'cfs',
      floodCategory: 'minor',
      validTime: '2025-01-03T18:00:00Z'
    },
    forecast: {
      primary: 58.0,
      floodCategory: 'moderate',
      validTime: '2025-01-04T12:00:00Z'
    }
  }
};

// Gauge at moderate flooding
export const mockGaugeModerateFlooding = {
  ...mockGaugeNormal,
  lid: 'CHWA1',
  name: 'Chehalis River near Grand Mound',
  latitude: 46.7881,
  longitude: -122.9781,
  status: {
    observed: {
      primary: 65.8,
      primaryUnit: 'ft',
      secondary: 45000,
      secondaryUnit: 'cfs',
      floodCategory: 'moderate',
      validTime: '2025-01-03T18:00:00Z'
    },
    forecast: {
      primary: 68.0,
      floodCategory: 'major',
      validTime: '2025-01-04T06:00:00Z'
    }
  }
};

// Gauge at major flooding
export const mockGaugeMajorFlooding = {
  ...mockGaugeNormal,
  lid: 'ELWA1',
  name: 'Elwha River at McDonald Bridge',
  latitude: 48.0664,
  longitude: -123.5556,
  status: {
    observed: {
      primary: 18.7,
      primaryUnit: 'ft',
      secondary: 8500,
      secondaryUnit: 'cfs',
      floodCategory: 'major',
      validTime: '2025-01-03T18:00:00Z'
    },
    forecast: {
      primary: 17.5,
      floodCategory: 'moderate',
      validTime: '2025-01-04T12:00:00Z'
    }
  }
};

// Gauge with missing data
export const mockGaugeMissingData = {
  lid: 'UNKWA1',
  name: 'Unknown Creek',
  latitude: 48.0,
  longitude: -122.0,
  wfo: null,
  rfc: null,
  state: { abbreviation: 'WA', name: 'Washington' },
  status: {
    observed: {
      primary: null,
      primaryUnit: null,
      floodCategory: 'obs_not_current',
      validTime: null
    },
    forecast: null
  }
};

// Gauge out of service
export const mockGaugeOutOfService = {
  lid: 'OOSWA1',
  name: 'Out of Service Gauge',
  latitude: 47.5,
  longitude: -122.5,
  wfo: { abbreviation: 'SEW', name: 'Seattle' },
  rfc: { abbreviation: 'NWRFC', name: 'Northwest River Forecast Center' },
  state: { abbreviation: 'WA', name: 'Washington' },
  status: {
    observed: {
      floodCategory: 'out_of_service',
      validTime: '2024-12-01T00:00:00Z'
    },
    forecast: null
  }
};

// Full NWPS response for WA state
export const mockNWPSResponseWA = {
  gauges: [
    mockGaugeNormal,
    mockGaugeAction,
    mockGaugeMinorFlooding,
    mockGaugeMissingData
  ]
};

// Full NWPS response for OR state
export const mockNWPSResponseOR = {
  gauges: [
    {
      ...mockGaugeNormal,
      lid: 'WILO3',
      name: 'Willamette River at Portland',
      latitude: 45.5155,
      longitude: -122.6693,
      state: { abbreviation: 'OR', name: 'Oregon' }
    }
  ]
};

// Full NWPS response for ID state
export const mockNWPSResponseID = {
  gauges: [
    {
      ...mockGaugeNormal,
      lid: 'SNKI1',
      name: 'Snake River near Weiser',
      latitude: 44.2500,
      longitude: -116.9667,
      state: { abbreviation: 'ID', name: 'Idaho' }
    }
  ]
};

// Empty response
export const mockNWPSResponseEmpty = {
  gauges: []
};

// Flood priority reference (from api/rivers.js)
export const FLOOD_PRIORITY = {
  major: 0,
  moderate: 1,
  minor: 2,
  action: 3,
  low_threshold: 4,
  no_flooding: 5,
  not_defined: 6,
  obs_not_current: 7,
  out_of_service: 8
};

// Sample time series data (for useRivers hook testing)
export const mockGaugeTimeSeries = {
  lid: 'NKWA1',
  name: 'Nooksack River near Deming',
  observations: [
    { value: 8.45, timestamp: '2025-01-03T18:00:00Z' },
    { value: 8.40, timestamp: '2025-01-03T17:45:00Z' },
    { value: 8.38, timestamp: '2025-01-03T17:30:00Z' },
    { value: 8.35, timestamp: '2025-01-03T17:15:00Z' },
    { value: 8.32, timestamp: '2025-01-03T17:00:00Z' },
    { value: 8.28, timestamp: '2025-01-03T16:45:00Z' },
    { value: 8.25, timestamp: '2025-01-03T16:30:00Z' },
    { value: 8.20, timestamp: '2025-01-03T16:15:00Z' }
  ],
  forecast: [
    { value: 8.60, timestamp: '2025-01-03T21:00:00Z' },
    { value: 9.00, timestamp: '2025-01-04T00:00:00Z' },
    { value: 9.20, timestamp: '2025-01-04T03:00:00Z' },
    { value: 9.10, timestamp: '2025-01-04T06:00:00Z' },
    { value: 8.90, timestamp: '2025-01-04T09:00:00Z' }
  ]
};
