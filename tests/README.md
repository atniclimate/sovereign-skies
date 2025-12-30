# E2E Test Plan - IndigenousACCESS / TribalWeather

## Overview

This document outlines the end-to-end testing strategy for the TribalWeather application.

## Test Environment Setup

### Prerequisites

1. Node.js 18+
2. npm or yarn
3. Google Chrome (for local testing)
4. TestSprite API key (optional, for automated E2E)

### Running the Dev Server

```bash
cd tribal-weather-alert
npm install
npm run dev
# App runs at http://localhost:5173
```

### TestSprite Integration (Optional)

```bash
# Set your TestSprite API key
export TESTSPRITE_API_KEY="your_key_here"

# Add TestSprite MCP to Claude Code
claude mcp add TestSprite --env API_KEY=$TESTSPRITE_API_KEY -- npx @testsprite/testsprite-mcp@latest
```

---

## Test Suites

### Suite 1: Core Navigation

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| NAV-01 | Bottom nav renders | Load app | 5 nav tabs visible: Dashboard, Map, Alerts, Forecast, More |
| NAV-02 | Tab switching works | Click each tab | Corresponding page content loads |
| NAV-03 | Active tab indicator | Switch tabs | Active tab is visually highlighted |
| NAV-04 | Alert badge shows count | Load with active alerts | Alerts tab shows badge with count |

### Suite 2: Map Page

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| MAP-01 | Map loads | Navigate to Map tab | Leaflet map renders with tiles |
| MAP-02 | Region selector works | Click different regions | Map bounds change accordingly |
| MAP-03 | Layer toggles function | Toggle each layer checkbox | Corresponding layer shows/hides |
| MAP-04 | Alert panel opens | Click "X Hazards" button | Alert list sidebar opens |
| MAP-05 | Mobile sidebar toggle | Resize to ≤768px | Toggle button appears |
| MAP-06 | Sidebar collapses | Click toggle on mobile | Sidebar slides out |
| MAP-07 | Data provenance shows | Check sidebar footer | Last updated time and sources visible |

### Suite 3: Alerts Page

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| ALT-01 | Alerts load | Navigate to Alerts tab | Alert cards render |
| ALT-02 | Search filters | Type in search box | Alerts filter by query |
| ALT-03 | Severity filters | Click severity chips | Alerts filter by severity |
| ALT-04 | Region filters | Click region chips | Alerts filter by region |
| ALT-05 | Clear filters | Click "Clear filters" | All filters reset |
| ALT-06 | Data provenance shows | Check below filters | Last updated, sources, disclaimer visible |
| ALT-07 | Refresh works | Click refresh button | Loading state shows, data reloads |

### Suite 4: Forecast Page

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| FOR-01 | Forecast loads | Navigate to Forecast tab | Location cards render |
| FOR-02 | Cards show data | Check forecast cards | Temperature, conditions, wind visible |
| FOR-03 | Detail view opens | Click a forecast card | Detailed periods view appears |
| FOR-04 | Detail view closes | Click close button | Returns to card grid |
| FOR-05 | Data provenance shows | Check above cards | Last updated and NWS source visible |
| FOR-06 | Error handling | Simulate API failure | Error message with retry button |

### Suite 5: Dashboard Page

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| DSH-01 | Metrics load | Navigate to Dashboard | Metric tiles show counts |
| DSH-02 | Regional summary | Check "By Region" section | WA/OR/ID/BC counts visible |
| DSH-03 | Priority alerts | Check alerts section | Top 3 alerts shown |
| DSH-04 | View All link | Click "View All" | Navigates to Alerts tab |

### Suite 6: Mobile Responsiveness

| Test ID | Viewport | Description | Expected Result |
|---------|----------|-------------|-----------------|
| MOB-01 | 390x844 (iPhone 14) | Bottom nav | All 5 tabs visible, touch-friendly |
| MOB-02 | 390x844 | Map sidebar | Toggle button works, sidebar slides |
| MOB-03 | 390x844 | Forecast cards | Stack vertically, full width |
| MOB-04 | 414x896 (iPhone 14 Plus) | All pages | No horizontal scroll |
| MOB-05 | 360x640 (Small Android) | Touch targets | All buttons ≥44px |

### Suite 7: Accessibility

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| A11Y-01 | Skip link | Tab from start | Skip to main content link appears |
| A11Y-02 | Keyboard nav | Tab through app | All interactive elements focusable |
| A11Y-03 | Focus visible | Keyboard navigate | Focus ring visible on all elements |
| A11Y-04 | ARIA labels | Check buttons | All icon buttons have aria-label |
| A11Y-05 | Color contrast | Run Lighthouse | All text passes WCAG AA (4.5:1) |

### Suite 8: Data Freshness

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| FRS-01 | Fresh data | Load page | "X minutes ago" or "Just now" shown |
| FRS-02 | Stale warning | Wait 10+ minutes | "Stale" badge appears |
| FRS-03 | Outdated warning | Wait 30+ minutes | "Outdated" badge and warning |
| FRS-04 | Sources shown | Check provenance | NWS, Environment Canada, NOAA listed |
| FRS-05 | Disclaimer shown | Check provenance | "Verify with local authorities" text |

---

## Console Error Checklist

The following should NOT appear in browser console:

- [ ] No uncaught exceptions
- [ ] No React warnings
- [ ] No 404s for app assets
- [ ] No CORS errors (APIs should work via proxy or CORS-enabled)
- [ ] No accessibility warnings

---

## Manual QA Checklist

Before release:

- [ ] All pages load without error
- [ ] Map tiles load correctly
- [ ] Alerts fetch and display
- [ ] Forecast data appears
- [ ] Mobile sidebar toggle works
- [ ] Bottom nav switches pages
- [ ] Data provenance shows on all data pages
- [ ] Refresh buttons work
- [ ] No console errors
- [ ] Touch targets are accessible on mobile

---

## Running Tests

### Manual Testing

1. Start dev server: `npm run dev`
2. Open Chrome DevTools
3. Use device emulation for mobile viewports
4. Follow test cases above

### Automated Testing with TestSprite

```bash
# Ensure TestSprite MCP is configured
# Then use Claude Code to run tests:
"Run E2E tests for TribalWeather using TestSprite"
```

---

## Test Artifacts

After testing, save:

- `tests/screenshots/` - Before/after screenshots
- `tests/reports/` - Test run summaries
- `tests/lighthouse/` - Lighthouse audit reports (if applicable)
