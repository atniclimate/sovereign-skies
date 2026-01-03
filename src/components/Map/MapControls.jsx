import { memo } from 'react';

// Layer toggle component
function LayerToggle({ label, checked, onChange, color }) {
  return (
    <label className="layer-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="layer-toggle-indicator" style={{ '--toggle-color': color }} />
      <span className="layer-toggle-label">{label}</span>
    </label>
  );
}

function MapControls({
  layers,
  onLayerChange,
  alertsByRegion,
  alertsByType,
  riverSummary,
  loading
}) {
  const warningCount = (alertsByType?.WARNING || 0) + (alertsByType?.EMERGENCY || 0);
  const watchCount = alertsByType?.WATCH || 0;
  const advisoryCount = alertsByType?.ADVISORY || 0;

  return (
    <div className="map-controls">
      {/* Status Summary */}
      <div className="module-panel mb-2">
        {loading ? (
          <div className="flex items-center gap-2 text-muted">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
            <span className="text-label">Loading...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-label font-medium">Active Conditions</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {warningCount > 0 && (
                <span className="chip chip-danger">
                  {warningCount} Warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
              {watchCount > 0 && (
                <span className="chip chip-warning">
                  {watchCount} Watch{watchCount !== 1 ? 'es' : ''}
                </span>
              )}
              {advisoryCount > 0 && (
                <span className="chip chip-info">
                  {advisoryCount} Advisory
                </span>
              )}
              {riverSummary?.flooding > 0 && (
                <span className="chip" style={{ background: 'var(--color-info)', color: 'white' }}>
                  {riverSummary.flooding} Flood
                </span>
              )}
              {warningCount === 0 && watchCount === 0 && advisoryCount === 0 && !riverSummary?.flooding && (
                <span className="chip chip-success">All Clear</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Layer Controls */}
      <div className="module-panel mb-2">
        <p className="text-label-sm text-muted mb-2">Layers</p>
        <div className="space-y-1">
          <LayerToggle
            label="Hazards"
            checked={layers.hazards}
            onChange={(v) => onLayerChange('hazards', v)}
            color="var(--color-warning)"
          />
          <LayerToggle
            label="Weather Alerts"
            checked={layers.alerts}
            onChange={(v) => onLayerChange('alerts', v)}
            color="var(--color-danger)"
          />
          <LayerToggle
            label="Tribal Lands"
            checked={layers.tribal}
            onChange={(v) => onLayerChange('tribal', v)}
            color="var(--color-accent)"
          />
          <LayerToggle
            label="Flood Gauges"
            checked={layers.rivers}
            onChange={(v) => onLayerChange('rivers', v)}
            color="#00D4FF"
          />
          <LayerToggle
            label="Radar"
            checked={layers.radar}
            onChange={(v) => onLayerChange('radar', v)}
            color="var(--color-success)"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="module-panel mb-2">
        <p className="text-label-sm text-muted mb-2">Alert Key</p>
        <div className="space-y-1.5 text-label-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-3 rounded-sm" style={{ background: 'var(--color-danger)', opacity: 0.8 }} />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-3 rounded-sm border border-dashed" style={{ background: 'var(--color-warning)', opacity: 0.5, borderColor: 'var(--color-warning)' }} />
            <span>Watch</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-3 rounded-sm border border-dashed" style={{ background: 'var(--color-action)', opacity: 0.5, borderColor: 'var(--color-action)' }} />
            <span>Advisory</span>
          </div>
        </div>
      </div>

      {/* Regional Hazards */}
      {alertsByRegion && Object.values(alertsByRegion).some(arr => arr.length > 0) && (
        <div className="module-panel mb-2">
          <p className="text-label-sm text-muted mb-2">By Region</p>
          <div className="space-y-1.5">
            {Object.entries(alertsByRegion).map(([region, hazards]) =>
              hazards.length > 0 ? (
                <div key={region} className="flex items-start gap-2">
                  <span className="text-label font-bold text-action w-6">{region}</span>
                  <div className="flex flex-wrap gap-1">
                    {hazards.map(h => (
                      <span key={h} className="chip chip-sm">{h}</span>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Flood Gauge Legend */}
      <div className="module-panel">
        <p className="text-label-sm text-muted mb-2">Flood Level</p>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: '#22C55E' }} title="Normal" />
          <span className="w-3 h-3 rounded-full" style={{ background: '#84CC16' }} title="Action" />
          <span className="w-3 h-3 rounded-full" style={{ background: '#FBBF24' }} title="Minor" />
          <span className="w-3 h-3 rounded-full" style={{ background: '#F97316' }} title="Moderate" />
          <span className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} title="Major" />
          <span className="text-label-sm text-muted ml-1">Low → High</span>
        </div>
      </div>
    </div>
  );
}

export default memo(MapControls);
