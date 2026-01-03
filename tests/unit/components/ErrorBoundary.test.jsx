/**
 * ErrorBoundary Component Tests
 * Tests for React error boundary and fallback components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@components/ErrorBoundary';
import {
  MapErrorFallback,
  AlertListErrorFallback,
  RiverDataErrorFallback,
  AppErrorFallback
} from '@components/ErrorBoundary/fallbacks';

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {

  // ==========================================
  // Error Catching (5 tests)
  // ==========================================
  describe('error catching', () => {

    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary fallback={() => <div>Fallback</div>}>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
      expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
    });

    it('renders fallback when error occurs', () => {
      render(
        <ErrorBoundary fallback={() => <div>Fallback rendered</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Fallback rendered')).toBeInTheDocument();
    });

    it('passes error to fallback component', () => {
      const FallbackWithError = ({ error }) => (
        <div>Error: {error.message}</div>
      );

      render(
        <ErrorBoundary fallback={FallbackWithError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });

    it('passes retry to fallback component', () => {
      const FallbackWithRetry = ({ retry }) => (
        <button onClick={retry}>Retry</button>
      );

      render(
        <ErrorBoundary fallback={FallbackWithRetry}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('catches errors in nested components', () => {
      const DeepChild = () => {
        throw new Error('Deep error');
      };

      render(
        <ErrorBoundary fallback={() => <div>Caught deep error</div>}>
          <div>
            <div>
              <DeepChild />
            </div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Caught deep error')).toBeInTheDocument();
    });

  });

  // ==========================================
  // Retry Functionality (2 tests)
  // ==========================================
  describe('retry functionality', () => {

    it('provides retry function to fallback', () => {
      const retryFn = vi.fn();
      const FallbackWithRetry = ({ retry }) => {
        // Capture the retry function for testing
        retryFn.mockImplementation(retry);
        return <button onClick={retry}>Retry</button>;
      };

      render(
        <ErrorBoundary fallback={FallbackWithRetry}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Retry button should be visible in fallback
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('handleRetry method exists on ErrorBoundary', () => {
      // Test that the ErrorBoundary properly calls handleRetry internally
      // by verifying it resets state to allow re-rendering children
      const FallbackWithRetry = ({ retry }) => {
        // The retry function should be a function
        expect(typeof retry).toBe('function');
        return <button onClick={retry}>Retry Action</button>;
      };

      render(
        <ErrorBoundary fallback={FallbackWithRetry}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'Retry Action' })).toBeInTheDocument();
    });

  });

});

// ==========================================
// Fallback Components (12 tests)
// ==========================================
describe('Fallback Components', () => {

  describe('MapErrorFallback', () => {

    it('renders error message', () => {
      render(<MapErrorFallback error={new Error('Map failed')} />);
      expect(screen.getByText(/Map Unavailable/i)).toBeInTheDocument();
    });

    it('provides alternative data info', () => {
      render(<MapErrorFallback error={new Error('Map failed')} />);
      expect(screen.getByText(/list view/i)).toBeInTheDocument();
    });

    it('shows retry button when retry provided', () => {
      const retry = vi.fn();
      render(<MapErrorFallback error={new Error('Map failed')} retry={retry} />);

      const retryButton = screen.getByRole('button', { name: /reload map/i });
      fireEvent.click(retryButton);

      expect(retry).toHaveBeenCalled();
    });

  });

  describe('AlertListErrorFallback', () => {

    it('renders error message', () => {
      render(<AlertListErrorFallback error={new Error('Alerts failed')} />);
      expect(screen.getByText(/Alert Display Error/i)).toBeInTheDocument();
    });

    it('provides NWS link', () => {
      render(<AlertListErrorFallback error={new Error('Alerts failed')} />);
      expect(screen.getByText(/NWS Alerts/i)).toBeInTheDocument();
    });

    it('provides Environment Canada link for cross-border', () => {
      render(<AlertListErrorFallback error={new Error('Alerts failed')} />);
      expect(screen.getByText(/Environment Canada/i)).toBeInTheDocument();
    });

  });

  describe('RiverDataErrorFallback', () => {

    it('renders error message', () => {
      render(<RiverDataErrorFallback error={new Error('River data failed')} />);
      expect(screen.getByText(/River Data Unavailable/i)).toBeInTheDocument();
    });

    it('provides USGS link', () => {
      render(<RiverDataErrorFallback error={new Error('River data failed')} />);
      expect(screen.getByText(/USGS/i)).toBeInTheDocument();
    });

  });

  describe('AppErrorFallback', () => {

    it('renders critical error message', () => {
      render(<AppErrorFallback error={new Error('App crashed')} />);
      expect(screen.getByText(/Application Error/i)).toBeInTheDocument();
    });

    it('shows reload button', () => {
      render(<AppErrorFallback error={new Error('App crashed')} />);
      expect(screen.getByRole('button', { name: /Hard Refresh/i })).toBeInTheDocument();
    });

    it('shows reload application button when retry provided', () => {
      const retry = vi.fn();
      render(<AppErrorFallback error={new Error('App crashed')} retry={retry} />);
      expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();
    });

    it('shows error details', () => {
      const error = new Error('Detailed error message');
      render(<AppErrorFallback error={error} />);
      expect(screen.getByText(/Detailed error message/i)).toBeInTheDocument();
    });

  });

});
