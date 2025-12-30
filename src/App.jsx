import { useState, useCallback } from 'react';
import { AppShell, BottomNav } from './components/layout';
import { LoadingOverlay } from './components/ui';
import Map from './components/Map';
import { Dashboard, AlertsPage, ForecastPage, MorePage } from './components/pages';
import SkipLink from './components/common/SkipLink';
import useAppState from './hooks/useAppState';
import useAlerts from './hooks/useAlerts';
import useRivers from './hooks/useRivers';
import useTribalData from './hooks/useTribalData';

function App() {
  const [activeTab, setActiveTab] = useState('map');

  const {
    isLoading,
    loadingProgress,
    loadingMessage
  } = useAppState();

  const {
    alerts,
    loading: alertsLoading,
    error: alertsError,
    lastUpdated,
    refresh: refreshAlerts,
    alertCount
  } = useAlerts(true);

  const { floodingGauges } = useRivers();
  const { data: tribalData } = useTribalData(true);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleViewAllAlerts = useCallback(() => {
    setActiveTab('alerts');
  }, []);

  // Render current page based on active tab
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            alerts={alerts}
            gauges={floodingGauges}
            tribalData={tribalData}
            loading={alertsLoading}
            onViewAllAlerts={handleViewAllAlerts}
          />
        );
      case 'map':
        return <Map />;
      case 'alerts':
        return (
          <AlertsPage
            alerts={alerts}
            loading={alertsLoading}
            lastUpdated={lastUpdated}
            onRefresh={refreshAlerts}
          />
        );
      case 'forecast':
        return <ForecastPage />;
      case 'more':
        return <MorePage onClearCache={refreshAlerts} />;
      default:
        return <Map />;
    }
  };

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
        hideStatusRail={activeTab === 'map'}
      >
        {renderPage()}
      </AppShell>

      {/* Bottom navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        alertBadge={alertCount}
      />
    </>
  );
}

export default App;
