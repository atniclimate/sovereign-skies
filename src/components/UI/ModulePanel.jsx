import { memo } from 'react';

function ModulePanel({
  children,
  title,
  subtitle,
  headerRight,
  footer,
  severity,
  className = '',
  noPadding = false,
  collapsed = false,
  onToggleCollapse
}) {
  const severityClass = severity ? `severity-${severity.toLowerCase()}` : '';

  return (
    <section
      className={`module-panel ${severityClass} ${className}`}
      aria-label={title}
    >
      {(title || headerRight) && (
        <header className="module-panel-header">
          <div className="flex-1">
            {title && (
              <h2 className="module-panel-title">
                {onToggleCollapse && (
                  <button
                    className="mr-2 p-1 hover:bg-white/10 rounded transition-colors"
                    onClick={onToggleCollapse}
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? 'Expand section' : 'Collapse section'}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
                {title}
              </h2>
            )}
            {subtitle && <p className="module-panel-subtitle">{subtitle}</p>}
          </div>
          {headerRight && (
            <div className="flex items-center gap-2">
              {headerRight}
            </div>
          )}
        </header>
      )}

      {!collapsed && (
        <div className={noPadding ? '' : 'module-panel-content'}>
          {children}
        </div>
      )}

      {!collapsed && footer && (
        <footer className="module-panel-footer">
          {footer}
        </footer>
      )}
    </section>
  );
}

export default memo(ModulePanel);
