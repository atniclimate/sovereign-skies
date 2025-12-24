import { useState, useCallback } from 'react';
import { SEVERITY_COLORS } from '../../utils/constants';

const severityConfig = {
  EMERGENCY: {
    bg: 'bg-red-900',
    border: 'border-red-700',
    text: 'text-white',
    label: 'Emergency'
  },
  WARNING: {
    bg: 'bg-red-500',
    border: 'border-red-400',
    text: 'text-white',
    label: 'Warning'
  },
  WATCH: {
    bg: 'bg-yellow-400',
    border: 'border-yellow-500',
    text: 'text-gray-900',
    label: 'Watch'
  },
  ADVISORY: {
    bg: 'bg-blue-400',
    border: 'border-blue-500',
    text: 'text-white',
    label: 'Advisory'
  }
};

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function AlertCard({ alert, onSelect }) {
  const config = severityConfig[alert.severity] || severityConfig.ADVISORY;

  return (
    <button
      onClick={() => onSelect(alert)}
      className={`w-full text-left p-3 rounded-lg border-l-4 ${config.border} bg-white shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-severity-default`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
              {config.label}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 text-sm truncate">
            {alert.event}
          </h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {alert.areaDesc}
          </p>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-400">
        Expires: {formatTime(alert.expires)}
      </div>
    </button>
  );
}

function AlertDetail({ alert, onClose }) {
  const config = severityConfig[alert.severity] || severityConfig.ADVISORY;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-4 ${config.bg} ${config.text}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide opacity-80">
            {config.label}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded"
            aria-label="Close alert details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <h3 className="font-bold text-lg mt-1">{alert.event}</h3>
        <p className="text-sm opacity-90 mt-1">{alert.headline}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Area */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Affected Areas
          </h4>
          <p className="text-sm text-gray-700">{alert.areaDesc}</p>
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Effective
            </h4>
            <p className="text-sm text-gray-700">{formatTime(alert.effective)}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Expires
            </h4>
            <p className="text-sm text-gray-700">{formatTime(alert.expires)}</p>
          </div>
        </div>

        {/* Description */}
        {alert.description && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Description
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{alert.description}</p>
          </div>
        )}

        {/* Instructions */}
        {alert.instruction && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Instructions
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{alert.instruction}</p>
          </div>
        )}

        {/* Source */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-400">Source: {alert.senderName}</p>
        </div>
      </div>
    </div>
  );
}

export default function AlertList({ alerts, isOpen, onClose, onAlertSelect }) {
  const [selectedAlert, setSelectedAlert] = useState(null);

  const handleSelectAlert = useCallback((alert) => {
    setSelectedAlert(alert);
    onAlertSelect?.(alert);
  }, [onAlertSelect]);

  const handleBack = useCallback(() => {
    setSelectedAlert(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 left-0 z-[1001] w-full sm:w-96 bg-gray-50 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          {selectedAlert && (
            <button
              onClick={handleBack}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Back to list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="font-bold text-lg">
            {selectedAlert ? 'Alert Details' : `Active Alerts (${alerts.length})`}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Close alerts panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedAlert ? (
          <AlertDetail alert={selectedAlert} onClose={handleBack} />
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">No Active Alerts</p>
            <p className="text-sm mt-1">The Pacific Northwest is currently clear.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onSelect={handleSelectAlert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
