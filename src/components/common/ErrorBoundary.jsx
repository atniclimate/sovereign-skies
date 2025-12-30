import { Component } from 'react';

/**
 * Error Boundary component that catches JavaScript errors anywhere in the
 * child component tree, logs those errors, and displays a fallback UI.
 *
 * Critical for emergency alert systems - prevents white screen on error.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('Sovereign Skies Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    // TODO: Send to error monitoring service (Sentry, etc.)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCache = () => {
    // Clear app cache and reload
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#0a0f14',
            color: '#e5e7eb',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center'
          }}
        >
          {/* Alert Icon */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#da3633"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ marginBottom: '24px' }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#ffffff'
          }}>
            Something went wrong
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            marginBottom: '24px',
            maxWidth: '400px'
          }}>
            The weather alert system encountered an error.
            Your data is safe. Please try refreshing the page.
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#4A90D9',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '120px',
                minHeight: '44px' // WCAG touch target
              }}
            >
              Refresh Page
            </button>

            <button
              onClick={this.handleClearCache}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '2px solid #374151',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '120px',
                minHeight: '44px' // WCAG touch target
              }}
            >
              Clear Cache
            </button>
          </div>

          {/* Error Details (collapsed by default) */}
          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginTop: '32px',
              padding: '16px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              textAlign: 'left'
            }}>
              <summary style={{
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: '14px'
              }}>
                Technical Details (Dev Mode)
              </summary>
              <pre style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#111827',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#f87171',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Emergency Fallback Link */}
          <p style={{
            marginTop: '32px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            For current alerts, visit{' '}
            <a
              href="https://www.weather.gov"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4A90D9', textDecoration: 'underline' }}
            >
              weather.gov
            </a>
            {' '}or{' '}
            <a
              href="https://weather.gc.ca"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4A90D9', textDecoration: 'underline' }}
            >
              weather.gc.ca
            </a>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
