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

// Legacy PNW center - Yakama Nation (for fallback)
export const PNW_CENTER = [46.3, -120.7];
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
  weight: 0.5,
  opacity: 0.7,
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
export const REGION_ORDER = ['PNW', 'BC', 'SALISH_SEA', 'COLUMBIA', 'ROCKIES'];

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

// =============================================================================
// NOWCOAST RADAR (OFFICIAL NWS - UPGRADED FROM IOWA MESONET)
// =============================================================================

// NOAA nowCOAST WMS via ArcGIS MapServer - proven working endpoint
// MRMS = Multi-Radar Multi-Sensor (1km resolution, 160+ radars combined)
// Reference: https://github.com/socib/Leaflet.TimeDimension/blob/master/examples/js/example14.js
export const NOWCOAST_WMS_URL = 'https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WMSServer';

// Layer IDs for nowCOAST ArcGIS WMSServer
// Layer '1' is the main NEXRAD base reflectivity mosaic
export const NOWCOAST_LAYERS = {
  RADAR_BASE: '1'  // NEXRAD base reflectivity
};

// Default layer for radar toggle
export const NOWCOAST_DEFAULT_LAYER = NOWCOAST_LAYERS.RADAR_BASE;

// nowCOAST attribution
export const NOWCOAST_ATTRIBUTION = 'NOAA nowCOAST';

// Alternative: NOAA GeoServer WMS (if ArcGIS has issues)
// URL: https://nowcoast.noaa.gov/geoserver/observations/weather_radar/wms
// Layers: conus_base_reflectivity_mosaic, alaska_base_reflectivity_mosaic, etc.

// =============================================================================
// MARINE MONITORING (NDBC BUOYS + CO-OPS TIDES)
// =============================================================================

// NOAA National Data Buoy Center
export const NDBC_BASE_URL = 'https://www.ndbc.noaa.gov';
export const NDBC_REALTIME_URL = 'https://www.ndbc.noaa.gov/data/realtime2';

// NOAA Center for Operational Oceanographic Products and Services
export const COOPS_API_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

// Key PNW Buoy Stations (NDBC)
export const PNW_BUOYS = [
  // Washington Coast
  { id: '46087', name: 'Neah Bay', lat: 48.494, lon: -124.727 },
  { id: '46041', name: 'Cape Elizabeth', lat: 47.353, lon: -124.731 },
  { id: '46029', name: 'Columbia River Bar', lat: 46.144, lon: -124.514 },
  { id: '46211', name: 'Grays Harbor', lat: 46.857, lon: -124.244 },
  // Oregon Coast
  { id: '46050', name: 'Stonewall Bank', lat: 44.669, lon: -124.526 },
  { id: '46015', name: 'Port Orford', lat: 42.764, lon: -124.832 },
  { id: '46027', name: 'St Georges', lat: 41.840, lon: -124.381 },
  // Offshore / Deep
  { id: '46005', name: 'Washington Offshore', lat: 46.100, lon: -131.001 },
  { id: '46002', name: 'Oregon Offshore', lat: 42.614, lon: -130.360 },
  // Salish Sea / Inside Waters
  { id: '46088', name: 'New Dungeness', lat: 48.333, lon: -123.167 },
  { id: '46120', name: 'Point Wells', lat: 47.761, lon: -122.397 }
];

// Key PNW Tide Stations (CO-OPS)
export const PNW_TIDE_STATIONS = [
  // Washington
  { id: '9447130', name: 'Seattle', lat: 47.6026, lon: -122.3393 },
  { id: '9443090', name: 'Neah Bay', lat: 48.3679, lon: -124.6166 },
  { id: '9441102', name: 'Westport', lat: 46.9043, lon: -124.1051 },
  { id: '9444900', name: 'Port Townsend', lat: 48.1129, lon: -122.7595 },
  { id: '9449880', name: 'Friday Harbor', lat: 48.5469, lon: -123.0107 },
  { id: '9442396', name: 'La Push', lat: 47.9133, lon: -124.6369 },
  { id: '9440910', name: 'Toke Point', lat: 46.7075, lon: -123.9669 },
  // Oregon
  { id: '9439040', name: 'Astoria', lat: 46.2073, lon: -123.7683 },
  { id: '9435380', name: 'South Beach', lat: 44.6256, lon: -124.0434 },
  { id: '9432780', name: 'Charleston', lat: 43.3450, lon: -124.3220 },
  { id: '9431647', name: 'Port Orford', lat: 42.7392, lon: -124.4983 }
];

// Marine condition thresholds for hazard detection
export const MARINE_THRESHOLDS = {
  HIGH_SURF: 3.0,      // meters (≈10 ft)
  GALE_WIND: 17.5,     // m/s (≈34 kt)
  STORM_WIND: 24.5,    // m/s (≈48 kt)
  STORM_SURGE: 0.5     // meters above predicted
};

// Polling interval for marine data (10 minutes - buoys update every 10-60 min)
export const MARINE_POLL_INTERVAL_MS = 10 * 60 * 1000;
