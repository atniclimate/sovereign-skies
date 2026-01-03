/**
 * Mock Zone and Tribal Boundary Data
 * For testing geographic matching functions
 */

// NWS Forecast Zones (WA state)
export const mockNWSZones = [
  {
    id: 'WAZ001',
    name: 'Whatcom County',
    state: 'WA',
    type: 'forecast',
    cwa: 'SEW',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-122.8, 48.5],
        [-121.5, 48.5],
        [-121.5, 49.0],
        [-122.8, 49.0],
        [-122.8, 48.5]
      ]]
    }
  },
  {
    id: 'WAZ002',
    name: 'San Juan County',
    state: 'WA',
    type: 'forecast',
    cwa: 'SEW',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.2, 48.4],
        [-122.8, 48.4],
        [-122.8, 48.8],
        [-123.2, 48.8],
        [-123.2, 48.4]
      ]]
    }
  },
  {
    id: 'WAZ003',
    name: 'Skagit County',
    state: 'WA',
    type: 'forecast',
    cwa: 'SEW',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-122.8, 48.2],
        [-121.0, 48.2],
        [-121.0, 48.7],
        [-122.8, 48.7],
        [-122.8, 48.2]
      ]]
    }
  },
  {
    id: 'WAZ004',
    name: 'Snohomish County',
    state: 'WA',
    type: 'forecast',
    cwa: 'SEW',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-122.4, 47.8],
        [-121.0, 47.8],
        [-121.0, 48.3],
        [-122.4, 48.3],
        [-122.4, 47.8]
      ]]
    }
  }
];

// Marine zones
export const mockMarineZones = [
  {
    id: 'PZZ110',
    name: 'Strait of Juan de Fuca',
    type: 'marine',
    cwa: 'SEW',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-124.7, 48.0],
        [-122.8, 48.0],
        [-122.8, 48.5],
        [-124.7, 48.5],
        [-124.7, 48.0]
      ]]
    }
  },
  {
    id: 'PZZ131',
    name: 'Puget Sound and Hood Canal',
    type: 'marine',
    cwa: 'SEW',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.0, 47.0],
        [-122.2, 47.0],
        [-122.2, 48.3],
        [-123.0, 48.3],
        [-123.0, 47.0]
      ]]
    }
  }
];

// Canadian zones (BC)
export const mockCanadianZones = [
  {
    id: 'BC001',
    name: 'Greater Vancouver',
    province: 'BC',
    country: 'CA',
    type: 'forecast',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.3, 49.0],
        [-122.5, 49.0],
        [-122.5, 49.4],
        [-123.3, 49.4],
        [-123.3, 49.0]
      ]]
    }
  },
  {
    id: 'BC002',
    name: 'Fraser Valley',
    province: 'BC',
    country: 'CA',
    type: 'forecast',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-122.5, 49.0],
        [-121.5, 49.0],
        [-121.5, 49.4],
        [-122.5, 49.4],
        [-122.5, 49.0]
      ]]
    }
  },
  {
    id: 'BC003',
    name: 'Greater Victoria',
    province: 'BC',
    country: 'CA',
    type: 'forecast',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.6, 48.3],
        [-123.2, 48.3],
        [-123.2, 48.6],
        [-123.6, 48.6],
        [-123.6, 48.3]
      ]]
    }
  }
];

// All zones combined
export const mockZones = [
  ...mockNWSZones,
  ...mockMarineZones,
  ...mockCanadianZones
];

// Mock Tribal Boundaries (simplified for testing)
export const mockTribalBoundaries = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        GEOID: '5300100',
        NAME: 'Lummi Reservation',
        NAMELSAD: 'Lummi Reservation',
        LSAD: '40',
        INTPTLAT: '+48.8023456',
        INTPTLON: '-122.6456789'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.75, 48.72],
          [-122.55, 48.72],
          [-122.55, 48.88],
          [-122.75, 48.88],
          [-122.75, 48.72]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        GEOID: '5300200',
        NAME: 'Nooksack Reservation',
        NAMELSAD: 'Nooksack Indian Reservation',
        LSAD: '40',
        INTPTLAT: '+48.9234567',
        INTPTLON: '-122.3123456'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.40, 48.88],
          [-122.20, 48.88],
          [-122.20, 48.98],
          [-122.40, 48.98],
          [-122.40, 48.88]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        GEOID: '5300300',
        NAME: 'Tulalip Reservation',
        NAMELSAD: 'Tulalip Reservation',
        LSAD: '40',
        INTPTLAT: '+48.0567890',
        INTPTLON: '-122.2876543'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.35, 48.00],
          [-122.18, 48.00],
          [-122.18, 48.12],
          [-122.35, 48.12],
          [-122.35, 48.00]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        GEOID: '5300400',
        NAME: 'Swinomish Reservation',
        NAMELSAD: 'Swinomish Reservation',
        LSAD: '40',
        INTPTLAT: '+48.4456789',
        INTPTLON: '-122.5234567'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.60, 48.40],
          [-122.45, 48.40],
          [-122.45, 48.50],
          [-122.60, 48.50],
          [-122.60, 48.40]
        ]]
      }
    },
    // Canadian First Nation (simplified)
    {
      type: 'Feature',
      properties: {
        CLAB_ID: 'FN001',
        NAME: 'Musqueam',
        name: 'Musqueam Indian Reserve',
        province: 'BC'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-123.25, 49.22],
          [-123.18, 49.22],
          [-123.18, 49.26],
          [-123.25, 49.26],
          [-123.25, 49.22]
        ]]
      }
    }
  ]
};

// Test points for point-in-polygon tests
export const mockTestPoints = {
  inWhatcom: [-122.4, 48.75],      // Inside Whatcom County
  inVancouver: [-123.1, 49.2],     // Inside Greater Vancouver
  inLummi: [-122.65, 48.80],       // Inside Lummi Reservation
  inNooksack: [-122.30, 48.93],    // Inside Nooksack Reservation
  inOcean: [-130.0, 48.0],         // Pacific Ocean (outside all zones)
  onBorder: [-122.8, 48.5],        // On Whatcom/Skagit border
  nearBorder: [-122.79, 48.51],    // Just inside Whatcom
  atVertex: [-122.8, 48.5],        // At polygon vertex
};

// Complex polygon shapes for edge case testing
export const mockComplexPolygons = {
  // Concave polygon (L-shape)
  concave: [[
    [-122.5, 48.5],
    [-122.0, 48.5],
    [-122.0, 48.8],
    [-122.25, 48.8],
    [-122.25, 48.6],
    [-122.5, 48.6],
    [-122.5, 48.5]
  ]],

  // Very small polygon (precision test)
  tiny: [[
    [-122.5000, 48.5000],
    [-122.4999, 48.5000],
    [-122.4999, 48.5001],
    [-122.5000, 48.5001],
    [-122.5000, 48.5000]
  ]],

  // Large state-wide polygon
  stateWide: [[
    [-125.0, 45.5],
    [-116.5, 45.5],
    [-116.5, 49.0],
    [-125.0, 49.0],
    [-125.0, 45.5]
  ]],

  // Simple square
  square: [[
    [-122.5, 48.5],
    [-122.0, 48.5],
    [-122.0, 49.0],
    [-122.5, 49.0],
    [-122.5, 48.5]
  ]]
};

// MultiPolygon for archipelago testing (San Juan Islands)
export const mockMultiPolygonZone = {
  id: 'WAZ002-MULTI',
  name: 'San Juan Islands',
  type: 'forecast',
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      // San Juan Island
      [[
        [-123.15, 48.45],
        [-122.95, 48.45],
        [-122.95, 48.65],
        [-123.15, 48.65],
        [-123.15, 48.45]
      ]],
      // Orcas Island
      [[
        [-123.0, 48.60],
        [-122.75, 48.60],
        [-122.75, 48.75],
        [-123.0, 48.75],
        [-123.0, 48.60]
      ]],
      // Lopez Island
      [[
        [-122.95, 48.40],
        [-122.80, 48.40],
        [-122.80, 48.55],
        [-122.95, 48.55],
        [-122.95, 48.40]
      ]]
    ]
  }
};
