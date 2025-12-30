import { memo } from 'react';

/**
 * DataProvenance - Display data freshness and source information
 *
 * Shows "Last Updated" timestamp with optional source attribution
 * and staleness warning when data is older than threshold.
 */

// Staleness thresholds in milliseconds
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const VERY_STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

function formatTimestamp(date) {
  if (!date) return 'Unknown';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getStaleStatus(date) {
  if (!date) return 'unknown';

  const diffMs = Date.now() - date.getTime();

  if (diffMs > VERY_STALE_THRESHOLD_MS) return 'very-stale';
  if (diffMs > STALE_THRESHOLD_MS) return 'stale';
  return 'fresh';
}

function DataProvenance({
  lastUpdated,
  sources = [],
  isLoading = false,
  error = null,
  onRefresh,
  compact = false,
  showSources = true,
  className = ''
}) {
  const staleStatus = getStaleStatus(lastUpdated);
  const formattedTime = formatTimestamp(lastUpdated);

  if (compact) {
    return (
      <div className={`data-provenance data-provenance--compact ${className}`}>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-muted">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-label-sm">Updating...</span>
            </span>
          ) : (
            <>
              <span className={`status-dot status-dot--${staleStatus === 'fresh' ? 'success' : staleStatus === 'stale' ? 'warning' : 'danger'}`} />
              <span className="text-label-sm text-muted">{formattedTime}</span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="text-muted hover:text-primary transition-colors p-1"
                  aria-label="Refresh data"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`data-provenance ${className}`}>
      {/* Last Updated Row */}
      <div className="data-provenance-row">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-label">Updating data...</span>
            </span>
          ) : (
            <>
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-label">
                Last updated: <span className="font-medium">{formattedTime}</span>
              </span>
              {staleStatus === 'stale' && (
                <span className="severity-badge severity-warning text-xs">Stale</span>
              )}
              {staleStatus === 'very-stale' && (
                <span className="severity-badge severity-danger text-xs">Outdated</span>
              )}
            </>
          )}
        </div>

        {onRefresh && !isLoading && (
          <button
            onClick={onRefresh}
            className="btn btn-ghost btn-sm"
            aria-label="Refresh data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="data-provenance-error">
          <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-label text-danger">{error}</span>
        </div>
      )}

      {/* Stale Warning */}
      {staleStatus === 'very-stale' && !error && (
        <div className="data-provenance-warning">
          <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-label text-warning">Data may be outdated. Please refresh.</span>
        </div>
      )}

      {/* Sources */}
      {showSources && sources.length > 0 && (
        <div className="data-provenance-sources">
          <span className="text-label-sm text-muted">Sources: </span>
          <span className="text-label-sm">
            {sources.join(' • ')}
          </span>
        </div>
      )}

      {/* Disclaimer */}
      <p className="data-provenance-disclaimer">
        Always verify with local authorities for emergency decisions.
      </p>
    </div>
  );
}

export default memo(DataProvenance);
