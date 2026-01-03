# SovereignSkies Architecture

Technical architecture documentation for the SovereignSkies weather alert dashboard.

## Overview

SovereignSkies is a React-based weather monitoring dashboard designed for Pacific Northwest Tribal Nations. It provides real-time weather alerts, river conditions, and marine data through a resilient, mobile-first interface.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SovereignSkies                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Alerts    │  │   Rivers    │  │   Marine    │   UI Layer  │
│  │    Page     │  │   Module    │  │   Module    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │                  Hooks Layer                   │              │
│  │  useAlerts  useRivers  useMarineConditions    │              │
│  │  useTribalData  useResilientPolling           │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │               Services Layer                   │              │
│  │  alertMatcher  cache  resilientFetch          │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │               Utilities Layer                  │              │
│  │  geometry  datetime  severityMapper           │              │
│  │  sanitize  safeParse  units  logger           │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/
│   ├── common/          # Shared components (SkipLink, ErrorBoundary)
│   ├── layout/          # App shell, navigation (AppShell, BottomNav)
│   ├── Map/             # Leaflet map components
│   │   ├── index.jsx    # Main map container
│   │   ├── AlertZones.jsx
│   │   ├── TribalBoundaries.jsx
│   │   ├── RiverGauges.jsx
│   │   └── ...
│   ├── pages/           # Route pages (Dashboard, AlertsPage)
│   └── ui/              # UI primitives (AlertCard, Chip, etc.)
├── hooks/
│   ├── useAlerts.js           # NWS/EC alert fetching
│   ├── useRivers.js           # USGS river gauge data
│   ├── useMarineConditions.js # NDBC buoy data
│   ├── useTribalData.js       # Tribal boundary GeoJSON
│   ├── useResilientPolling.js # Polling with backoff
│   └── useAppState.js         # Global app state
├── services/
│   ├── alertMatcher.js  # Alert-to-tribe matching
│   └── cache.js         # In-memory caching
├── utils/
│   ├── geometry.js      # Point-in-polygon, centroids
│   ├── datetime.js      # Timezone-aware formatting
│   ├── severityMapper.js # Unified severity scale
│   ├── sanitize.js      # XSS prevention
│   ├── safeParse.js     # Error-isolated parsing
│   ├── resilientFetch.js # Retry + circuit breaker
│   ├── units.js         # Metric/imperial conversion
│   ├── logger.js        # Structured logging
│   └── constants.js     # Configuration values
└── assets/              # Static assets
```

## Data Flow

### Alert Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   NWS API   │────▶│  useAlerts  │────▶│  Sanitize   │
│  (weather   │     │   (fetch)   │     │   (XSS)     │
│   .gov)     │     └──────┬──────┘     └──────┬──────┘
└─────────────┘            │                   │
                           ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   EC API    │────▶│  Parse &    │────▶│   Severity  │
│(weather.gc) │     │  Normalize  │     │   Mapper    │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Cache     │────▶│  AlertList  │
                    │  (5 min)    │     │    (UI)     │
                    └─────────────┘     └─────────────┘
```

### Resilient Polling Pattern

```
┌───────────────────────────────────────────────────────────┐
│                  useResilientPolling                       │
├───────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│  │ Initial │───▶│  Poll   │───▶│ Success │──┐            │
│  │  State  │    │ Request │    │         │  │            │
│  └─────────┘    └────┬────┘    └─────────┘  │            │
│                      │              ▲        │ Reset      │
│                      ▼              │        │ Interval   │
│                ┌─────────┐         │        │            │
│                │ Failure │─────────┘        │            │
│                └────┬────┘                  │            │
│                     │                        │            │
│                     ▼                        │            │
│  ┌───────────────────────────────────┐      │            │
│  │        Exponential Backoff         │      │            │
│  │  interval × 2^failures (capped)   │◀─────┘            │
│  └───────────────────────────────────┘                   │
└───────────────────────────────────────────────────────────┘
```

## Key Patterns

### 1. Cross-Border Data Harmonization

Alerts from US (NWS) and Canada (Environment Canada) use different formats:

| Field | NWS Format | EC Format | Unified |
|-------|-----------|-----------|---------|
| Severity | Extreme/Severe/Moderate/Minor | Warning/Watch/Advisory | 0-4 scale |
| Time | ISO 8601 | ISO 8601 | JavaScript Date |
| Geometry | GeoJSON | Polygon string | GeoJSON |
| ID | URN | UUID | String |

The `severityMapper.js` utility normalizes these to a unified 5-level scale:

```javascript
// Unified severity levels
const SEVERITY_LEVELS = {
  INFO: 0,      // Informational
  LOW: 1,       // Minor inconvenience
  MODERATE: 2,  // Moderate impact
  HIGH: 3,      // Significant threat
  CRITICAL: 4   // Life-threatening
};
```

### 2. Error Isolation

Each parsing and processing step is isolated to prevent cascade failures:

```javascript
// safeParse.js pattern
export function safeParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {
    logger.warn('Parse error');
    return null;  // Never throws
  }
}

// Batch processing with isolation
export function safeProcessBatch(items, processor) {
  return items.map(item => {
    try {
      return processor(item);
    } catch {
      return null;  // Skip failed items
    }
  }).filter(Boolean);
}
```

### 3. Circuit Breaker

External API calls use the circuit breaker pattern to fail fast during outages:

```
     CLOSED                  OPEN                 HALF_OPEN
  ┌─────────┐           ┌─────────┐           ┌─────────┐
  │ Normal  │──failure──▶│  Fast   │──timeout──▶│  Test   │
  │ Request │  threshold │  Fail   │           │ Request │
  └────┬────┘           └─────────┘           └────┬────┘
       │                      ▲                    │
       │                      │                    │
       │ success              └────failure─────────┘
       │                                           │
       └◀──────────────────success────────────────┘
```

### 4. Caching Strategy

```
┌─────────────────────────────────────────┐
│              Cache Layers               │
├─────────────────────────────────────────┤
│  Hook State (React)     │  Real-time    │
│  In-memory cache        │  5 min TTL    │
│  LocalStorage (future)  │  Persistent   │
└─────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── ErrorBoundary
│   └── AppShell
│       ├── TopStatusRail
│       ├── Routes
│       │   ├── Dashboard
│       │   │   ├── Map
│       │   │   │   ├── AlertZones
│       │   │   │   ├── TribalBoundaries
│       │   │   │   ├── RiverGauges
│       │   │   │   └── RadarLayer
│       │   │   └── ModulePanel (alerts/rivers/marine)
│       │   ├── AlertsPage
│       │   │   └── AlertList
│       │   │       └── AlertCard
│       │   └── MorePage
│       └── BottomNav
```

## External APIs

| Service | Purpose | Rate Limit | Fallback |
|---------|---------|------------|----------|
| NWS API | US weather alerts | ~10 req/s | Cached data |
| EC API | Canadian weather | Reasonable | Cached data |
| USGS Water | River gauges | Liberal | Cached data |
| NDBC | Buoy observations | Liberal | Cached data |
| OpenStreetMap | Tile layer | Standard | CARTO tiles |

## Security Measures

1. **XSS Prevention**: All alert content sanitized with DOMPurify
2. **CORS Handling**: Serverless functions proxy cross-origin requests
3. **Input Validation**: Coordinate and data validation in parsers
4. **No Secrets in Client**: API keys managed server-side

## Accessibility

- WCAG 2.1 AA compliant color contrast
- Keyboard navigation for all interactive elements
- Screen reader announcements for alert updates
- Skip links for map bypass
- Reduced motion support

## Performance Considerations

1. **Polling Intervals**: 60s for alerts, 10m for marine data
2. **Bundle Size**: Code-split by route
3. **Map Tiles**: Lazy-loaded, cached by browser
4. **GeoJSON**: Simplified geometries for rendering

## Testing Strategy

```
tests/
├── unit/           # 490+ tests - isolated component testing
│   ├── hooks/      # useResilientPolling, useAlerts, etc.
│   ├── utils/      # geometry, datetime, severityMapper
│   └── services/   # cache, alertMatcher
└── integration/    # 42+ tests - cross-component flows
    ├── alertPipeline.test.js   # End-to-end alert processing
    └── hooks.test.js           # Hook interaction patterns
```

Coverage targets: 80% statements, 75% branches.

## Future Considerations

1. **Offline Support**: Service worker for cached alerts
2. **Push Notifications**: Critical alert delivery
3. **Tribal Customization**: Per-nation theming
4. **Data Sovereignty**: Local data storage options
