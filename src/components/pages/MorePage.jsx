import { memo, useState } from 'react';
import { ModulePanel } from '../ui';

function SettingsToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-5 h-5 rounded border-2 border-white/30 bg-transparent checked:bg-action checked:border-action"
      />
      <div className="flex-1">
        <p className="text-body font-medium">{label}</p>
        {description && <p className="text-body-sm text-muted mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function MorePage({ onClearCache }) {
  const [settings, setSettings] = useState({
    includeCanada: true,
    showAllGauges: false,
    autoRefresh: true,
    reducedMotion: false
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // In production, persist to localStorage
  };

  const handleClearCache = () => {
    if (confirm('Clear all cached data? This will refresh all weather information.')) {
      onClearCache?.();
    }
  };

  return (
    <div className="more-page">
      {/* Settings */}
      <ModulePanel title="Settings" className="mb-4">
        <div className="space-y-1">
          <SettingsToggle
            label="Include Canadian Data"
            description="Show alerts and First Nations from BC/Alberta"
            checked={settings.includeCanada}
            onChange={(v) => updateSetting('includeCanada', v)}
          />
          <SettingsToggle
            label="Show All River Gauges"
            description="Display gauges even when not in flood status"
            checked={settings.showAllGauges}
            onChange={(v) => updateSetting('showAllGauges', v)}
          />
          <SettingsToggle
            label="Auto-Refresh"
            description="Automatically update data every minute"
            checked={settings.autoRefresh}
            onChange={(v) => updateSetting('autoRefresh', v)}
          />
          <SettingsToggle
            label="Reduce Motion"
            description="Minimize animations for accessibility"
            checked={settings.reducedMotion}
            onChange={(v) => updateSetting('reducedMotion', v)}
          />
        </div>
      </ModulePanel>

      {/* Data Management */}
      <ModulePanel title="Data" className="mb-4">
        <div className="space-y-3">
          <button
            className="btn btn-secondary w-full"
            onClick={handleClearCache}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Clear Cached Data
          </button>
        </div>
      </ModulePanel>

      {/* About */}
      <ModulePanel title="About" className="mb-4">
        <div className="space-y-3">
          <div>
            <p className="text-headline">TribalWeather</p>
            <p className="text-body-sm text-muted">Version 1.0.0</p>
          </div>
          <p className="text-body-sm text-muted">
            A weather and emergency alert system designed for Tribal Emergency
            Response Managers in the Pacific Northwest.
          </p>
          <div className="pt-2 border-t border-white/10">
            <p className="text-label-sm text-muted mb-2">Data Sources</p>
            <ul className="text-body-sm text-muted space-y-1">
              <li>• National Weather Service (NWS)</li>
              <li>• Environment Canada</li>
              <li>• NOAA River Gauges</li>
              <li>• US Census TIGER/Line</li>
            </ul>
          </div>
        </div>
      </ModulePanel>

      {/* Resources */}
      <ModulePanel title="Emergency Resources" className="mb-4">
        <div className="space-y-2">
          <a
            href="https://www.weather.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <div className="flex-1">
              <p className="text-body font-medium">National Weather Service</p>
              <p className="text-body-sm text-muted">weather.gov</p>
            </div>
          </a>
          <a
            href="https://www.fema.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <div className="flex-1">
              <p className="text-body font-medium">FEMA</p>
              <p className="text-body-sm text-muted">fema.gov</p>
            </div>
          </a>
          <a
            href="https://www.ready.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <div className="flex-1">
              <p className="text-body font-medium">Ready.gov</p>
              <p className="text-body-sm text-muted">Emergency Preparedness</p>
            </div>
          </a>
        </div>
      </ModulePanel>

      <div className="p-4 text-center">
        <p className="text-label-sm text-muted">
          Built for Tribal Communities
        </p>
      </div>
    </div>
  );
}

export default memo(MorePage);
