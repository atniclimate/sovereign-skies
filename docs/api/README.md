# SovereignSkies API Reference

API documentation for SovereignSkies utilities and hooks.

## Hooks

### useAlerts

Fetches and normalizes weather alerts from NWS and Environment Canada.

```javascript
import { useAlerts } from '@hooks/useAlerts';

const {
  alerts,        // Alert[] - normalized alerts
  isLoading,     // boolean
  error,         // Error | null
  lastUpdated,   // Date | null
  refresh        // () => Promise<void>
} = useAlerts({
  region: 'PNW',           // Region ID from constants
  includeCanada: true,     // Include EC alerts
  pollingInterval: 60000   // ms
});
```

**Alert Object:**
```typescript
interface Alert {
  id: string;
  source: 'nws' | 'ec';
  headline: string;
  description: string;
  severity: number;        // 0-4 unified scale
  severityLabel: string;   // 'INFO' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  urgency: string;
  certainty: string;
  effective: Date;
  expires: Date;
  geometry: GeoJSON.Geometry | null;
  areas: string[];
}
```

---

### useResilientPolling

Generic polling hook with exponential backoff and error recovery.

```javascript
import { useResilientPolling } from '@hooks/useResilientPolling';

const {
  data,            // T | null - latest fetched data
  error,           // Error | null
  isLoading,       // boolean
  lastUpdated,     // Date | null
  currentInterval, // number - current polling interval in ms
  refresh,         // () => Promise<void>
  forceRefresh,    // () => Promise<void> - resets backoff
  resetBackoff     // () => void - resets interval without fetching
} = useResilientPolling(fetchFn, {
  interval: 30000,      // Base polling interval (ms)
  immediate: true,      // Fetch on mount
  enabled: true,        // Enable/disable polling
  maxBackoff: 8,        // Max backoff multiplier
  onSuccess: (data) => {},
  onError: (error) => {}
});
```

**Backoff Formula:**
```
actualInterval = baseInterval × min(2^consecutiveFailures, maxBackoff)
```

---

### useRivers

Fetches USGS river gauge data for Pacific Northwest stations.

```javascript
import { useRivers } from '@hooks/useRivers';

const {
  rivers,        // RiverGauge[]
  isLoading,     // boolean
  error,         // Error | null
  lastUpdated    // Date | null
} = useRivers();
```

**RiverGauge Object:**
```typescript
interface RiverGauge {
  siteId: string;
  siteName: string;
  coordinates: [number, number]; // [lng, lat]
  flow: number | null;           // cfs
  stage: number | null;          // ft
  floodStage: number | null;     // ft
  status: 'normal' | 'action' | 'minor' | 'moderate' | 'major';
  timestamp: Date;
}
```

---

### useMarineConditions

Fetches NDBC buoy and CO-OPS tide station data.

```javascript
import { useMarineConditions } from '@hooks/useMarineConditions';

const {
  buoys,         // BuoyData[]
  tides,         // TideData[]
  isLoading,     // boolean
  error          // Error | null
} = useMarineConditions();
```

---

### useTribalData

Loads tribal boundary GeoJSON for the current region.

```javascript
import { useTribalData } from '@hooks/useTribalData';

const {
  tribalData,    // GeoJSON.FeatureCollection | null
  isLoading,     // boolean
  error          // Error | null
} = useTribalData(regionId);
```

---

## Utilities

### geometry

Point-in-polygon and geometric utilities.

```javascript
import {
  pointInPolygon,
  pointInMultiPolygon,
  getBoundingBox,
  getPolygonCentroid,
  resolveAlertGeometry,
  isValidGeometry
} from '@utils/geometry';

// Check if point is inside polygon
const isInside = pointInPolygon([lng, lat], polygon);

// Get bounding box
const bbox = getBoundingBox(polygon);
// Returns: { minX, minY, maxX, maxY }

// Get polygon center
const center = getPolygonCentroid(polygon);
// Returns: [lng, lat]

// Resolve alert geometry with fallbacks
const geometry = resolveAlertGeometry(alert, zones);
```

---

### severityMapper

Maps NWS/EC severity to unified scale.

```javascript
import {
  mapNWSSeverity,
  mapECSeverity,
  getSeverityLabel,
  getSeverityColor
} from '@utils/severityMapper';

// Map NWS severity with urgency/certainty boosts
const { level, label } = mapNWSSeverity('Severe', 'Immediate', 'Observed');
// level: 4, label: 'CRITICAL'

// Map EC severity from alert type
const { level, label } = mapECSeverity('warning');
// level: 3, label: 'HIGH'

// Get display properties
const label = getSeverityLabel(3);  // 'HIGH'
const color = getSeverityColor(3);  // '#EF4444'
```

**Severity Scale:**
| Level | Label | Color | Description |
|-------|-------|-------|-------------|
| 0 | INFO | #6B7280 | Informational |
| 1 | LOW | #10B981 | Minor impact |
| 2 | MODERATE | #F59E0B | Moderate impact |
| 3 | HIGH | #EF4444 | Significant threat |
| 4 | CRITICAL | #7C2D12 | Life-threatening |

---

### datetime

Timezone-aware date formatting.

```javascript
import {
  formatAlertTime,
  formatRelativeTime,
  parseAlertDate,
  isExpired,
  getTimeUntilExpiry
} from '@utils/datetime';

// Format for display
formatAlertTime(date);  // "Jan 3, 2:30 PM PST"

// Relative time
formatRelativeTime(date);  // "2 hours ago"

// Parse alert dates (handles ISO 8601)
const date = parseAlertDate('2025-01-03T14:30:00-08:00');

// Check expiration
isExpired(alert);  // true/false

// Time until expiry
getTimeUntilExpiry(alert);  // "Expires in 3 hours"
```

---

### sanitize

XSS prevention for alert content.

```javascript
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeAlert
} from '@utils/sanitize';

// Sanitize HTML (allows safe tags)
const safe = sanitizeHTML('<p>Alert</p><script>bad</script>');
// "<p>Alert</p>"

// Strip all HTML
const text = sanitizeText('<p>Alert</p>');
// "Alert"

// Sanitize entire alert object
const safeAlert = sanitizeAlert(rawAlert);
```

---

### safeParse

Error-isolated parsing utilities.

```javascript
import {
  safeParseJSON,
  safeParseNumber,
  safeParseCoordinates,
  safeGet,
  safeProcessBatch
} from '@utils/safeParse';

// Parse JSON without throwing
const data = safeParseJSON(jsonString);  // null on error

// Parse numbers safely
const num = safeParseNumber('42.5', 0);  // 42.5

// Parse coordinates with validation
const coords = safeParseCoordinates(lat, lon);
// [lon, lat] or null if invalid

// Safe nested property access
const value = safeGet(obj, 'a.b.c', 'default');

// Process batch with error isolation
const results = safeProcessBatch(items, processor);
// Skips failed items, returns successes
```

---

### units

Metric/imperial unit conversion.

```javascript
import {
  metersToFeet,
  feetToMeters,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  kphToMph,
  mphToKph,
  kmToMiles,
  milesToKm,
  formatTemperature,
  formatDistance,
  formatSpeed
} from '@utils/units';

// Conversions
metersToFeet(10);  // 32.808...
celsiusToFahrenheit(20);  // 68

// Formatted output
formatTemperature(20, 'metric');    // "20°C"
formatTemperature(68, 'imperial');  // "68°F"
formatDistance(10, 'metric');       // "10 km"
formatSpeed(100, 'metric');         // "100 km/h"
```

---

### resilientFetch

Fetch with retry logic and circuit breaker.

```javascript
import {
  resilientFetch,
  CircuitBreaker,
  fetchWithCircuitBreaker
} from '@utils/resilientFetch';

// Basic resilient fetch
const response = await resilientFetch(url, {}, {
  retries: 3,
  timeout: 10000,
  context: 'NWS'
});

// Circuit breaker for API protection
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000,
  context: 'USGS'
});

// Fetch with circuit breaker
const data = await fetchWithCircuitBreaker(breaker, url, options);
```

---

### logger

Structured logging with level filtering.

```javascript
import createLogger from '@utils/logger';
import { alertsLogger, mapLogger } from '@utils/logger';

// Create custom logger
const logger = createLogger('MyComponent');

// Log methods
logger.debug('Verbose info', { data });  // Dev only
logger.info('General info', { data });   // Dev only
logger.warn('Warning', { data });         // Always
logger.error('Error', error);             // Always
```

---

## Services

### cache

In-memory cache with TTL.

```javascript
import { getCached, setCached, clearCache } from '@services/cache';

// Set with TTL (ms)
setCached('alerts', data, 300000);  // 5 min TTL

// Get (returns null if expired)
const data = getCached('alerts');

// Clear specific key or all
clearCache('alerts');
clearCache();
```

---

### alertMatcher

Match alerts to tribal boundaries.

```javascript
import {
  matchAlertsToTribes,
  getAlertsForTribe
} from '@services/alertMatcher';

// Get highest severity per tribe
const tribalAlerts = matchAlertsToTribes(alerts, tribalGeoJSON);
// { 'tribe-id': 'WARNING', ... }

// Get all alerts affecting a tribe
const alerts = getAlertsForTribe(alerts, tribeFeature);
```

---

## Constants

Key configuration values in `@utils/constants`:

```javascript
import {
  MAP_BOUNDS,
  REGIONS,
  DEFAULT_REGION,
  POLL_INTERVAL_MS,
  SEVERITY_COLORS,
  NWS_BASE_URL,
  EC_API_BASE,
  PNW_BUOYS,
  PNW_TIDE_STATIONS
} from '@utils/constants';
```

See `src/utils/constants.js` for complete reference.
