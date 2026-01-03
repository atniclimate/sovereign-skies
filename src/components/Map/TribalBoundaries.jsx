import { GeoJSON, Popup, useMap } from 'react-leaflet';
import { useCallback, useState, useRef } from 'react';
import { SEVERITY_COLORS } from '../../utils/constants';
import { getAlertsForTribe } from '../../services/alertMatcher';

// Unified Tribal style - subtle neutral fill, no outline for clarity
const usStyle = {
  fillColor: '#d1cbcb',
  fillOpacity: 0.4,
  color: '#d1cbcb',
  weight: 0,
  opacity: 0
};

// Canadian First Nations style - same as US for visual consistency
const canadianStyle = {
  fillColor: '#d1cbcb',
  fillOpacity: 0.4,
  color: '#d1cbcb',
  weight: 0,
  opacity: 0
};

const hoverStyle = {
  fillOpacity: 0.55,
  weight: 0
};

function formatArea(aland) {
  if (!aland) return null;
  const sqMiles = aland / 2589988;
  return sqMiles.toFixed(1);
}

// Get a unique ID for the feature (works with both US and Canadian data)
function getFeatureId(props) {
  return props.GEOID || props.NAME1 || props.NAME || props.name || 'unknown';
}

// Get display name for the feature
function getFeatureName(props) {
  return props.NAME || props.NAME1 || props.name || 'Unknown';
}

// Get full name for the feature
function getFeatureFullName(props) {
  if (props.NAMELSAD) return props.NAMELSAD;
  if (props.TYPE) return `${getFeatureName(props)} ${props.TYPE}`;
  return getFeatureName(props);
}

export default function TribalBoundaries({ data, alerts = {}, alertsRaw = [] }) {
  const map = useMap();
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [tribeAlerts, setTribeAlerts] = useState([]);
  const geoJsonRef = useRef(null);

  const style = useCallback((feature) => {
    const props = feature.properties;
    const isCanadian = props.isCanadian === true;
    const baseStyle = isCanadian ? canadianStyle : usStyle;

    const featureId = getFeatureId(props);
    const alertLevel = alerts[featureId];

    if (alertLevel === 'WARNING' || alertLevel === 'EMERGENCY') {
      return { ...baseStyle, fillColor: SEVERITY_COLORS.WARNING, color: SEVERITY_COLORS.WARNING };
    }
    if (alertLevel === 'WATCH') {
      return { ...baseStyle, fillColor: SEVERITY_COLORS.WATCH, color: SEVERITY_COLORS.WATCH };
    }

    return baseStyle;
  }, [alerts]);

  const onEachFeature = useCallback((feature, layer) => {
    const props = feature.properties;
    const isCanadian = props.isCanadian === true;
    const featureId = getFeatureId(props);
    const alertLevel = alerts[featureId];
    const displayName = getFeatureName(props);

    // Add CSS class for pulsing animation based on alert level
    if (layer.getElement) {
      setTimeout(() => {
        const el = layer.getElement();
        if (el) {
          el.classList.remove('alert-warning', 'alert-emergency');
          if (alertLevel === 'WARNING') el.classList.add('alert-warning');
          if (alertLevel === 'EMERGENCY') el.classList.add('alert-emergency');
        }
      }, 0);
    }

    layer.on({
      mouseover: (e) => {
        e.target.setStyle(hoverStyle);
        e.target.bringToFront();
      },
      mouseout: (e) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      },
      click: (e) => {
        // Get center from click location or layer bounds
        const center = e.latlng || layer.getBounds().getCenter();

        // Find alerts affecting this tribe
        const matchingAlerts = getAlertsForTribe(alertsRaw, feature);
        setTribeAlerts(matchingAlerts);

        setSelectedTribe({
          name: displayName,
          fullName: getFeatureFullName(props),
          id: featureId,
          area: formatArea(props.ALAND),
          province: props.PROVINCE || props.STATE || null,
          isCanadian,
          lat: center.lat,
          lng: center.lng,
          alertStatus: alertLevel || 'NONE'
        });
        map.flyTo(center, Math.max(map.getZoom(), 8), { duration: 0.5 });
      }
    });

    // Tooltip with flag indicator for Canadian vs US
    const tooltipContent = isCanadian ? `🍁 ${displayName}` : displayName;
    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'top',
      className: 'tribal-tooltip'
    });
  }, [alerts, alertsRaw, map]);

  const handleClosePopup = useCallback(() => {
    setSelectedTribe(null);
    setTribeAlerts([]);
  }, []);

  if (!data) return null;

  return (
    <>
      <GeoJSON
        ref={geoJsonRef}
        data={data}
        style={style}
        onEachFeature={onEachFeature}
        pane="tribalPane"
      />
      {selectedTribe && (
        <Popup
          position={[selectedTribe.lat, selectedTribe.lng]}
          onClose={handleClosePopup}
          className="tribal-popup"
        >
          <div className="tribal-popup-content">
            <div className="tribal-popup-header">
              <div className="tribal-popup-flag">
                {selectedTribe.isCanadian ? '🍁' : '🏛️'}
              </div>
              <div>
                <h3 className="tribal-popup-title">{selectedTribe.name}</h3>
                <p className="tribal-popup-subtitle">{selectedTribe.fullName}</p>
              </div>
            </div>

            <StatusBadge status={selectedTribe.alertStatus} />

            {/* Active Alerts List */}
            {tribeAlerts.length > 0 && (
              <div className="tribal-popup-alerts">
                <h4 className="tribal-popup-alerts-title">Active Hazards</h4>
                {tribeAlerts.map((alert, idx) => (
                  <div key={alert.id || idx} className={`tribal-alert-item tribal-alert-item--${alert.severity?.toLowerCase() || 'advisory'}`}>
                    <div className="tribal-alert-item-header">
                      {alert.isCanadian && <span className="tribal-alert-flag">🍁</span>}
                      <span className="tribal-alert-event">{alert.event}</span>
                    </div>
                    {alert.headline && (
                      <p className="tribal-alert-headline">{alert.headline}</p>
                    )}
                    <p className="tribal-alert-expires">
                      Expires: {alert.expires ? new Date(alert.expires).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="tribal-popup-details">
              {selectedTribe.province && (
                <p className="tribal-popup-detail">
                  <span className="tribal-popup-label">{selectedTribe.isCanadian ? 'Province:' : 'State:'}</span>
                  <span>{selectedTribe.province}</span>
                </p>
              )}
              {selectedTribe.area && (
                <p className="tribal-popup-detail">
                  <span className="tribal-popup-label">Land Area:</span>
                  <span>{selectedTribe.area} sq mi</span>
                </p>
              )}
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

function StatusBadge({ status }) {
  if (status === 'NONE') {
    return (
      <div className="tribal-status tribal-status--clear">
        <svg className="tribal-status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>No Active Hazards</span>
      </div>
    );
  }

  const configs = {
    WARNING: { className: 'tribal-status--warning', label: 'Weather Warning' },
    WATCH: { className: 'tribal-status--watch', label: 'Weather Watch' },
    EMERGENCY: { className: 'tribal-status--emergency', label: 'Emergency Alert' }
  };
  const config = configs[status] || configs.WARNING;

  return (
    <div className={`tribal-status ${config.className}`}>
      <svg className="tribal-status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{config.label}</span>
    </div>
  );
}
