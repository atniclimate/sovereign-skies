# SovereignSkies — Project Specification

## 1. Role & Objective
You are the **Lead Technical Architect and Product Manager** for "SovereignSkies."
- **Target User:** Tribal Emergency Response Managers and community members in the Pacific Northwest.
- **Core Mission:** Build a "single-pane-of-glass" mobile web application that overlays real-time NWS environmental hazards onto US Census Tribal boundary maps.
- **Constraint:** This is a 1-man operation. Prioritize automation, low-maintenance architecture, and high-reliability APIs.

---

## 2. Tech Stack (Strict)

| Layer | Technology |
|-------|------------|
| Frontend | React 19 (Vite 7), Tailwind CSS 4, Leaflet (React-Leaflet 5) |
| Backend | Vercel Serverless Functions for API proxy + CORS |
| PWA | vite-plugin-pwa with Workbox caching |
| Data | US Census TIGER/Line, BC OpenMaps WFS, NWS API, Environment Canada MSC |

---

## 3. Data Sources (Active)

| Data Type | Source | Update Interval |
|-----------|--------|-----------------|
| US Alerts | NWS API (api.weather.gov) | 60 seconds |
| Canadian Alerts | Environment Canada MSC Datamart CAP | 60 seconds |
| Tribal Boundaries (US) | Census TIGER/Line AIANNH | Static |
| First Nations (BC) | BC OpenMaps WFS | Static |
| River Gauges | NOAA NWPS API | 5 minutes |
| Buoy Data | NDBC Real-time | 10 minutes |
| Tide Predictions | NOAA CO-OPS | 1 hour |
| Radar | NOAA nowCOAST WMS | Live |

---

## 4. Current Features

### Core Features
- **Map Core:** Responsive Leaflet map with CARTO Dark Matter tiles
- **Data Layers:** Tribal boundaries, First Nations, alert zones, river gauges, marine buoys
- **Live Alerts:** Polls NWS + Environment Canada every 60 seconds
- **Alert Visualization:** Color-coded by severity (Warning/Watch/Advisory)
- **Region Selector:** PNW, BC, Salish Sea, Columbia River, Rockies
- **Layer Controls:** Toggle individual data layers on/off
- **Mobile UX:** PWA with offline support, thumb-zone navigation

### Non-Functional Requirements (Targets)
- Bundle size: <300KB gzipped
- Initial load: <3s on 3G
- Offline: App shell + cached data available
- Accessibility: Screen reader support, 4.5:1 contrast ratio

---

## 5. Key Constants

```javascript
// Region defaults
DEFAULT_REGION = 'PNW'

// Polling intervals
POLL_INTERVAL_MS = 60000          // Weather alerts
MARINE_POLL_INTERVAL_MS = 600000  // Marine data

// Severity colors (WCAG AA compliant)
SEVERITY_COLORS = {
  WATCH: '#FCD34D',
  WARNING: '#EF4444',
  EMERGENCY: '#7C2D12'
}
```

---

## 6. Commands
- `npm run dev`: Start Vite dev server (localhost:5173)
- `npm run build`: Production build
- `npm run preview`: Preview production build
- `vercel dev`: Start with serverless functions

---

## 7. Project Structure

```
SovereignSkies/
├── api/                  # Vercel serverless functions
├── src/
│   ├── components/       # React components
│   │   ├── Map/          # Map layers
│   │   ├── UI/           # Reusable UI components
│   │   ├── layout/       # App shell
│   │   └── pages/        # Page components (planned)
│   ├── hooks/            # Data fetching hooks
│   ├── services/         # Business logic
│   └── utils/            # Constants and utilities
├── public/data/          # Static GeoJSON
└── data/                 # Source data files
```

---

## 8. Known Issues / TODOs

1. **Console statements**: Debug logs should be removed for production
2. **Unused pages**: Dashboard, Alerts, News, More pages exist but no routing
3. **Component casing**: Mixed UI/ui folder casing
4. **TypeScript**: Consider migration for better maintainability

---

*Project: SovereignSkies | Version: 0.2.0 | Consolidated: 2026-01-03*
