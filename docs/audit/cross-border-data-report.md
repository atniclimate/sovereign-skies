# SovereignSkies Cross-Border Data Report
**Date:** 2026-01-03
**Auditor:** code-hoser
**Risk Level:** MODERATE

---

## Overview

Integrates US (NOAA/NWS) and Canadian (Environment Canada) data for Pacific Northwest emergency alerts.

---

## Critical Issues

### 1. Temperature Units Not Converted
- **Location:** `useAlerts.js` EC CAP parsing
- **Issue:** Celsius values displayed without Fahrenheit conversion
- **Fix:** Add `normalizeTemperatures()` function

### 2. Inconsistent Severity Mapping
- **Location:** `useAlerts.js` lines 52-96
- **Issue:** Different logic for US vs Canada alerts
- **Fix:** Unify `mapSeverity()` function, parse CAP severity fields

### 3. Timezone Handling
- **Location:** Alert timestamp parsing
- **Issue:** Mixed UTC/local time display
- **Fix:** Add `normalizeAlertTimestamp()`, display in Pacific time

---

## Positive Findings

- Marine data unit conversion ✓ (dual display)
- WGS84 coordinate consistency ✓
- Proper EC CAP polygon parsing ✓
- Error handling for cross-border requests ✓

---

## Bilingual Content

- **Status:** French content currently discarded
- **Recommendation:** Store `headlineFr`, `descriptionFr` for toggle display

---

## Priority Actions

| Action | Effort | Impact |
|--------|--------|--------|
| Temperature conversion | 2h | CRITICAL |
| Unified severity mapping | 4h | CRITICAL |
| Timezone normalization | 2h | CRITICAL |
| Centralized date formatting | 3h | HIGH |
| Bilingual support | 6h | HIGH |

**Total critical path: 8 hours**

*Report: D:\SovereignSkies\docs\audit\cross-border-data-report.md*
