/**
 * Error Boundary Components
 *
 * Provides React error boundaries for graceful degradation.
 * Critical for emergency alert systems where component failures
 * shouldn't prevent access to safety-critical information.
 */

export { ErrorBoundary, default } from './index.jsx';
export {
  MapErrorFallback,
  AlertListErrorFallback,
  RiverDataErrorFallback,
  AppErrorFallback
} from './fallbacks.jsx';
