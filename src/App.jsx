import { AppShell } from './components/layout';
import { LoadingOverlay } from './components/ui';
import Map from './components/Map';
import SkipLink from './components/common/SkipLink';
import useAppState from './hooks/useAppState';
import useAlerts from './hooks/useAlerts';

function App() {
  const {
    isLoading,
    loadingProgress,
    loadingMessage
  } = useAppState();

  const {
    loading: alertsLoading,
    error: alertsError,
    lastUpdated,
    refresh: refreshAlerts
  } = useAlerts(true);

  return (
    <>
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

      {/* Loading overlay */}
      <LoadingOverlay
        isVisible={isLoading}
        progress={loadingProgress}
        message={loadingMessage}
      />

      {/* Main app shell */}
      <AppShell
        lastUpdated={lastUpdated}
        isLoading={alertsLoading}
        error={alertsError}
        onRefresh={refreshAlerts}
        hideStatusRail={true}
      >
        <Map />
      </AppShell>
    </>
  );
}

export default App;
