import { memo, useState, useEffect } from 'react';
import TopStatusRail from './TopStatusRail';

function AppShell({
  children,
  lastUpdated = null,
  isLoading = false,
  error = null,
  onRefresh,
  hideStatusRail = false
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="app-shell">
      {!hideStatusRail && (
        <TopStatusRail
          isOnline={isOnline}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          error={error}
          onRefresh={onRefresh}
        />
      )}

      <main
        className="app-content"
        id="main-content"
        role="main"
        aria-label="Main content"
      >
        {children}
      </main>

      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner" role="alert">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <circle cx="12" cy="20" r="1" />
          </svg>
          <span>You're offline. Showing cached data.</span>
        </div>
      )}
    </div>
  );
}

export default memo(AppShell);
