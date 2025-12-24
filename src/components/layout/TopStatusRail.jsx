import { memo, useState, useEffect } from 'react';

function formatUpdateTime(date) {
  if (!date) return '--:--';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function TopStatusRail({
  isOnline = true,
  lastUpdated = null,
  isLoading = false,
  error = null,
  onRefresh
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="status-rail" role="banner">
      <div className="status-rail-left">
        <span className="text-label-sm text-muted">{dateString}</span>
        <span className="text-label font-medium">{timeString}</span>
      </div>

      <div className="status-rail-center">
        {error ? (
          <span className="chip chip-danger">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            Error
          </span>
        ) : !isOnline ? (
          <span className="chip chip-warning">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <circle cx="12" cy="20" r="1" />
            </svg>
            Offline
          </span>
        ) : isLoading ? (
          <span className="chip chip-info">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
            Syncing
          </span>
        ) : (
          <span className="chip chip-success">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Live
          </span>
        )}
      </div>

      <div className="status-rail-right">
        <span className="text-label-sm text-muted">Updated</span>
        <button
          className="text-label font-medium hover:text-action transition-colors"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label={`Last updated ${formatUpdateTime(lastUpdated)}. Click to refresh.`}
        >
          {formatUpdateTime(lastUpdated)}
        </button>
      </div>
    </header>
  );
}

export default memo(TopStatusRail);
