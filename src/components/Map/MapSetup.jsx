import { useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import { REGIONS, DEFAULT_REGION } from '../../utils/constants';

export default function MapSetup({ region = DEFAULT_REGION }) {
  const map = useMap();
  const prevRegionRef = useRef(region);

  // Create custom panes (once)
  useEffect(() => {
    // Default pane z-index: tile=200, overlay=400, marker=600, popup=700

    // Coastline pane - above basemap, below everything else
    if (!map.getPane('coastlinePane')) {
      const coastlinePane = map.createPane('coastlinePane');
      coastlinePane.style.zIndex = '420';
      coastlinePane.style.pointerEvents = 'none';
    }

    // Watch areas pane - lighter NWS zones, below Tribal
    if (!map.getPane('watchPane')) {
      const watchPane = map.createPane('watchPane');
      watchPane.style.zIndex = '450';
      watchPane.style.pointerEvents = 'none';
    }

    // Tribal boundaries pane
    if (!map.getPane('tribalPane')) {
      const tribalPane = map.createPane('tribalPane');
      tribalPane.style.zIndex = '500';
    }

    // Alert zones pane - above Tribal, clickable
    if (!map.getPane('alertPane')) {
      const alertPane = map.createPane('alertPane');
      alertPane.style.zIndex = '550';
    }

    // River gauges pane - topmost
    if (!map.getPane('gaugePane')) {
      const gaugePane = map.createPane('gaugePane');
      gaugePane.style.zIndex = '600';
    }
  }, [map]);

  // Handle region changes only (initial bounds set by MapContainer)
  useEffect(() => {
    // Skip if region hasn't actually changed
    if (prevRegionRef.current === region) {
      prevRegionRef.current = region;
      return;
    }

    const regionConfig = REGIONS[region];
    if (!regionConfig) return;

    // Update min zoom for new region
    map.setMinZoom(regionConfig.minZoom);

    // Animate to new bounds
    map.fitBounds(regionConfig.bounds, {
      padding: [10, 10],
      maxZoom: regionConfig.defaultZoom,
      animate: true,
      duration: 0.8
    });

    prevRegionRef.current = region;
  }, [map, region]);

  return null;
}
