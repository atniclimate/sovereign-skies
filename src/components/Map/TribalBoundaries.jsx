import { GeoJSON, Popup, useMap } from 'react-leaflet';
import { useCallback, useState, useRef } from 'react';
import { SEVERITY_COLORS } from '../../utils/constants';

const defaultStyle = {
  fillColor: SEVERITY_COLORS.DEFAULT,
  fillOpacity: 0.3,
  color: SEVERITY_COLORS.DEFAULT,
  weight: 2,
  opacity: 0.8
};

const hoverStyle = {
  fillOpacity: 0.5,
  weight: 3
};

function formatArea(aland) {
  const sqMiles = aland / 2589988;
  return sqMiles.toFixed(1);
}

export default function TribalBoundaries({ data, alerts = {} }) {
  const map = useMap();
  const [selectedTribe, setSelectedTribe] = useState(null);
  const geoJsonRef = useRef(null);

  const style = useCallback((feature) => {
    const geoid = feature.properties.GEOID;
    const alertLevel = alerts[geoid];

    if (alertLevel === 'WARNING') {
      return { ...defaultStyle, fillColor: SEVERITY_COLORS.WARNING, color: SEVERITY_COLORS.WARNING };
    }
    if (alertLevel === 'WATCH') {
      return { ...defaultStyle, fillColor: SEVERITY_COLORS.WATCH, color: SEVERITY_COLORS.WATCH };
    }
    if (alertLevel === 'EMERGENCY') {
      return { ...defaultStyle, fillColor: SEVERITY_COLORS.EMERGENCY, color: SEVERITY_COLORS.EMERGENCY };
    }

    return defaultStyle;
  }, [alerts]);

  const onEachFeature = useCallback((feature, layer) => {
    const props = feature.properties;
    const alertLevel = alerts[props.GEOID];

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
        setSelectedTribe({
          name: props.NAME,
          fullName: props.NAMELSAD,
          geoid: props.GEOID,
          area: formatArea(props.ALAND),
          lat: parseFloat(props.INTPTLAT),
          lng: parseFloat(props.INTPTLON),
          alertStatus: alerts[props.GEOID] || 'NONE'
        });
        map.flyTo(e.latlng, Math.max(map.getZoom(), 8), { duration: 0.5 });
      }
    });

    layer.bindTooltip(props.NAME, {
      permanent: false,
      direction: 'top',
      className: 'tribal-tooltip'
    });
  }, [alerts, map]);

  const handleClosePopup = useCallback(() => {
    setSelectedTribe(null);
  }, []);

  if (!data) return null;

  return (
    <>
      <GeoJSON
        ref={geoJsonRef}
        data={data}
        style={style}
        onEachFeature={onEachFeature}
      />
      {selectedTribe && (
        <Popup
          position={[selectedTribe.lat, selectedTribe.lng]}
          onClose={handleClosePopup}
        >
          <div className="min-w-[200px]">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {selectedTribe.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {selectedTribe.fullName}
            </p>
            <div className="border-t pt-2 mt-2 space-y-1">
              <p className="text-sm">
                <span className="font-medium">Land Area:</span> {selectedTribe.area} sq mi
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                <StatusBadge status={selectedTribe.alertStatus} />
              </p>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

function StatusBadge({ status }) {
  const colors = {
    WARNING: 'text-red-600',
    WATCH: 'text-yellow-600',
    EMERGENCY: 'text-red-800',
    NONE: 'text-green-600'
  };
  const label = status === 'NONE' ? 'No Active Alerts' : status;
  return <span className={`font-semibold ${colors[status] || colors.NONE}`}>{label}</span>;
}
