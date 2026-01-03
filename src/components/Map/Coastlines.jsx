import { GeoJSON } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { COASTLINE_URL, COASTLINE_STYLE } from '../../utils/constants';

export default function Coastlines() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(COASTLINE_URL)
      .then(res => res.json())
      .then(geojson => setData(geojson))
      .catch(err => console.warn('Failed to load coastlines:', err));
  }, []);

  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      style={() => ({
        ...COASTLINE_STYLE,
        interactive: false  // Don't capture clicks
      })}
      pane="coastlinePane"  // Custom pane for z-index control
    />
  );
}
