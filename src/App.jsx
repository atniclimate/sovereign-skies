import Map from './components/Map';
import SkipLink from './components/common/SkipLink';

function App() {
  return (
    <div className="h-screen w-screen">
      {/* Skip link for accessibility */}
      <SkipLink />

      {/* Live region for screen reader announcements */}
      <div
        id="announcements"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Full-screen map */}
      <main
        id="main-map"
        className="h-full w-full"
        role="application"
        aria-label="Pacific Northwest Tribal Weather Map"
        aria-describedby="map-instructions"
      >
        <span id="map-instructions" className="sr-only">
          Interactive map showing tribal boundaries and weather alerts.
          Use zoom controls or pinch to zoom. Click on tribal areas for details.
        </span>
        <Map />
      </main>
    </div>
  );
}

export default App;
