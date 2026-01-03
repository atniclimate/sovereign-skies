import { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MAX_ZOOM,
  MAX_BOUNDS,
  DARK_TILE_URL,
  DARK_ATTRIBUTION,
  DEFAULT_REGION,
  REGIONS
} from '../../utils/constants';
import MapSetup from './MapSetup';
import Controls from './Controls';
import RegionSelector from './RegionSelector';
import Coastlines from './Coastlines';
import TribalBoundaries from './TribalBoundaries';
import AlertZones from './AlertZones';
import RiverGauges from './RiverGauges';
import RadarLayer from './RadarLayer';
import MarineLayer from './MarineLayer';
import AlertList from '../UI/AlertList';
import useTribalData from '../../hooks/useTribalData';
import useAlerts from '../../hooks/useAlerts';
import useRivers from '../../hooks/useRivers';
import useMarineConditions from '../../hooks/useMarineConditions';
import { matchAlertsToTribes } from '../../services/alertMatcher';

export default function Map() {
  const [currentRegion, setCurrentRegion] = useState(DEFAULT_REGION);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [showActiveWarnings, setShowActiveWarnings] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [showTribal, setShowTribal] = useState(true);
  const [showRadar, setShowRadar] = useState(false);
  const [showMarine, setShowMarine] = useState(false);
  const [showWeatherRisk, setShowWeatherRisk] = useState(true);

  const regionConfig = REGIONS[currentRegion] || REGIONS[DEFAULT_REGION];
  const includeCanada = regionConfig.includeCanada !== false;

  const { data: tribalData, loading: tribalLoading, error: tribalError } = useTribalData(includeCanada);
  const { alerts, alertsWithGeometry, alertsByType, loading: alertsLoading, error: alertsError, alertCount } = useAlerts(includeCanada);
  const { floodingGauges, summary: riverSummary } = useRivers();
  const { buoys, tides, hazardousBuoys, summary: marineSummary } = useMarineConditions();

  const handleRegionChange = useCallback((regionId) => {
    setCurrentRegion(regionId);
  }, []);

  const handleToggleAlertPanel = useCallback(() => {
    setAlertPanelOpen(prev => !prev);
  }, []);

  const handleCloseAlertPanel = useCallback(() => {
    setAlertPanelOpen(false);
  }, []);

  const tribalAlerts = useMemo(() => {
    if (!tribalData || !alerts.length) return {};
    return matchAlertsToTribes(alerts, tribalData);
  }, [tribalData, alerts]);

  // Split alerts into Active Warnings (WARNING/EMERGENCY) and Weather Risk (WATCH/ADVISORY/STATEMENT)
  const { activeWarnings, weatherRiskAlerts } = useMemo(() => {
    const warnings = [];
    const risk = [];

    alertsWithGeometry.forEach(alert => {
      if (alert.severity === 'WARNING' || alert.severity === 'EMERGENCY') {
        warnings.push(alert);
      } else {
        risk.push(alert);
      }
    });

    return { activeWarnings: warnings, weatherRiskAlerts: risk };
  }, [alertsWithGeometry]);

  const loading = tribalLoading || alertsLoading;
  const error = tribalError || alertsError;

  // Count warnings by type
  const warningCount = (alertsByType.WARNING || 0) + (alertsByType.EMERGENCY || 0);
  const watchCount = alertsByType.WATCH || 0;
  const advisoryCount = alertsByType.ADVISORY || 0;

  // Extract hazard types by region for the legend
  const alertsByRegion = useMemo(() => {
    const regions = { BC: new Set(), AB: new Set(), WA: new Set(), OR: new Set(), ID: new Set() };

    // Comprehensive hazard keyword mapping for quick reference
    const hazardKeywords = {
      'Wind': ['Wind', 'Gale', 'Dust'],
      'Flood': ['Flood', 'Flash', 'High Water'],
      'Storm': ['Storm', 'Hurricane', 'Typhoon', 'Cyclone', 'Severe'],
      'Snow': ['Snow', 'Blizzard', 'Avalanche'],
      'Ice': ['Ice', 'Freeze', 'Freezing', 'Sleet', 'Frost', 'Black Ice'],
      'Winter': ['Winter', 'Cold', 'Chill', 'Hypothermia', 'Arctic'],
      'Rain': ['Rain', 'Precip', 'Shower'],
      'Fog': ['Fog', 'Visibility', 'Smoke', 'Haze'],
      'Fire': ['Fire', 'Red Flag', 'Wildfire', 'Burn'],
      'Heat': ['Heat', 'Excessive', 'Hot'],
      'Surf': ['Surf', 'Rip', 'Beach', 'Coastal', 'Marine', 'Tsunami', 'Wave'],
      'Thunder': ['Thunder', 'Lightning', 'Thunderstorm', 'T-Storm'],
      'Tornado': ['Tornado', 'Funnel', 'Waterspout'],
      'Air': ['Air Quality', 'Ozone', 'Pollution', 'Particulate']
    };

    alerts.forEach(alert => {
      let region = null;
      const area = (alert.areaDesc || '').toUpperCase();

      if (alert.isCanadian) {
        // Check for specific Canadian province
        if (alert.province === 'AB' || area.includes('ALBERTA') || area.includes(', AB')) {
          region = 'AB';
        } else {
          region = 'BC'; // Default Canadian to BC
        }
      } else if (area.includes('WA') || area.includes('WASHINGTON')) {
        region = 'WA';
      } else if (area.includes('OR') || area.includes('OREGON')) {
        region = 'OR';
      } else if (area.includes('ID') || area.includes('IDAHO')) {
        region = 'ID';
      }

      if (!region) return;

      const event = alert.event || '';
      for (const [keyword, patterns] of Object.entries(hazardKeywords)) {
        if (patterns.some(p => event.includes(p))) {
          regions[region].add(keyword);
          break;
        }
      }
    });

    return {
      BC: Array.from(regions.BC),
      AB: Array.from(regions.AB),
      WA: Array.from(regions.WA),
      OR: Array.from(regions.OR),
      ID: Array.from(regions.ID)
    };
  }, [alerts]);

  return (
    <div className="map-viewport">
      <MapContainer
        bounds={REGIONS[DEFAULT_REGION].bounds}
        boundsOptions={{ padding: [10, 10] }}
        minZoom={3}
        maxZoom={MAX_ZOOM}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={0.5}
        className="h-full w-full"
        zoomControl={false}
        tap={true}
        tapTolerance={15}
        touchZoom={true}
        bounceAtZoomLimits={true}
        inertia={true}
        inertiaDeceleration={2000}
      >
        <MapSetup region={currentRegion} />

        <TileLayer
          attribution={DARK_ATTRIBUTION}
          url={DARK_TILE_URL}
          subdomains="abcd"
        />

        <Coastlines />
        {/* Weather Risk layer - watches/advisories as background visual */}
        {showWeatherRisk && <AlertZones alerts={weatherRiskAlerts} mode="risk" />}
        {/* Tribal Lands layer */}
        {showTribal && <TribalBoundaries data={tribalData} alerts={tribalAlerts} alertsRaw={alertsWithGeometry} />}
        {/* Active Warnings layer - warnings/emergencies, clickable with Tribal info */}
        {showActiveWarnings && <AlertZones alerts={activeWarnings} mode="warning" tribalData={tribalData} />}
        {showRivers && <RiverGauges gauges={floodingGauges} />}
        <RadarLayer visible={showRadar} includeCanada={includeCanada} />
        <MarineLayer buoys={buoys} tides={tides} visible={showMarine} />

        <Controls currentRegion={currentRegion} />
      </MapContainer>

      {/* Region Selector - floating top right */}
      <RegionSelector
        currentRegion={currentRegion}
        onRegionChange={handleRegionChange}
      />

      {/* Sidebar - top left */}
      <div className="map-sidebar">
        {loading && (
          <div className="module-panel">
            <div className="module-panel-content flex items-center gap-3">
              <svg className="animate-spin w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-label">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="module-panel severity-danger">
            <div className="module-panel-content text-label">Error: {error}</div>
          </div>
        )}

        {/* Spacer to push controls to bottom */}
        <div className="sidebar-spacer" />

        {!loading && (
          <div className="module-panel">
            {/* Alert Summary Button */}
            <button
              onClick={handleToggleAlertPanel}
              className="sidebar-button"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-danger flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-label font-bold">{alertCount} Hazards</span>
              </div>
              <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Alert Type Breakdown */}
            <div className="sidebar-list">
              {warningCount > 0 && (
                <div className="sidebar-list-item">
                  <span className="status-dot status-dot--danger" />
                  <span>{warningCount} Warning{warningCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {watchCount > 0 && (
                <div className="sidebar-list-item">
                  <span className="status-dot status-dot--warning" />
                  <span>{watchCount} Watch{watchCount !== 1 ? 'es' : ''}</span>
                </div>
              )}
              {advisoryCount > 0 && (
                <div className="sidebar-list-item">
                  <span className="status-dot status-dot--action" />
                  <span>{advisoryCount} Advisor{advisoryCount !== 1 ? 'ies' : 'y'}</span>
                </div>
              )}
              {riverSummary.flooding > 0 && (
                <div className="sidebar-list-item">
                  <span className="status-dot status-dot--water" />
                  <span>{riverSummary.flooding} River{riverSummary.flooding !== 1 ? 's' : ''} flooding</span>
                </div>
              )}
              {marineSummary.highSurfCount > 0 && (
                <div className="sidebar-list-item">
                  <span className="status-dot" style={{ backgroundColor: '#F59E0B' }} />
                  <span>{marineSummary.highSurfCount} Buoy{marineSummary.highSurfCount !== 1 ? 's' : ''} high surf</span>
                </div>
              )}
              {marineSummary.galeWindCount > 0 && (
                <div className="sidebar-list-item">
                  <span className="status-dot" style={{ backgroundColor: '#DC2626' }} />
                  <span>{marineSummary.galeWindCount} Buoy{marineSummary.galeWindCount !== 1 ? 's' : ''} gale/storm</span>
                </div>
              )}
              {alertCount === 0 && riverSummary.flooding === 0 && hazardousBuoys.length === 0 && (
                <div className="sidebar-list-item text-success">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No hazards</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Layer Toggles */}
        <div className="module-panel">
          <div className="module-panel-header">
            <span className="text-label-sm text-muted">Layers</span>
          </div>
          <div className="module-panel-content">
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showWeatherRisk}
                onChange={(e) => setShowWeatherRisk(e.target.checked)}
              />
              <span className="layer-toggle-indicator" style={{ '--toggle-color': 'var(--color-warning)' }} />
              <span className="layer-toggle-label">Weather Risk</span>
            </label>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showActiveWarnings}
                onChange={(e) => setShowActiveWarnings(e.target.checked)}
              />
              <span className="layer-toggle-indicator" style={{ '--toggle-color': 'var(--color-danger)' }} />
              <span className="layer-toggle-label">Active Warnings</span>
            </label>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showTribal}
                onChange={(e) => setShowTribal(e.target.checked)}
              />
              <span className="layer-toggle-indicator" style={{ '--toggle-color': '#d1cbcb' }} />
              <span className="layer-toggle-label">Tribal Lands</span>
            </label>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showRivers}
                onChange={(e) => setShowRivers(e.target.checked)}
              />
              <span className="layer-toggle-indicator" style={{ '--toggle-color': '#00D4FF' }} />
              <span className="layer-toggle-label">Flood Gauges</span>
            </label>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showRadar}
                onChange={(e) => setShowRadar(e.target.checked)}
              />
              <span className="layer-toggle-indicator" style={{ '--toggle-color': 'var(--color-success)' }} />
              <span className="layer-toggle-label">Active Radar</span>
            </label>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showMarine}
                onChange={(e) => setShowMarine(e.target.checked)}
              />
              <span className="layer-toggle-indicator" style={{ '--toggle-color': '#06B6D4' }} />
              <span className="layer-toggle-label">Marine Buoys</span>
            </label>
          </div>
        </div>

        {/* Alert Legend - compact inline */}
        <div className="module-panel">
          <div className="module-panel-content" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="legend-row">
              <span className="legend-swatch legend-swatch--warning" />
              <span>Warning</span>
            </span>
            <span className="legend-row">
              <span className="legend-swatch legend-swatch--watch" />
              <span>Watch</span>
            </span>
            <span className="legend-row">
              <span className="legend-swatch legend-swatch--advisory" />
              <span>Advisory</span>
            </span>
          </div>

          {/* Regional Alert Types */}
          {(alertsByRegion.BC.length > 0 || alertsByRegion.AB.length > 0 || alertsByRegion.WA.length > 0 || alertsByRegion.OR.length > 0 || alertsByRegion.ID.length > 0) && (
            <>
              <div className="module-panel-divider">
                <span className="text-label-sm text-muted">Active Hazards</span>
              </div>
              <div className="module-panel-content">
                {alertsByRegion.BC.length > 0 && (
                  <div className="region-hazards">
                    <span className="region-label">BC</span>
                    <div className="region-chips">
                      {alertsByRegion.BC.map(h => (
                        <span key={h} className="chip chip-sm">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
                {alertsByRegion.AB.length > 0 && (
                  <div className="region-hazards">
                    <span className="region-label">AB</span>
                    <div className="region-chips">
                      {alertsByRegion.AB.map(h => (
                        <span key={h} className="chip chip-sm">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
                {alertsByRegion.WA.length > 0 && (
                  <div className="region-hazards">
                    <span className="region-label">WA</span>
                    <div className="region-chips">
                      {alertsByRegion.WA.map(h => (
                        <span key={h} className="chip chip-sm">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
                {alertsByRegion.OR.length > 0 && (
                  <div className="region-hazards">
                    <span className="region-label">OR</span>
                    <div className="region-chips">
                      {alertsByRegion.OR.map(h => (
                        <span key={h} className="chip chip-sm">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
                {alertsByRegion.ID.length > 0 && (
                  <div className="region-hazards">
                    <span className="region-label">ID</span>
                    <div className="region-chips">
                      {alertsByRegion.ID.map(h => (
                        <span key={h} className="chip chip-sm">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Flood Level Legend */}
          <div className="module-panel-divider">
            <span className="text-label-sm text-muted">Flood Level</span>
          </div>
          <div className="module-panel-content">
            <div className="flood-scale">
              <span className="flood-dot flood-dot--normal" title="Normal" />
              <span className="flood-dot flood-dot--action" title="Action" />
              <span className="flood-dot flood-dot--minor" title="Minor" />
              <span className="flood-dot flood-dot--moderate" title="Moderate" />
              <span className="flood-dot flood-dot--major" title="Major" />
              <span className="text-label-sm text-muted">Low → High</span>
            </div>
          </div>

          {/* Marine Conditions Legend */}
          <div className="module-panel-divider">
            <span className="text-label-sm text-muted">Marine Buoys</span>
          </div>
          <div className="module-panel-content">
            <div className="legend-row">
              <span className="legend-swatch" style={{ backgroundColor: '#06B6D4' }} />
              <span>Normal</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ backgroundColor: '#FBBF24' }} />
              <span>Gale (34-47 kt)</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ backgroundColor: '#F59E0B' }} />
              <span>High Surf (10+ ft)</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ backgroundColor: '#DC2626' }} />
              <span>Storm (48+ kt)</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ backgroundColor: '#8B5CF6' }} />
              <span>Tide Station</span>
            </div>
          </div>
        </div>

      </div>

      {/* Alert List Sidebar */}
      <AlertList
        alerts={alerts}
        isOpen={alertPanelOpen}
        onClose={handleCloseAlertPanel}
      />
    </div>
  );
}
