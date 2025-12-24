import { memo } from 'react';

const SEVERITY_MAP = {
  EMERGENCY: 'danger',
  WARNING: 'danger',
  WATCH: 'warning',
  ADVISORY: 'info',
  STATEMENT: 'default'
};

function formatTime(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function AlertCard({
  alert,
  onClick,
  compact = false,
  className = ''
}) {
  const {
    event,
    headline,
    severity,
    areaDesc,
    effective,
    expires,
    isCanadian
  } = alert;

  const severityType = SEVERITY_MAP[severity] || 'default';
  const isClickable = !!onClick;

  const content = (
    <>
      <div className={`alert-card-rail severity-rail-${severityType}`} aria-hidden="true" />

      <div className="alert-card-content">
        <div className="alert-card-header">
          <span className={`severity-badge severity-${severityType}`}>
            {severity}
          </span>
          {isCanadian && (
            <span className="text-sm" title="Environment Canada" aria-label="Canadian alert">
              🍁
            </span>
          )}
        </div>

        <h3 className="alert-card-title">{event}</h3>

        {!compact && headline && (
          <p className="alert-card-headline">{headline}</p>
        )}

        <p className="alert-card-area">{areaDesc}</p>

        <div className="alert-card-meta">
          <span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatTime(effective)}
          </span>
          <span className="text-muted">→</span>
          <span>{formatTime(expires)}</span>
        </div>
      </div>

      {isClickable && (
        <div className="alert-card-chevron" aria-hidden="true">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        className={`alert-card ${className}`}
        onClick={() => onClick(alert)}
        aria-label={`${severity} alert: ${event} in ${areaDesc}`}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={`alert-card ${className}`} aria-label={`${severity} alert: ${event}`}>
      {content}
    </article>
  );
}

export default memo(AlertCard);
