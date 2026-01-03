import { WMSTileLayer } from 'react-leaflet';
import { EC_ALERTS_WMS_URL } from '../../utils/constants';

// Environment Canada weather alerts WMS layer
// Supports two modes: 'watch' (lighter, background) and 'alert' (full opacity, foreground)
export default function CanadianAlerts({ visible, mode = 'alert' }) {
  if (!visible) return null;

  const isWatchMode = mode === 'watch';

  return (
    <WMSTileLayer
      url={EC_ALERTS_WMS_URL}
      layers="ALERTS"
      format="image/png"
      transparent={true}
      opacity={isWatchMode ? 0.35 : 0.7}
      zIndex={isWatchMode ? 451 : 560}
      attribution="Environment and Climate Change Canada"
    />
  );
}
