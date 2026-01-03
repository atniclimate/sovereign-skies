import { TileLayer, WMSTileLayer } from 'react-leaflet';
import { useEffect, useState } from 'react';
import {
  RADAR_TILE_URL,
  RADAR_ATTRIBUTION,
  EC_RADAR_WMS_URL,
  EC_RADAR_LAYER
} from '../../utils/constants';

// Refresh radar every 5 minutes
const RADAR_REFRESH_MS = 300000;

/**
 * RadarLayer - NOAA NEXRAD radar composite
 *
 * Uses Iowa State Mesonet XYZ tiles (proven reliable, no CORS issues)
 * - NEXRAD base reflectivity composite
 * - Updates every ~5 minutes
 * - Web Mercator (EPSG:3857) projection
 */
export default function RadarLayer({ visible, includeCanada = false }) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh radar tiles
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, RADAR_REFRESH_MS);

    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {/* US NEXRAD Radar via Iowa State Mesonet (XYZ tiles - reliable) */}
      <TileLayer
        key={`nexrad-${refreshKey}`}
        url={RADAR_TILE_URL}
        opacity={0.7}
        zIndex={400}
        attribution={RADAR_ATTRIBUTION}
      />

      {/* Environment Canada radar for Canadian coverage */}
      {includeCanada && (
        <WMSTileLayer
          key={`ec-radar-${refreshKey}`}
          url={EC_RADAR_WMS_URL}
          layers={EC_RADAR_LAYER}
          format="image/png"
          transparent={true}
          opacity={0.7}
          zIndex={401}
          attribution="Environment Canada"
        />
      )}
    </>
  );
}
