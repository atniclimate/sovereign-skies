import { memo } from 'react';

const SEVERITY_ICONS = {
  danger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
};

function MetricTile({
  label,
  value,
  unit,
  trend,
  trendValue,
  severity,
  icon,
  onClick,
  className = ''
}) {
  const severityClass = severity ? `metric-tile-${severity}` : '';
  const isClickable = !!onClick;
  const Icon = icon || (severity && SEVERITY_ICONS[severity]);

  const content = (
    <>
      <div className="metric-tile-header">
        {Icon && (
          <span className="metric-tile-icon" aria-hidden="true">
            {Icon}
          </span>
        )}
        <span className="metric-tile-label">{label}</span>
      </div>
      <div className="metric-tile-value">
        <span className="metric-tile-number">{value}</span>
        {unit && <span className="metric-tile-unit">{unit}</span>}
      </div>
      {trend && (
        <div className={`metric-tile-trend ${trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : ''}`}>
          {trend === 'up' && (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          )}
          {trend === 'down' && (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
          {trendValue && <span>{trendValue}</span>}
        </div>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        className={`metric-tile ${severityClass} ${className}`}
        onClick={onClick}
        aria-label={`${label}: ${value}${unit || ''}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`metric-tile ${severityClass} ${className}`}>
      {content}
    </div>
  );
}

export default memo(MetricTile);
