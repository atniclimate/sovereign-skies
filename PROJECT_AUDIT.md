# PNW Weather Alerts - Project Audit & Development Roadmap

**Generated:** December 24, 2024
**Project:** tribal-weather-alert
**Live URL:** https://resplendent-fairy-70d963.netlify.app/
**SquareSpace Integration:** IndigenousACCESS.org/forecast

---

## STEP 1: Project Inventory

### 1.1 Repository Map

```
tribal-weather-alert/
├── dist/                          # Production build output (Netlify deploy)
├── public/
│   └── data/
│       ├── tribes-pnw.min.geojson # US Tribal boundaries (252KB)
│       └── coastlines-pacific.geojson # Coastline overlay (50KB)
├── api/                           # Vercel serverless functions (CORS proxy)
│   ├── alerts.js                  # NWS alerts proxy + zone geometry
│   └── rivers.js                  # USGS/NOAA rivers proxy
├── src/
│   ├── App.jsx                    # Root: AppShell + Map + LoadingOverlay
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Complete design system (2775 lines)
│   ├── components/
│   │   ├── Map/
│   │   │   ├── index.jsx          # Main map controller (439 lines)
│   │   │   ├── MapSetup.jsx       # TileLayer + attribution
│   │   │   ├── Controls.jsx       # Layer toggle buttons
│   │   │   ├── RegionSelector.jsx # BC/PNW/Salish/Rockies/Columbia
│   │   │   ├── AlertZones.jsx     # NWS alert polygons
│   │   │   ├── CanadianAlerts.jsx # Environment Canada overlays
│   │   │   ├── TribalBoundaries.jsx # Clickable tribal polygons
│   │   │   ├── RiverGauges.jsx    # USGS flood markers
│   │   │   ├── RadarLayer.jsx     # NEXRAD + EC WMS radar
│   │   │   ├── Coastlines.jsx     # Pacific coastline overlay
│   │   │   └── MapControls.jsx    # Zoom/reset controls
│   │   ├── UI/
│   │   │   ├── ModulePanel.jsx    # Reusable panel container
│   │   │   ├── MetricTile.jsx     # Dashboard stat tiles
│   │   │   ├── AlertCard.jsx      # Individual alert display
│   │   │   ├── AlertList.jsx      # Scrollable alert list
│   │   │   ├── Chip.jsx           # Tag/label component
│   │   │   ├── FilterRow.jsx      # Filter controls
│   │   │   ├── SearchInput.jsx    # Search component
│   │   │   ├── BottomSheet.jsx    # Mobile drawer
│   │   │   └── LoadingOverlay.jsx # Splash screen
│   │   ├── layout/
│   │   │   ├── AppShell.jsx       # App wrapper + offline banner
│   │   │   ├── TopStatusRail.jsx  # Status bar (hidden)
│   │   │   └── BottomNav.jsx      # Mobile navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Metrics dashboard view
│   │   │   ├── AlertsPage.jsx     # Full alert list page
│   │   │   ├── NewsPage.jsx       # News/updates page
│   │   │   └── MorePage.jsx       # Settings/more page
│   │   └── common/
│   │       └── SkipLink.jsx       # A11y skip navigation
│   ├── hooks/
│   │   ├── useAlerts.js           # NWS + Environment Canada (622 lines)
│   │   ├── useTribalData.js       # US Census + BC OpenMaps
│   │   ├── useRivers.js           # USGS + NOAA flood data
│   │   └── useAppState.js         # Loading state management
│   ├── services/
│   │   ├── cache.js               # LocalStorage with TTL
│   │   └── alertMatcher.js        # Point-in-polygon matching
│   └── utils/
│       └── constants.js           # All config + API endpoints
├── index.html                     # Entry HTML
├── vite.config.js                 # Vite + PWA config
├── package.json                   # Dependencies
├── CLAUDE.md                      # Project specification
└── PROJECT_AUDIT.md               # This file
```

### 1.2 Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REACT APP (Vite + PWA)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  App.jsx                                                                │
│  ├── SkipLink (a11y)                                                    │
│  ├── LoadingOverlay                                                     │
│  └── AppShell                                                           │
│      └── Map/index.jsx (main controller)                                │
│          ├── MapSetup (base tiles)                                      │
│          ├── Controls (layer toggles)                                   │
│          ├── RegionSelector (viewport presets)                          │
│          ├── Coastlines                                                 │
│          ├── TribalBoundaries (US + BC)                                │
│          ├── AlertZones (NWS polygons)                                  │
│          ├── CanadianAlerts (EC polygons)                               │
│          ├── RiverGauges (USGS markers)                                 │
│          ├── RadarLayer (NEXRAD + EC WMS)                               │
│          └── AlertList (sidebar panel)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  HOOKS (Data Layer)                                                     │
│  ├── useAlerts.js → NWS API + EC CAP files → 60s polling               │
│  ├── useTribalData.js → Static GeoJSON + BC WFS → 24h cache            │
│  ├── useRivers.js → USGS + NOAA APIs → 5min cache                      │
│  └── useAppState.js → Loading orchestration                            │
├─────────────────────────────────────────────────────────────────────────┤
│  SERVICES                                                               │
│  ├── cache.js → LocalStorage TTL wrapper                               │
│  └── alertMatcher.js → Point-in-polygon geographic matching            │
├─────────────────────────────────────────────────────────────────────────┤
│  EXTERNAL DATA SOURCES                                                  │
│  ├── NWS API (api.weather.gov) → US alerts                             │
│  ├── Environment Canada MSC Datamart → Canadian CAP alerts            │
│  ├── BC OpenMaps WFS → First Nations boundaries                        │
│  ├── USGS Water Services → River gauge readings                        │
│  ├── NOAA NWPS → Flood categories                                      │
│  ├── Iowa State Mesonet → GOES satellite tiles                         │
│  ├── NOAA MRMS → NEXRAD radar tiles                                    │
│  └── Environment Canada GeoMet → Canadian radar WMS                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Related Projects

| Project | Path | Relationship |
|---------|------|--------------|
| tribal-forecast | `../tribal-forecast/` | TypeScript version, possible successor |
| cascadia-geospatial | `../cascadia-geospatial/` | GIS data repository |
| squarespace-embed.html | `../squarespace-embed.html` | SquareSpace dashboard code |

---

## STEP 2: Current Feature Matrix

| Module | Status | Files | Data Dependencies | Known Issues / Fragility |
|--------|--------|-------|-------------------|--------------------------|
| **Map Core (Leaflet)** | WORKS | `Map/index.jsx`, `MapSetup.jsx` | OpenStreetMap tiles | None - stable |
| **NWS Alert Polygons** | WORKS | `AlertZones.jsx`, `useAlerts.js:1-300` | api.weather.gov/alerts | Some alerts lack geometry (zones only) |
| **Canadian Alerts (EC)** | PARTIAL | `CanadianAlerts.jsx`, `useAlerts.js:300-622` | dd.weather.gc.ca CAP | CORS requires Vite proxy; bounding boxes approximate |
| **US Tribal Boundaries** | WORKS | `TribalBoundaries.jsx`, `useTribalData.js` | `/data/tribes-pnw.min.geojson` | Static file, manual update needed |
| **BC First Nations** | WORKS | `TribalBoundaries.jsx`, `useTribalData.js` | BC OpenMaps WFS | API occasionally slow |
| **River Gauges** | WORKS | `RiverGauges.jsx`, `useRivers.js` | USGS + NOAA NWPS | Some gauges lack flood thresholds |
| **GOES Satellite Layer** | WORKS | `constants.js` tile URL | mesonet.agron.iastate.edu | Free tier, no SLA |
| **NEXRAD Radar** | WORKS | `RadarLayer.jsx` | NOAA MRMS tiles | 5-min refresh |
| **EC Radar (Canada)** | WORKS | `RadarLayer.jsx` | EC GeoMet WMS | Separate layer for Canadian coverage |
| **Region Selector** | WORKS | `RegionSelector.jsx`, `constants.js` | None (viewport presets) | BC region needs boundary refinement |
| **Alert-to-Tribe Matching** | PARTIAL | `alertMatcher.js` | In-memory geometry | Point-in-polygon only; no overlap % |
| **Caching (LocalStorage)** | WORKS | `cache.js` | None | No cache invalidation on error |
| **PWA / Offline** | WORKS | `vite.config.js` | Service Worker | Only caches app shell + tiles |
| **Dashboard Page** | EXISTS | `pages/Dashboard.jsx` | Props from parent | Not wired into routing |
| **Alerts Page** | EXISTS | `pages/AlertsPage.jsx` | Props from parent | Not wired into routing |
| **News Page** | EXISTS | `pages/NewsPage.jsx` | None | Placeholder content only |
| **More Page** | EXISTS | `pages/MorePage.jsx` | None | Placeholder content only |
| **BottomNav (Mobile)** | EXISTS | `layout/BottomNav.jsx` | None | Not rendered in current App.jsx |
| **TopStatusRail** | HIDDEN | `layout/TopStatusRail.jsx` | useAlerts | `hideStatusRail={true}` in App.jsx |

### Feature Gaps (Not Implemented)

| Feature (from CLAUDE.md) | Status | Notes |
|--------------------------|--------|-------|
| OpenFEMA Disaster Declarations | NOT STARTED | API endpoint defined in spec |
| Google Places (shelters/food) | NOT STARTED | Phase I fallback per spec |
| Alert severity color coding | PARTIAL | CSS defined, not all applied |
| WCAG 2.1 AA compliance audit | NOT DONE | SkipLink exists, full audit needed |
| Bundle size < 300KB gzipped | UNKNOWN | Needs measurement |
| Initial load < 3s on 3G | UNKNOWN | Needs measurement |

---

## STEP 3: Site Review - IndigenousACCESS.org Integration

### Current SquareSpace Dashboard

The `squarespace-embed.html` (1913 lines) is a self-contained dashboard with:

| Component | Description | Data Source |
|-----------|-------------|-------------|
| Header + Alert Banner | Dynamic severity banner | NWS API (fetch in-page) |
| Tribal Selector | 43 tribes dropdown | Hardcoded coords |
| Active Warnings Panel | Filterable alert list | NWS API |
| **PNW Weather Alerts iframe** | Embedded React app | Netlify deployment |
| AR Tracking GIF | 72-hour TPW animation | CIMSS/UW-Madison |
| AR Landfall Forecast | 16-day probability | CW3E/Scripps |
| Local 7-Day Forecast | NWS point forecast | NWS API |
| River Gauges | USGS nearby gauges | USGS Water Services |
| Resources Grid | External links | Static |
| Emergency Contacts | Phone numbers | Static |

### Duplication & Inconsistency Issues

| Issue | SquareSpace | React App | Recommendation |
|-------|-------------|-----------|----------------|
| NWS Alert Fetching | Own fetch in `<script>` | `useAlerts.js` | Single source of truth |
| Alert Display | Severity classes differ | Different severity map | Unify severity colors |
| Tribe List | 43 tribes hardcoded | Fetches dynamically | Sync lists |
| River Gauges | Bounding box query | Site-based query | Both valid, document |
| Styling | CSS custom properties | Tailwind-ish design system | Different themes OK |

### Embed Behavior

- **iframe URL:** `https://resplendent-fairy-70d963.netlify.app/`
- **Responsive heights:** 500px (mobile) → 600px (tablet) → 700px (desktop)
- **Loading:** `lazy` (good)
- **Permissions:** `allow="geolocation"` (good)

### Known Issues

1. **Responsive sidebar:** Added media queries for `max-height` to compact sidebar in iframe context (FIXED in previous session)
2. **CORS for EC alerts:** Requires Vite dev proxy; production build uses direct fetch (may fail)
3. **No communication:** iframe and parent page don't share data (duplication)

---

## STEP 4: Bug Hunt Plan

### 4.1 Critical Path Testing

| Test Case | Files | How to Test | Pass Criteria |
|-----------|-------|-------------|---------------|
| App loads without error | `App.jsx`, `main.jsx` | Open Netlify URL | No console errors, map renders |
| NWS alerts fetch | `useAlerts.js:1-300` | Dev tools Network tab | 200 response, features array |
| EC alerts fetch (dev) | `useAlerts.js:300+` | `npm run dev`, check Network | Proxy works, CAP files load |
| EC alerts fetch (prod) | `useAlerts.js:300+` | Netlify URL, check Network | May fail CORS - document |
| Tribal data loads | `useTribalData.js` | Check map polygons | 29+ WA tribes visible |
| BC First Nations load | `useTribalData.js` | Pan to BC, check polygons | WFS response, polygons render |
| River gauges load | `useRivers.js` | Check gauge markers | Colored dots on rivers |
| Radar layer toggles | `RadarLayer.jsx` | Click radar control | Tiles appear/disappear |
| Region selector works | `RegionSelector.jsx` | Click each region | Map pans correctly |
| Offline mode | PWA | DevTools → Offline | App shell loads, cached tiles |

### 4.2 Suspected Fragility Points

| Component | Risk | Mitigation |
|-----------|------|------------|
| EC CAP file parsing | HIGH | XML structure changes break parsing |
| BC WFS endpoint | MEDIUM | Government APIs can change without notice |
| CIMSS satellite tiles | LOW | Third-party academic server |
| Mesonet GOES tiles | LOW | Free tier, but stable history |
| Alert geometry fallback | HIGH | Zones without polygons use region bounds |

### 4.3 Instrumentation Recommendations

```javascript
// Add to useAlerts.js
console.log('[Alerts] Fetching NWS...', { region, timestamp: Date.now() });
console.log('[Alerts] NWS result:', { count: alerts.length, error: err?.message });
console.log('[Alerts] Fetching EC...', { regions: canadianRegions });
console.log('[Alerts] EC result:', { count: ecAlerts.length, parseErrors });

// Add to useTribalData.js
console.log('[Tribal] Loading US data...');
console.log('[Tribal] Loading BC data...');
console.log('[Tribal] Combined:', { usCount, bcCount, totalFeatures });

// Add to useRivers.js
console.log('[Rivers] Fetching gauges...', { sites: siteList });
console.log('[Rivers] Result:', { gaugeCount, floodingCount });
```

---

## STEP 5: Integration Roadmap

### Phase 0: Stabilization (CURRENT)

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Document EC CORS behavior prod vs dev | P0 | 1h | README, useAlerts.js |
| Add error boundaries to Map | P0 | 2h | Map/index.jsx |
| Verify PWA caching works | P0 | 1h | vite.config.js, manual test |
| Add console logging per 4.3 | P1 | 2h | All hooks |
| Measure bundle size | P1 | 30m | `npm run build`, check dist |

### Phase 1: Data Reliability

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Add fallback for EC CORS in prod | P0 | 4h | useAlerts.js, add Netlify function |
| Add retry logic to all fetches | P1 | 3h | All hooks |
| Add stale-while-revalidate to cache | P1 | 2h | cache.js |
| Validate tribal GeoJSON freshness | P2 | 1h | Compare to Census source |

### Phase 2: Feature Completion

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Wire up Dashboard page routing | P1 | 4h | App.jsx, add react-router |
| Wire up Alerts page routing | P1 | 2h | App.jsx |
| Wire up BottomNav for mobile | P1 | 2h | App.jsx, BottomNav.jsx |
| Show TopStatusRail (unhide) | P2 | 30m | App.jsx |
| Add OpenFEMA disaster data | P2 | 8h | New hook, new layer |
| Add alert-to-tribe matching UI | P2 | 6h | alertMatcher.js, UI |

### Phase 3: Polish & Performance

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| WCAG 2.1 AA audit | P1 | 4h | All components |
| Lighthouse performance audit | P1 | 2h | Build, analyze |
| Reduce bundle if >300KB | P2 | 4h | Code splitting |
| Add loading skeletons | P2 | 3h | UI components |
| Improve mobile touch targets | P2 | 2h | index.css |

### Phase 4: SquareSpace Unification

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Remove duplicate NWS fetch from SquareSpace | P1 | 2h | squarespace-embed.html |
| Add postMessage API to React app | P2 | 4h | App.jsx |
| Sync tribe lists | P2 | 2h | Both files |
| Document embed parameters | P2 | 1h | README |

---

## STEP 6: UI Refactor Plan

### Current State

The app uses a custom design system in `index.css` (2775 lines) with:
- CSS custom properties (colors, spacing, typography)
- "Night-ops cinematic control-surface" aesthetic
- Dark theme with transparency effects
- No Tailwind (despite CLAUDE.md spec)

### Proposed Component Hierarchy

```
src/components/
├── core/           # Atomic UI primitives
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Badge.jsx
│   ├── Icon.jsx
│   └── Spinner.jsx
├── composite/      # Composed UI elements
│   ├── AlertCard.jsx (move from UI/)
│   ├── GaugeCard.jsx (extract from RiverGauges)
│   ├── TribeCard.jsx (extract from TribalBoundaries)
│   └── LayerToggle.jsx (extract from Controls)
├── layout/         # (keep as-is)
├── map/            # (rename from Map/)
├── pages/          # (keep as-is)
└── features/       # Domain-specific containers
    ├── AlertsPanel.jsx
    ├── GaugesPanel.jsx
    └── TribesPanel.jsx
```

### CSS Refactor Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| Keep current CSS | Works now, no risk | Large file, hard to maintain | Short-term |
| Add Tailwind | Per spec, utility-first | Migration effort, bundle size | Medium-term |
| CSS Modules | Scoped styles | More files | Long-term |

**Recommendation:** Keep current CSS for now. Add Tailwind incrementally for new components.

---

## STEP 7: Process Logging Templates

### Development Log Entry

```markdown
## [DATE] - [FEATURE/BUG]

### Context
- Issue: [Brief description]
- Files: [Affected files]
- Related: [Issues, PRs, discussions]

### Changes Made
1. [Change 1]
2. [Change 2]

### Testing Done
- [ ] Local dev tested
- [ ] Production build tested
- [ ] Netlify deploy verified

### Blockers / Notes
- [Any blockers or notes for future]
```

### Bug Report Template

```markdown
## Bug: [Title]

### Severity
- [ ] Critical (app broken)
- [ ] High (feature broken)
- [ ] Medium (degraded experience)
- [ ] Low (cosmetic)

### Reproduction
1. [Step 1]
2. [Step 2]
3. [Expected vs Actual]

### Environment
- Browser:
- Device:
- URL:

### Console Errors
```
[paste errors]
```

### Screenshots
[attach if relevant]
```

### QA Checklist

```markdown
## Pre-Deploy QA Checklist

### Build
- [ ] `npm run build` succeeds
- [ ] No TypeScript/ESLint errors
- [ ] Bundle size < 300KB gzipped

### Core Functionality
- [ ] Map loads and renders
- [ ] NWS alerts fetch and display
- [ ] Tribal boundaries render
- [ ] River gauges render
- [ ] Radar layer toggles
- [ ] Region selector works

### Responsive
- [ ] Mobile (375px) - sidebar compact
- [ ] Tablet (768px) - layout correct
- [ ] Desktop (1440px) - full layout
- [ ] Embedded iframe (500px height)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces alerts
- [ ] Color contrast passes
- [ ] Focus states visible

### Offline
- [ ] PWA installs
- [ ] Offline banner shows
- [ ] Cached content loads

### Performance
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 5s
- [ ] No memory leaks (10min test)
```

---

## Final Deliverables Summary

| Deliverable | Status | Location |
|-------------|--------|----------|
| Project Status Report | COMPLETE | This document, Steps 1-3 |
| Prioritized Backlog | COMPLETE | Step 5 (Phases 0-4) |
| QA Checklists | COMPLETE | Step 7 |
| Proposed Folder Structure | COMPLETE | Step 6 |
| Logging Templates | COMPLETE | Step 7 |
| Integration Roadmap | COMPLETE | Step 5 |
| Bug Hunt Plan | COMPLETE | Step 4 |
| Feature Matrix | COMPLETE | Step 2 |

---

## Appendix: Quick Reference

### NPM Commands
```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
vercel dev       # Start with serverless functions
```

### Key Constants (from constants.js)
```javascript
PNW_CENTER = [46.5, -122.5]
DEFAULT_ZOOM = 6
POLL_INTERVAL_MS = 60000
CACHE_TTL = { alerts: 300000, rivers: 300000, tribal: 86400000 }
```

### API Endpoints
```
NWS Alerts:     https://api.weather.gov/alerts/active
NWS Points:     https://api.weather.gov/points/{lat},{lon}
EC CAP Files:   https://dd.weather.gc.ca/alerts/cap/...
BC WFS:         https://openmaps.gov.bc.ca/geo/...
USGS Water:     https://waterservices.usgs.gov/nwis/iv/
NOAA NWPS:      https://api.water.noaa.gov/nwps/v1/
```

### Deploy
```bash
# Build
npm run build

# Netlify: Drag dist/ folder to netlify.com/drop
# or use Netlify CLI: netlify deploy --prod --dir=dist
```
