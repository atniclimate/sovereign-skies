import { useMap } from 'react-leaflet';
import { useCallback } from 'react';

export default function Controls() {
  const map = useMap();

  const handleZoomIn = useCallback(() => {
    map.zoomIn();
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map.zoomOut();
  }, [map]);

  const handleLocate = useCallback(() => {
    map.locate({ setView: true, maxZoom: 10 });
  }, [map]);

  const buttonBase = 'w-11 h-11 sm:w-12 sm:h-12 rounded-lg shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors';
  const buttonDark = `${buttonBase} bg-gray-900/90 text-gray-200 hover:bg-gray-800 active:bg-gray-700`;

  return (
    <div
      className="absolute bottom-16 sm:bottom-20 right-2 sm:right-4 z-[1000] flex flex-col gap-2"
      role="group"
      aria-label="Map controls"
    >
      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        className={buttonDark}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <span className="text-xl sm:text-2xl font-bold">+</span>
      </button>

      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        className={buttonDark}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <span className="text-xl sm:text-2xl font-bold">−</span>
      </button>

      {/* Locate Me */}
      <button
        onClick={handleLocate}
        className={buttonDark}
        aria-label="Find my location"
        title="Find my location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5 sm:w-6 sm:h-6"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
        </svg>
      </button>
    </div>
  );
}
