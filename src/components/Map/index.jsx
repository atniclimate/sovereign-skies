import { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { PNW_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, OSM_TILE_URL, OSM_ATTRIBUTION } from '../../utils/constants';
import Controls from './Controls';
import SatelliteLayer from './SatelliteLayer';
import TribalBoundaries from './TribalBoundaries';
import AlertList from '../UI/AlertList';
import useTribalData from '../../hooks/useTribalData';
import useAlerts from '../../hooks/useAlerts';
import { matchAlertsToTribes } from '../../services/alertMatcher';

export default function Map() {
  const [satelliteVisible, setSatelliteVisible] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const { data: tribalData, loading: tribalLoading, error: tribalError } = useTribalData();
  const { alerts, loading: alertsLoading, error: alertsError, lastUpdated, alertCount } = useAlerts();

  const handleToggleSatellite = useCallback(() => {
    setSatelliteVisible(prev => !prev);
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

  const loading = tribalLoading || alertsLoading;
  const error = tribalError || alertsError;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={PNW_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        tap={true}
        tapTolerance={15}
        touchZoom={true}
        bounceAtZoomLimits={true}
        inertia={true}
        inertiaDeceleration={2000}
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <SatelliteLayer visible={satelliteVisible} />
        <TribalBoundaries data={tribalData} alerts={tribalAlerts} />
        <Controls satelliteVisible={satelliteVisible} onToggleSatellite={handleToggleSatellite} />
      </MapContainer>

      {/* Status bar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {loading && (
          <div className="bg-white px-3 py-2 rounded shadow text-sm">Loading...</div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded shadow text-sm">Error: {error}</div>
        )}
        {!loading && (
          <button
            onClick={handleToggleAlertPanel}
            className="bg-white hover:bg-gray-50 px-3 py-2 rounded shadow text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <span className={alertCount > 0 ? 'text-severity-warning' : 'text-green-600'}>
              {alertCount > 0 ? alertCount + ' Active Alert' + (alertCount !== 1 ? 's' : '') : 'No Alerts'}
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {lastUpdated && !loading && (
          <div className="bg-white/90 px-2 py-1 rounded shadow text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
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
