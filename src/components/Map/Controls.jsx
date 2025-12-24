import { useMap } from 'react-leaflet';
import { useCallback } from 'react';

export default function Controls({ satelliteVisible, onToggleSatellite }) {
  const map = useMap();

  const handleZoomIn = useCallback(() => {
    map.zoomIn();
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map.zoomOut();
  }, [map]);

  const handleLocate = useCallback(() => {
    map.locate({ setView: true, maxZoom: 12 });
  }, [map]);

  const satelliteClass = satelliteVisible 
    ? 'bg-severity-default text-white' 
    : 'bg-white text-gray-700 hover:bg-gray-100';

  return (
    <div 
      className="absolute bottom-20 right-4 z-[1000] flex flex-col gap-2"
      role="group"
      aria-label="Map controls"
    >
      {/* Satellite Toggle */}
      <button
        onClick={onToggleSatellite}
        className={`w-12 h-12 rounded-lg shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-severity-default ${satelliteClass}`}
        aria-label={satelliteVisible ? 'Hide satellite imagery' : 'Show satellite imagery'}
        aria-pressed={satelliteVisible}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      </button>

      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-severity-default"
        aria-label="Zoom in"
      >
        +
      </button>

      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-severity-default"
        aria-label="Zoom out"
      >
        −
      </button>

      {/* Locate Me */}
      <button
        onClick={handleLocate}
        className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-severity-default"
        aria-label="Find my location"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
        </svg>
      </button>
    </div>
  );
}
