# SovereignSkies

Real-time NWS environmental hazards overlay for Pacific Northwest Tribal communities.

## Overview

SovereignSkies (also known as TribalWeather) is a Progressive Web App (PWA) that provides Tribal Emergency Response Managers and community members with a "single-pane-of-glass" view of environmental hazards across the Pacific Northwest region, including cross-border coverage for British Columbia and Alberta.

## Features

### Core Capabilities
- **Weather Alerts**: Real-time NWS alerts (WA, OR, ID) with zone geometry rendering
- **Canadian Alerts**: Environment Canada MSC Datamart CAP alerts for BC and Alberta
- **Tribal Boundaries**: US Census TIGER/Line data + BC First Nations boundaries
- **River Gauges**: NOAA NWPS flood status for Pacific Northwest waterways
- **Marine Conditions**: NDBC buoy observations and CO-OPS tide predictions
- **Radar Layers**: NOAA nowCOAST NEXRAD and Environment Canada radar WMS

### User Experience
- Dark "Night Ops" theme with WCAG 2.1 AA accessibility
- Mobile-first responsive design with thumb-zone navigation
- PWA with offline caching of map tiles and data
- Region selector (PNW, BC, Salish Sea, Columbia River, Rockies)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, React-Leaflet 5 |
| Styling | Tailwind CSS 4 (via PostCSS) |
| Mapping | Leaflet, CARTO Dark Matter tiles |
| PWA | vite-plugin-pwa with Workbox caching |
| Backend | Vercel Serverless Functions |

## Quick Start

```bash
# Install dependencies
npm install

# Development (runs on localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# With Vercel serverless functions
vercel dev
```

## Project Structure

```
SovereignSkies/
├── api/                  # Vercel serverless functions
│   ├── alerts.js         # NWS alerts proxy
│   └── rivers.js         # NWPS river gauges proxy
├── src/
│   ├── components/
│   │   ├── Map/          # Map layers and controls
│   │   ├── UI/           # Reusable UI components
│   │   ├── layout/       # App shell, navigation
│   │   ├── pages/        # Page components
│   │   └── common/       # Common utilities
│   ├── hooks/            # Custom React hooks
│   │   ├── useAlerts.js  # Weather alerts (US + Canada)
│   │   ├── useRivers.js  # River gauge data
│   │   ├── useTribalData.js  # Tribal boundaries
│   │   └── useMarineConditions.js  # Buoys and tides
│   ├── services/         # Business logic
│   │   ├── cache.js      # LocalStorage caching with TTL
│   │   └── alertMatcher.js  # Tribal-alert intersection
│   └── utils/
│       └── constants.js  # Configuration, API endpoints
├── public/
│   └── data/             # Static GeoJSON files
├── data/
│   ├── processed/        # Production-ready GeoJSON
│   └── raw/              # Source shapefiles
└── CLAUDE.md             # AI assistant context
```

## Data Sources

| Data Type | Source | Update Frequency |
|-----------|--------|------------------|
| US Weather Alerts | NWS API (api.weather.gov) | 60 seconds |
| Canadian Alerts | Environment Canada MSC Datamart | 60 seconds |
| Tribal Boundaries (US) | Census TIGER/Line AIANNH | Static |
| First Nations (BC) | BC OpenMaps WFS | Static |
| River Gauges | NOAA NWPS API | 5 minutes |
| Buoy Data | NDBC Real-time | 10 minutes |
| Tide Predictions | NOAA CO-OPS API | 1 hour |
| Radar | NOAA nowCOAST WMS | Live |

## Environment Variables

No environment variables required for development. The app uses public APIs directly.

For production with Environment Canada proxy:
- The Vite dev server proxies `/ec-alerts` to `dd.weather.gc.ca` to avoid CORS issues.

## Configuration

Key constants in `src/utils/constants.js`:

```javascript
// Polling intervals
POLL_INTERVAL_MS = 60000      // Weather alerts
MARINE_POLL_INTERVAL_MS = 600000  // Marine data

// Map regions
REGIONS = { PNW, BC, SALISH_SEA, COLUMBIA, ROCKIES }

// Severity colors
SEVERITY_COLORS = { WATCH, WARNING, EMERGENCY }
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Test Coverage:**
- 549+ tests across unit and integration suites
- 80%+ statement coverage target
- Integration tests for alert pipeline and hook interactions

## Documentation

- [Architecture](./docs/architecture.md) - System design and data flow
- [API Reference](./docs/api/README.md) - Hooks and utilities documentation

## Contributing

This project is maintained by a 1-person team. Priorities are:
1. Reliability over features
2. Accessibility compliance
3. Performance on 3G networks
4. Cross-border data coverage

## License

MIT

---

*Built for Pacific Northwest Tribal Emergency Management*
