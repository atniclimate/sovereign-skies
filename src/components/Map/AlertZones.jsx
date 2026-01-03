import { GeoJSON, Popup } from 'react-leaflet';
import { useState, useCallback, useMemo } from 'react';

// Check if a point is inside a polygon (ray casting algorithm)
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Find Tribal/First Nation areas that overlap with an alert polygon
function findAffectedTribes(alertGeometry, tribalData) {
  if (!alertGeometry || !tribalData?.features) return [];

  const affected = [];
  const alertCoords = alertGeometry.type === 'Polygon'
    ? [alertGeometry.coordinates]
    : alertGeometry.coordinates;

  for (const tribe of tribalData.features) {
    if (!tribe.geometry) continue;

    const props = tribe.properties;
    const tribeName = props.NAMELSAD || props.NAME || props.name || 'Unknown';
    const isCanadian = props.isCanadian === true;

    // Get tribe center point
    let center = null;
    if (props.INTPTLAT && props.INTPTLON) {
      center = [parseFloat(props.INTPTLON), parseFloat(props.INTPTLAT)];
    } else {
      // Calculate centroid
      const coords = tribe.geometry.coordinates;
      let sumX = 0, sumY = 0, count = 0;
      const flatten = (arr) => {
        if (typeof arr[0] === 'number') {
          sumX += arr[0]; sumY += arr[1]; count++;
        } else {
          arr.forEach(flatten);
        }
      };
      flatten(coords);
      if (count > 0) center = [sumX / count, sumY / count];
    }

    if (!center) continue;

    // Check if tribe center is inside any alert polygon
    for (const polygon of alertCoords) {
      if (pointInPolygon(center, polygon[0])) {
        affected.push({
          name: tribeName,
          isCanadian,
          province: props.PROVINCE || props.STATE || null
        });
        break;
      }
    }
  }

  return affected;
}

// Severity color mapping for warning mode (clickable, above Tribal)
const SEVERITY_STYLES = {
  EMERGENCY: {
    fillColor: '#7C2D12',
    color: '#7C2D12',
    fillOpacity: 0.4,
    weight: 3,
    dashArray: null
  },
  WARNING: {
    fillColor: '#DC2626',
    color: '#DC2626',
    fillOpacity: 0.35,
    weight: 2,
    dashArray: null
  },
  WATCH: {
    fillColor: '#F59E0B',
    color: '#D97706',
    fillOpacity: 0.3,
    weight: 2,
    dashArray: '5, 5'
  },
  ADVISORY: {
    fillColor: '#3B82F6',
    color: '#2563EB',
    fillOpacity: 0.25,
    weight: 2,
    dashArray: '3, 3'
  },
  STATEMENT: {
    fillColor: '#6B7280',
    color: '#4B5563',
    fillOpacity: 0.2,
    weight: 1,
    dashArray: '2, 4'
  }
};

// Risk mode styling (background layer, under Tribal) - visible on dark basemap
const RISK_STYLES = {
  EMERGENCY: {
    fillColor: '#991B1B',
    color: '#DC2626',
    fillOpacity: 0.25,
    weight: 1.5,
    dashArray: null
  },
  WARNING: {
    fillColor: '#9A3412',
    color: '#EA580C',
    fillOpacity: 0.2,
    weight: 1.5,
    dashArray: null
  },
  WATCH: {
    fillColor: '#854D0E',
    color: '#CA8A04',
    fillOpacity: 0.2,
    weight: 1.5,
    dashArray: '4, 4'
  },
  ADVISORY: {
    fillColor: '#1E40AF',
    color: '#3B82F6',
    fillOpacity: 0.18,
    weight: 1.5,
    dashArray: '3, 3'
  },
  STATEMENT: {
    fillColor: '#374151',
    color: '#6B7280',
    fillOpacity: 0.15,
    weight: 1,
    dashArray: '2, 4'
  }
};

function formatTime(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function AlertZones({ alerts = [], mode = 'warning', tribalData = null }) {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [affectedTribes, setAffectedTribes] = useState([]);

  // "risk" mode = background layer (watches/advisories), non-interactive
  // "warning" mode = foreground layer (warnings/emergencies), interactive
  const isRiskMode = mode === 'risk';
  const styles = isRiskMode ? RISK_STYLES : SEVERITY_STYLES;

  // Convert alerts to GeoJSON FeatureCollection
  const geojsonData = useMemo(() => {
    const features = alerts
      .filter(alert => alert.geometry)
      .map(alert => ({
        type: 'Feature',
        geometry: alert.geometry,
        properties: { ...alert }
      }));

    return {
      type: 'FeatureCollection',
      features
    };
  }, [alerts]);

  const style = useCallback((feature) => {
    const severity = feature.properties.severity || 'STATEMENT';
    const baseStyle = styles[severity] || styles.STATEMENT;
    return {
      ...baseStyle,
      opacity: isRiskMode ? 0.6 : 0.9
    };
  }, [styles, isRiskMode]);

  const onEachFeature = useCallback((feature, layer) => {
    // Risk mode: no interactivity (background visual only)
    if (isRiskMode) return;

    const props = feature.properties;

    layer.on({
      click: () => {
        // Find affected Tribal/First Nation areas
        const tribes = findAffectedTribes(feature.geometry, tribalData);
        setAffectedTribes(tribes);

        setSelectedAlert({
          ...props,
          center: layer.getBounds().getCenter()
        });
      },
      mouseover: (e) => {
        e.target.setStyle({
          fillOpacity: (SEVERITY_STYLES[props.severity]?.fillOpacity || 0.2) + 0.15,
          weight: (SEVERITY_STYLES[props.severity]?.weight || 2) + 1
        });
        e.target.bringToFront();
      },
      mouseout: (e) => {
        e.target.setStyle(style(feature));
      }
    });

    // Add tooltip with event name
    layer.bindTooltip(props.event, {
      permanent: false,
      direction: 'top',
      className: 'alert-tooltip'
    });
  }, [style, isRiskMode, tribalData]);

  const handleClosePopup = useCallback(() => {
    setSelectedAlert(null);
    setAffectedTribes([]);
  }, []);

  if (geojsonData.features.length === 0) {
    return null;
  }

  // Risk mode renders on a lower pane (below Tribal), non-interactive
  // Warning mode renders on alertPane (above Tribal), interactive
  const pane = isRiskMode ? 'watchPane' : 'alertPane';

  return (
    <>
      <GeoJSON
        key={`${mode}-${JSON.stringify(alerts.map(a => a.id))}`}
        data={geojsonData}
        style={style}
        onEachFeature={onEachFeature}
        pane={pane}
        interactive={!isRiskMode}
      />
      {!isRiskMode && selectedAlert && (
        <Popup
          position={selectedAlert.center}
          onClose={handleClosePopup}
          className="warning-popup"
        >
          <div className="warning-popup-content">
            {/* Header */}
            <div className={`warning-popup-header warning-popup-header--${selectedAlert.severity?.toLowerCase() || 'warning'}`}>
              <div className="warning-popup-header-row">
                {selectedAlert.isCanadian ? (
                  <span className="warning-popup-flag" title="Environment Canada">🍁</span>
                ) : (
                  <svg className="warning-popup-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <span className="warning-popup-title">{selectedAlert.event}</span>
              </div>
            </div>

            {/* Area Description */}
            <p className="warning-popup-area">{selectedAlert.areaDesc}</p>

            {/* Affected Tribal/First Nation Areas */}
            {affectedTribes.length > 0 && (
              <div className="warning-popup-tribes">
                <h4 className="warning-popup-tribes-title">Affected Tribal Lands</h4>
                <ul className="warning-popup-tribes-list">
                  {affectedTribes.map((tribe, idx) => (
                    <li key={idx} className="warning-popup-tribe">
                      {tribe.isCanadian ? '🍁' : '🏛️'} {tribe.name}
                      {tribe.province && <span className="warning-popup-tribe-location"> ({tribe.province})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timing */}
            <div className="warning-popup-timing">
              <p><span className="warning-popup-label">Effective:</span> {formatTime(selectedAlert.effective)}</p>
              <p><span className="warning-popup-label">Expires:</span> {formatTime(selectedAlert.expires)}</p>
              <p><span className="warning-popup-label">Issued by:</span> {selectedAlert.senderName}</p>
            </div>

            {/* Headline */}
            {selectedAlert.headline && (
              <p className="warning-popup-headline">{selectedAlert.headline}</p>
            )}

            {/* Description */}
            {selectedAlert.description && (
              <p className="warning-popup-description">{selectedAlert.description}</p>
            )}

            {/* Instructions */}
            {selectedAlert.instruction && (
              <div className="warning-popup-instructions">
                <p className="warning-popup-instructions-title">Instructions:</p>
                <p>{selectedAlert.instruction}</p>
              </div>
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
