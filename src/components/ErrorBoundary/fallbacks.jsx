/**
 * Contextual Error Fallback Components
 *
 * Each fallback is designed for a specific UI context and provides:
 * 1. Clear indication of what failed
 * 2. Alternative ways to access the information
 * 3. Retry functionality where appropriate
 *
 * Critical for emergency alert systems where graceful degradation
 * ensures users can still access safety-critical information.
 */

/**
 * Fallback for map component failures.
 * Shows static message but indicates alerts are still accessible.
 */
export function MapErrorFallback({ error, retry }) {
  return (
    <div className="map-error-fallback flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
      <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h3 className="text-lg font-medium text-slate-700">Map Unavailable</h3>
      <p className="text-sm text-slate-500 mt-1 text-center max-w-xs">
        The interactive map failed to load. Alert data is still available in the list view.
      </p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-md text-sm font-medium text-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reload Map
        </button>
      )}
    </div>
  );
}

/**
 * Fallback for alert list/panel failures.
 * Critical - directs users to alternative information sources.
 */
export function AlertListErrorFallback({ error, retry }) {
  return (
    <div className="alert-error-fallback p-6 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-4">
        <svg className="w-8 h-8 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h3 className="text-lg font-semibold text-amber-800">
            Alert Display Error
          </h3>
          <p className="mt-1 text-amber-700">
            Unable to display weather alerts. For current alerts, please check:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-600">
            <li>
              <a
                href="https://alerts.weather.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-800"
              >
                NWS Alerts (weather.gov)
              </a>
            </li>
            <li>
              <a
                href="https://weather.gc.ca/warnings/index_e.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-800"
              >
                Environment Canada Warnings
              </a>
            </li>
          </ul>
          {retry && (
            <button
              onClick={retry}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-200 hover:bg-amber-300 rounded-md text-sm font-medium text-amber-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Loading Alerts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback for river/gauge data failures.
 */
export function RiverDataErrorFallback({ error, retry }) {
  return (
    <div className="river-error-fallback p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-3">
        <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
        <div className="flex-1">
          <h3 className="font-medium text-blue-800">River Data Unavailable</h3>
          <p className="text-sm text-blue-600">
            Unable to load gauge readings.{' '}
            <a
              href="https://waterdata.usgs.gov/nwis"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-800"
            >
              Check USGS directly
            </a>
          </p>
        </div>
        {retry && (
          <button onClick={retry} className="p-2 hover:bg-blue-100 rounded transition-colors">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Full application error fallback.
 * Last resort when app-level error boundary catches.
 */
export function AppErrorFallback({ error, retry }) {
  return (
    <div className="app-error-fallback min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800">Application Error</h1>
        <p className="mt-2 text-slate-600">
          SovereignSkies encountered an unexpected error. Your alert subscriptions and settings are safe.
        </p>
        <div className="mt-6 space-y-3">
          {retry && (
            <button
              onClick={retry}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Reload Application
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Hard Refresh
          </button>
        </div>
        <p className="mt-6 text-xs text-slate-400">
          Error: {error?.message || 'Unknown error'}
        </p>
      </div>
    </div>
  );
}
