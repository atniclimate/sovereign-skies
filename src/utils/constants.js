// Map defaults - Pacific region square bounds
// Computed in Web Mercator (EPSG:3857) to form a square extent

// Input bounds
const WEST_LON = -177.4;  // Midway Island
const SOUTH_LAT = 18.0;   // Just south of Hawaii
const EAST_LON = -106.9;  // Bighorn National Forest

// Web Mercator projection helpers
function lonToX(lon) {
  return lon * 20037508.34 / 180;
}

function latToY(lat) {
  const rad = lat * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2)) * 20037508.34 / Math.PI;
}

function yToLat(y) {
  return 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 20037508.34)) - Math.PI / 2);
}

// Compute square bounds
const xW = lonToX(WEST_LON);
const xE = lonToX(EAST_LON);
const yS = latToY(SOUTH_LAT);
const dx = xE - xW;
const yN = yS + dx;
const NORTH_LAT = yToLat(yN);

// Export computed bounds
export const MAP_BOUNDS = {
  west: WEST_LON,
  south: SOUTH_LAT,
  east: EAST_LON,
  north: NORTH_LAT  // ~66° computed for square
};

// Initial bounds as Leaflet expects: [[south, west], [north, east]]
export const INITIAL_BOUNDS = [
  [MAP_BOUNDS.south, MAP_BOUNDS.west],
  [MAP_BOUNDS.north, MAP_BOUNDS.east]
];

// Max bounds with padding for panning
export const MAX_BOUNDS = [
  [MAP_BOUNDS.south - 5, MAP_BOUNDS.west - 10],
  [MAP_BOUNDS.north + 5, MAP_BOUNDS.east + 10]
];

// Zoom constraints
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 18;

// Legacy PNW center (for fallback)
export const PNW_CENTER = [46.5, -120.5];
export const DEFAULT_ZOOM = 4;

// Alert polling
export const POLL_INTERVAL_MS = 60000;
export const ALERT_CACHE_TTL_MS = 300000;

// Severity colors (WCAG AA compliant)
export const SEVERITY_COLORS = {
  WATCH: '#FCD34D',
  WARNING: '#EF4444',
  EMERGENCY: '#7C2D12',
  DEFAULT: '#7C3AED',  // Purple for tribal areas
  SAFE: '#6D28D9'      // Darker purple stroke for no-hazard
};

// Tile layers - Dark theme (CARTO Dark Matter - no API key required)
export const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const DARK_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Light theme fallback
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Coastline overlay
export const COASTLINE_URL = '/data/coastlines-pacific.geojson';
export const COASTLINE_STYLE = {
  color: '#E5E7EB',      // Light gray for visibility on dark
  weight: 1.5,
  opacity: 0.9,
  fill: false
};

// NWS API
export const NWS_BASE_URL = 'https://api.weather.gov';
export const PNW_STATES = ['WA', 'OR', 'ID'];

// =============================================================================
// REGION DEFINITIONS
// =============================================================================

// Region bounds: [[south, west], [north, east]]
export const REGIONS = {
  BC: {
    id: 'BC',
    name: 'BC',
    description: 'Prince Rupert to Bellingham, Vancouver Island to Interior',
    bounds: [
      [48.7, -128.5],   // South: Bellingham WA, West: Vancouver Island
      [54.5, -121.5]    // North: Prince Rupert BC, East: Interior BC
    ],
    minZoom: 5,
    defaultZoom: 6,
    includeCanada: true
  },
  PNW: {
    id: 'PNW',
    name: 'PNW',
    description: 'Whistler to Redding, Coast to Lolo NF',
    bounds: [
      [40.6, -124.8],   // South: Redding CA, West: Coast
      [50.1, -114.5]    // North: Whistler BC, East: Lolo NF
    ],
    minZoom: 5,
    defaultZoom: 6,
    includeCanada: true
  },
  SALISH_SEA: {
    id: 'SALISH_SEA',
    name: 'Salish Sea',
    description: 'Squamish to Centralia, Tofino to Puget Sound',
    bounds: [
      [46.7, -125.9],   // South: Centralia WA, West: Tofino BC
      [49.7, -122.2]    // North: Squamish BC, East: Puget Sound shore
    ],
    minZoom: 7,
    defaultZoom: 9,
    includeCanada: true
  },
  ROCKIES: {
    id: 'ROCKIES',
    name: 'Rockies',
    description: 'Centered on Missoula, Cascades to Continental Divide',
    bounds: [
      [42.7, -118.3],   // South: Wind River area, West: Eastern Cascades
      [51.1, -109.7]    // North: Southern Alberta, East: Continental Divide
    ],
    minZoom: 5,
    defaultZoom: 6,
    includeCanada: true
  },
  COLUMBIA: {
    id: 'COLUMBIA',
    name: 'Columbia River',
    description: 'Columbia Gorge to Colville, Astoria to Idaho border',
    bounds: [
      [45.3, -124.2],   // South: Columbia Gorge, West: Astoria/mouth
      [48.8, -116.0]    // North: Colville area, East: Idaho border
    ],
    minZoom: 6,
    defaultZoom: 7,
    includeCanada: false
  }
};

// Default region
export const DEFAULT_REGION = 'PNW';

// Region order for UI
export const REGION_ORDER = ['BC', 'PNW', 'SALISH_SEA', 'ROCKIES', 'COLUMBIA'];

// =============================================================================
// RADAR CONFIGURATION
// =============================================================================

// NOAA NEXRAD radar via Iowa State Mesonet
export const RADAR_TILE_URL = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png';
export const RADAR_ATTRIBUTION = 'NOAA NEXRAD via Iowa State Mesonet';

// Environment Canada radar WMS
export const EC_RADAR_WMS_URL = 'https://geo.weather.gc.ca/geomet';
export const EC_RADAR_LAYER = 'RADAR_1KM_RDBR';

// =============================================================================
// CANADIAN DATA SOURCES
// =============================================================================

// Environment Canada Alerts WMS (visual overlay)
export const EC_ALERTS_WMS_URL = 'https://geo.weather.gc.ca/geomet';
export const EC_ALERTS_LAYER = 'ALERTS';

// Aboriginal Lands of Canada (First Nations boundaries)
export const FIRST_NATIONS_API_URL = 'https://proxyinternet.nrcan-rncan.gc.ca/arcgis/rest/services/CLSS-SATC/CLSS_Administrative_Boundaries/MapServer/0';

// Environment Canada API for alerts data
export const EC_API_BASE = 'https://api.weather.gc.ca';

// Canadian provinces for alert filtering
export const CANADA_PROVINCES = ['BC', 'AB', 'YT']; // British Columbia, Alberta, Yukon
