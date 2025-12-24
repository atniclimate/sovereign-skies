// Map defaults
export const PNW_CENTER = [46.5, -120.5];
export const DEFAULT_ZOOM = 6;
export const MIN_ZOOM = 4;
export const MAX_ZOOM = 18;

// Alert polling
export const POLL_INTERVAL_MS = 60000;
export const ALERT_CACHE_TTL_MS = 300000;

// Severity colors (WCAG AA compliant)
export const SEVERITY_COLORS = {
  WATCH: '#FCD34D',
  WARNING: '#EF4444',
  EMERGENCY: '#7C2D12',
  DEFAULT: '#4A90D9'
};

// Tile layers
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// NOAA GOES-West Satellite (CONUS visible/IR composite)
export const GOES_TILE_URL = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-west-conus-ir/{z}/{x}/{y}.png';
export const GOES_ATTRIBUTION = 'NOAA GOES-West via Iowa State Mesonet';

// NWS API
export const NWS_BASE_URL = 'https://api.weather.gov';
export const PNW_STATES = ['WA', 'OR', 'ID'];
