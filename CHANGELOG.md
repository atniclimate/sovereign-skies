# Changelog

All notable changes to IndigenousACCESS / TribalWeather will be documented in this file.

## [Unreleased] - 2025-12-29

### Fixed

#### CORS Issues on Netlify Deployment
- **Added Netlify serverless functions** to proxy external APIs
  - `netlify/functions/alerts.js` - Proxies NWS Weather API
  - `netlify/functions/rivers.js` - Proxies NOAA NWPS river gauges
  - `netlify/functions/ec-alerts.js` - Proxies Environment Canada MSC Datamart
- **Added `netlify.toml`** configuration with:
  - Redirect rules mapping `/api/*` to `/.netlify/functions/*`
  - Security headers (X-Frame-Options, CSP, etc.)
  - Caching headers for static assets
  - SPA fallback routing

**Issue**: The deployed Netlify app was making direct API calls to external services
(dd.weather.gc.ca, api.water.noaa.gov) which were blocked by CORS policies. The
serverless functions now act as proxies, making server-to-server requests that
bypass browser CORS restrictions.

### Added

#### Navigation & Pages
- **Bottom navigation bar** with tabs: Dashboard, Map, Alerts, Forecast, More
- **ForecastPage** - New 7-day weather forecast for PNW locations
  - Pulls live data from NWS api.weather.gov
  - Shows current conditions, temperature, wind, and detailed forecasts
  - 5 default PNW locations (Seattle, Portland, Spokane, Bellingham, Olympia)
  - Responsive card grid layout
  - Click-through to detailed period-by-period view

#### Data Provenance & Transparency
- **DataProvenance component** - Shows data freshness across all views
  - "Last updated" timestamp with relative time display
  - Data source attribution (NWS, Environment Canada, NOAA)
  - Staleness indicators (fresh/stale/outdated badges)
  - Integrated into: Map sidebar, AlertsPage, ForecastPage
  - Auto-refresh button with loading state
  - Official disclaimer: "Always verify with local authorities"

#### Mobile UX Improvements
- **Collapsible map sidebar** on mobile devices (≤768px)
  - Toggle button with hamburger/close icons
  - Alert count badge when collapsed
  - Smooth slide animation
  - Full-width expansion on very small screens (≤480px)
  - Maintains 48px+ touch targets for accessibility

### Changed

- **Map component** now displays data provenance in sidebar footer
- **AlertsPage** includes data provenance section with refresh capability
- **BottomNav** replaced "News" tab with "Forecast" tab
- **App shell** now manages page routing via activeTab state

### Technical Details

#### Data Sources (All Live - No API Keys Required)
| Source | Endpoint | Refresh Rate |
|--------|----------|--------------|
| NWS Alerts | api.weather.gov/alerts/active | 60 seconds |
| NWS Forecast | api.weather.gov/points/{lat},{lon}/forecast | 15 minutes |
| Environment Canada | dd.weather.gc.ca/today/alerts/cap | 60 seconds |
| NOAA Rivers | api.water.noaa.gov/nwps/v1/gauges | 5 minutes |
| NEXRAD Radar | mesonet.agron.iastate.edu | 5 minutes |
| EC Radar (WMS) | geo.weather.gc.ca/geomet | 5 minutes |

#### New Files Added
- `src/components/ui/DataProvenance.jsx` - Reusable provenance display
- `src/components/pages/ForecastPage.jsx` - Weather forecast page
- `src/hooks/useForecast.js` - NWS forecast data hook
- `.env.example` - Environment variable template
- `CHANGELOG.md` - This file

#### Files Modified
- `src/App.jsx` - Added page routing and bottom nav integration
- `src/components/Map/index.jsx` - Added mobile sidebar toggle and data provenance
- `src/components/pages/AlertsPage.jsx` - Added data provenance section
- `src/components/layout/BottomNav.jsx` - Changed "News" to "Forecast"
- `src/components/ui/index.js` - Export DataProvenance
- `src/components/pages/index.js` - Export ForecastPage
- `src/index.css` - Added forecast and mobile sidebar styles

### Notes

- **Atmospheric River Tracking**: This feature uses NOAA NEXRAD radar from Iowa State Mesonet. The radar layer is LIVE and refreshes every 5 minutes. Toggle it via "Active Radar" in the map sidebar.
- **No evacuation orders feature exists** - The AlertsPage shows live NWS alerts (warnings, watches, advisories) from official sources.
- **Mobile-first design** maintained throughout with WCAG AA compliance for touch targets (≥44px).
