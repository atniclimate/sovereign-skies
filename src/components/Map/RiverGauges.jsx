import { Marker, Popup, Tooltip } from 'react-leaflet';
import { useMemo } from 'react';
import L from 'leaflet';

// Neon blue for gauge outline (water association)
const GAUGE_BLUE = '#00D4FF';
const GAUGE_BLUE_DARK = '#0099CC';

// Fill colors based on flood level (fills the gauge from bottom)
const FILL_COLORS = {
  major: '#EF4444',      // Red - critical
  moderate: '#F97316',   // Orange - warning
  minor: '#FBBF24',      // Yellow/amber - caution
  action: '#84CC16',     // Lime - elevated
  no_flooding: '#22C55E', // Green - normal
  default: '#22C55E'
};

// Fill height percentage based on flood level
const FILL_LEVELS = {
  major: 95,      // Nearly full
  moderate: 75,   // 3/4 full
  minor: 55,      // Just over half
  action: 35,     // 1/3 full
  no_flooding: 15, // Low
  default: 15
};

const FLOOD_LABELS = {
  major: 'Major Flooding',
  moderate: 'Moderate Flooding',
  minor: 'Minor Flooding',
  action: 'Action Stage',
  no_flooding: 'Normal',
  low_threshold: 'Low',
  not_defined: 'No Data',
  obs_not_current: 'Outdated'
};

// Create water gauge icon with fill level
function createGaugeIcon(category) {
  const fillColor = FILL_COLORS[category] || FILL_COLORS.default;
  const fillPercent = FILL_LEVELS[category] || FILL_LEVELS.default;
  const size = category === 'major' ? 22 : category === 'moderate' ? 20 : 18;

  // Calculate fill rectangle (from bottom up)
  // Gauge tube is from y=3 to y=21 (height 18), so fill starts from bottom
  const tubeTop = 3;
  const tubeHeight = 18;
  const fillHeight = (tubeHeight * fillPercent) / 100;
  const fillY = tubeTop + tubeHeight - fillHeight;

  // SVG water gauge with neon blue outline and colored fill
  // Using inline styles instead of defs to avoid ID conflicts
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 24" width="${size * 0.67}" height="${size}">
      <!-- Gauge tube background -->
      <rect x="3" y="3" width="10" height="18" rx="5" fill="#1a1a2e" stroke="${GAUGE_BLUE}" stroke-width="1.5"/>
      <!-- Water fill level (clipped by rounded rect shape) -->
      <rect x="3.5" y="${Math.max(fillY, 3.5)}" width="9" height="${Math.min(fillHeight, 17)}" rx="4" fill="${fillColor}" opacity="0.9"/>
      <!-- Gauge tick marks -->
      <line x1="1" y1="6" x2="3.5" y2="6" stroke="${GAUGE_BLUE}" stroke-width="1" opacity="0.8"/>
      <line x1="1" y1="12" x2="3.5" y2="12" stroke="${GAUGE_BLUE}" stroke-width="1.5" opacity="0.9"/>
      <line x1="1" y1="18" x2="3.5" y2="18" stroke="${GAUGE_BLUE}" stroke-width="1" opacity="0.8"/>
      <!-- Highlight/shine -->
      <rect x="5" y="4" width="1.5" height="16" rx="0.75" fill="white" opacity="0.2"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'flood-gauge-icon',
    iconSize: [size * 0.67, size],
    iconAnchor: [size * 0.33, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function formatTime(isoString) {
  if (!isoString || isoString === '0001-01-01T00:00:00Z') return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Individual gauge marker with its own popup
function GaugeMarker({ gauge, icon }) {
  const category = gauge.observed.floodCategory || 'default';

  return (
    <Marker
      position={[gauge.lat, gauge.lng]}
      icon={icon}
      pane="gaugePane"
    >
      <Tooltip direction="top" offset={[0, -20]}>
        <div className="text-xs">
          <strong>{gauge.name}</strong>
          <br />
          {FLOOD_LABELS[category] || category}
        </div>
      </Tooltip>
      <Popup>
        <div className="min-w-[220px]">
          <div className={`px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t ${
            category === 'major' ? 'bg-red-800 text-white' :
            category === 'moderate' ? 'bg-orange-600 text-white' :
            category === 'minor' ? 'bg-yellow-500 text-gray-900' :
            category === 'action' ? 'bg-lime-500 text-gray-900' :
            'bg-green-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <path d="M6 8h3M6 12h3M6 16h3" />
                <path d="M9 14c0-1 1.5-2 3-2s3 1 3 2v6H9v-6z" fill="currentColor" opacity="0.5" />
              </svg>
              <span className="font-bold text-sm">
                {FLOOD_LABELS[category] || 'Flood Gauge'}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 mb-1">{gauge.name}</h3>
          <p className="text-xs text-gray-500 mb-2">
            {gauge.state} | ID: {gauge.id}
          </p>

          <div className="space-y-2 text-sm">
            {gauge.observed.level && gauge.observed.level !== -999 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Water Level:</span>
                <span className="font-medium">
                  {gauge.observed.level.toFixed(2)} {gauge.observed.unit}
                </span>
              </div>
            )}

            {gauge.observed.flow && gauge.observed.flow !== -999 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Flow Rate:</span>
                <span className="font-medium">
                  {gauge.observed.flow.toFixed(1)} {gauge.observed.flowUnit}
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs text-gray-500">
              <span>Last Updated:</span>
              <span>{formatTime(gauge.observed.validTime)}</span>
            </div>
          </div>

          {gauge.forecast.floodCategory &&
           !['not_defined', 'fcst_not_current'].includes(gauge.forecast.floodCategory) && (
            <div className="mt-2 pt-2 border-t text-xs">
              <span className="text-gray-600">Forecast:</span>{' '}
              <span className="font-medium">
                {FLOOD_LABELS[gauge.forecast.floodCategory] || gauge.forecast.floodCategory}
              </span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default function RiverGauges({ gauges = [], showAll = false }) {
  // Filter to show only flooding/action gauges unless showAll
  const visibleGauges = showAll
    ? gauges
    : gauges.filter(g => ['major', 'moderate', 'minor', 'action'].includes(g.observed.floodCategory));

  // Memoize icons to avoid recreating them
  const icons = useMemo(() => {
    const iconMap = {};
    Object.keys(FILL_COLORS).forEach(cat => {
      iconMap[cat] = createGaugeIcon(cat);
    });
    return iconMap;
  }, []);

  if (visibleGauges.length === 0) {
    return null;
  }

  return (
    <>
      {visibleGauges.map((gauge) => {
        const category = gauge.observed.floodCategory || 'default';
        const icon = icons[category] || icons.default;
        return (
          <GaugeMarker key={gauge.id} gauge={gauge} icon={icon} />
        );
      })}
    </>
  );
}
