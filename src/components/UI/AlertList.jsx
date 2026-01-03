import { useState, useCallback } from 'react';

const severityConfig = {
  EMERGENCY: {
    bgClass: 'alert-badge--danger',
    borderClass: 'alert-list-card--danger',
    label: 'Emergency'
  },
  WARNING: {
    bgClass: 'alert-badge--danger',
    borderClass: 'alert-list-card--danger',
    label: 'Warning'
  },
  WATCH: {
    bgClass: 'alert-badge--warning',
    borderClass: 'alert-list-card--warning',
    textDark: true,
    label: 'Watch'
  },
  ADVISORY: {
    bgClass: 'alert-badge--action',
    borderClass: 'alert-list-card--action',
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
      className={`alert-list-card ${config.borderClass}`}
    >
      <div className="alert-list-card-body">
        <div className="alert-list-card-content">
          <span className={`alert-badge ${config.bgClass}`}>
            {config.label}
          </span>
          <h4 className="alert-list-card-title">
            {alert.event}
          </h4>
          <p className="alert-list-card-area">
            {alert.areaDesc}
          </p>
        </div>
        <svg className="alert-list-card-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div className="alert-list-card-meta">
        Expires: {formatTime(alert.expires)}
      </div>
    </button>
  );
}

function AlertDetail({ alert, onClose }) {
  const config = severityConfig[alert.severity] || severityConfig.ADVISORY;

  return (
    <div className="alert-detail">
      {/* Header */}
      <div className={`alert-detail-header ${config.bgClass}`}>
        <div className="alert-detail-header-top">
          <span className="alert-detail-label">
            {config.label}
          </span>
          <button
            onClick={onClose}
            className="alert-detail-close"
            aria-label="Close alert details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <h3 className="alert-detail-title">{alert.event}</h3>
        <p className="alert-detail-headline">{alert.headline}</p>
      </div>

      {/* Content */}
      <div className="alert-detail-content">
        {/* Area */}
        <div className="alert-detail-section">
          <h4 className="alert-detail-section-label">Affected Areas</h4>
          <p className="alert-detail-section-text">{alert.areaDesc}</p>
        </div>

        {/* Timing */}
        <div className="alert-detail-timing">
          <div className="alert-detail-section">
            <h4 className="alert-detail-section-label">Effective</h4>
            <p className="alert-detail-section-text">{formatTime(alert.effective)}</p>
          </div>
          <div className="alert-detail-section">
            <h4 className="alert-detail-section-label">Expires</h4>
            <p className="alert-detail-section-text">{formatTime(alert.expires)}</p>
          </div>
        </div>

        {/* Description */}
        {alert.description && (
          <div className="alert-detail-section">
            <h4 className="alert-detail-section-label">Description</h4>
            <p className="alert-detail-section-body">{alert.description}</p>
          </div>
        )}

        {/* Instructions */}
        {alert.instruction && (
          <div className="alert-detail-section">
            <h4 className="alert-detail-section-label">Instructions</h4>
            <p className="alert-detail-section-body">{alert.instruction}</p>
          </div>
        )}

        {/* Source */}
        <div className="alert-detail-source">
          Source: {alert.senderName}
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
    <div className="alert-list-panel">
      {/* Header */}
      <div className="alert-list-header">
        <div className="alert-list-header-left">
          {selectedAlert && (
            <button
              onClick={handleBack}
              className="alert-list-back"
              aria-label="Back to list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="alert-list-title">
            {selectedAlert ? 'Alert Details' : `Active Alerts (${alerts.length})`}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="alert-list-close"
          aria-label="Close alerts panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="alert-list-content">
        {selectedAlert ? (
          <AlertDetail alert={selectedAlert} onClose={handleBack} />
        ) : alerts.length === 0 ? (
          <div className="alert-list-empty">
            <svg className="alert-list-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="alert-list-empty-title">No Active Alerts</p>
            <p className="alert-list-empty-subtitle">The Pacific Northwest is currently clear.</p>
          </div>
        ) : (
          <div className="alert-list-cards">
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
