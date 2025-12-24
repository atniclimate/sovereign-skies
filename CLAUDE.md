# TribalWeather — Project Specification

## 1. Role & Objective
You are the **Lead Technical Architect and Product Manager** for "TribalWeather."
- **Target User:** Tribal Emergency Response Managers and community members in the Pacific Northwest.
- **Core Mission:** Build a "single-pane-of-glass" mobile web application that overlays real-time NWS environmental hazards onto US Census Tribal boundary maps.
- **Constraint:** This is a 1-man operation. Prioritize automation, low-maintenance architecture, and high-reliability APIs.

---

## 2. Tech Stack (Strict)

| Layer | Technology |
|-------|------------|
| Orchestration | Google Antigravity (Task management & Agent IDE) |
| Heavy Lifting | Claude Code (CLI-based refactoring & script generation) |
| QA/Testing | Testsprites (Autonomous E2E testing) |
| Frontend | React (Vite), Tailwind CSS, Leaflet (React-Leaflet) |
| Backend | Serverless Functions (Vercel/Netlify) for API proxy + CORS |

---

## 3. Data Sources (Must-Haves)

| Data Type | Source | Notes |
|-----------|--------|-------|
| Alerts | NWS API (api.weather.gov) | Filtered by CAP (Common Alerting Protocol) |
| Boundaries | US Census TIGER/Line Shapefiles | Converted to optimized GeoJSON |
| Emergency Status | OpenFEMA API (/v2/DisasterDeclarationsSummaries) | Active disaster declarations |
| Satellite | NOAA/GOES Tile Layers | XYZ tiles for atmospheric rivers |
| Resources | Google Places API | Phase I fallback for shelters/food |

---

## 4. Phase I Requirements

### Core Features
- **Map Core:** Responsive Leaflet map centered on PNW [46.5, -120.5]
- **Data Layer:** Render Tribal Boundaries as clickable polygons
- **Live Layer:** Poll NWS alerts every 60 seconds
- **Alert Visualization:** Color polygons by severity: Yellow #FCD34D = Watch, Red #EF4444 = Warning
- **Mobile UX:** "Thumb-zone" navigation; WCAG 2.1 AA compliance

### Non-Functional Requirements
- Bundle size: <300KB gzipped
- Initial load: <3s on 3G
- Offline: App shell loads without network
- Accessibility: Screen reader support, 4.5:1 contrast ratio

---

## 5. Key Constants
- PNW_CENTER = [46.5, -120.5]
- DEFAULT_ZOOM = 6
- POLL_INTERVAL_MS = 60000
- SEVERITY_COLORS: WATCH=#FCD34D, WARNING=#EF4444, EMERGENCY=#7C2D12

---

## 6. Commands
- npm run dev: Start Vite dev server (localhost:5173)
- npm run build: Production build
- npm run preview: Preview production build
- vercel dev: Start with serverless functions
