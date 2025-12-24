import { TileLayer } from 'react-leaflet';
import { GOES_TILE_URL, GOES_ATTRIBUTION } from '../../utils/constants';

export default function SatelliteLayer({ visible }) {
  if (!visible) return null;

  return (
    <TileLayer
      url={GOES_TILE_URL}
      attribution={GOES_ATTRIBUTION}
      opacity={0.6}
      zIndex={10}
    />
  );
}
