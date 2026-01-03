import { memo, useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  { text: 'Connecting to weather services...', icon: '📡' },
  { text: 'Loading Tribal boundaries...', icon: '🗺️' },
  { text: 'Fetching active alerts...', icon: '⚠️' },
  { text: 'Checking river conditions...', icon: '🌊' },
  { text: 'Syncing satellite imagery...', icon: '🛰️' },
  { text: 'Preparing your dashboard...', icon: '📊' }
];

function LoadingOverlay({
  isVisible,
  progress = 0,
  message,
  showProgress = true
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentMessage = message || LOADING_MESSAGES[messageIndex];
  const displayMessage = typeof currentMessage === 'string'
    ? { text: currentMessage, icon: '⏳' }
    : currentMessage;

  return (
    <div className="loading-overlay" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <div className="loading-content">
        <div className="loading-logo">
          <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle
              cx="24"
              cy="24"
              r="22"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="138"
              strokeDashoffset={138 - (138 * progress) / 100}
              strokeLinecap="round"
              className="loading-progress-ring"
            />
            <text x="24" y="28" textAnchor="middle" fill="currentColor" fontSize="20">
              {displayMessage.icon}
            </text>
          </svg>
        </div>

        <div className="loading-text">
          <h2 className="text-headline mb-1">Sovereign Skies</h2>
          <p className="text-body-sm text-muted loading-message">
            {displayMessage.text}
          </p>
        </div>

        {showProgress && (
          <div className="loading-bar">
            <div className="loading-bar-track">
              <div
                className="loading-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="loading-percent">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(LoadingOverlay);
