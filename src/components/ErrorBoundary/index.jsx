import { Component } from 'react';
import createLogger from '@utils/logger';

const logger = createLogger('ErrorBoundary');

/**
 * Generic Error Boundary wrapper.
 * Catches JavaScript errors in child component tree.
 *
 * For emergency alert systems, graceful degradation is critical—
 * a map rendering failure shouldn't prevent users from seeing active alerts.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const context = this.props.context || 'ErrorBoundary';

    logger.error('Component tree crashed', {
      context,
      error: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: errorInfo.componentStack?.slice(0, 500)
    });

    this.setState({ errorInfo });

    // Optional: Report to error tracking service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({
              error: this.state.error,
              retry: this.handleRetry
            })
          : this.props.fallback;
      }

      // Default fallback
      return (
        <DefaultErrorFallback
          error={this.state.error}
          context={this.props.context}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI.
 * Provides basic error display with retry option.
 */
function DefaultErrorFallback({ error, context, onRetry }) {
  return (
    <div className="error-fallback p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {context ? `${context} unavailable` : 'Something went wrong'}
          </h3>
          <p className="mt-1 text-sm text-red-600">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
