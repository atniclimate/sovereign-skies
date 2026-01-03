import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { MARINE_THRESHOLDS } from '../../utils/constants';

/**
 * Format wind speed for display (m/s to knots and mph)
 */
function formatWind(speedMs, direction) {
  if (speedMs == null) return 'N/A';
  const knots = (speedMs * 1.94384).toFixed(0);
  const mph = (speedMs * 2.23694).toFixed(0);
  const dirStr = direction != null ? `${direction}°` : '';
  return `${knots} kt (${mph} mph) ${dirStr}`;
}

/**
 * Format wave height for display (meters to feet)
 */
function formatWaveHeight(heightM) {
  if (heightM == null) return 'N/A';
  const feet = (heightM * 3.28084).toFixed(1);
  return `${heightM.toFixed(1)} m (${feet} ft)`;
}

/**
 * Format temperature for display (Celsius to Fahrenheit)
 */
function formatTemp(tempC) {
  if (tempC == null) return 'N/A';
  const tempF = (tempC * 9/5 + 32).toFixed(1);
  return `${tempC.toFixed(1)}°C (${tempF}°F)`;
}

/**
 * Format tide time for display
 */
function formatTideTime(timeStr) {
  if (!timeStr) return 'N/A';
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return timeStr;
  }
}

/**
 * Get marker color based on hazard status
 */
function getBuoyColor(buoy) {
  if (buoy.hazards?.includes('STORM_WIND')) return '#DC2626'; // Red - storm
  if (buoy.hazards?.includes('HIGH_SURF')) return '#F59E0B';  // Orange - high surf
  if (buoy.hazards?.includes('GALE_WIND')) return '#FBBF24';  // Yellow - gale
  return '#06B6D4'; // Cyan - normal
}

/**
 * Get marker color for tide station
 */
function getTideColor() {
  return '#8B5CF6'; // Purple for tide stations
}

/**
 * Buoy marker component
 */
function BuoyMarker({ buoy }) {
  const color = getBuoyColor(buoy);
  const hasHazard = buoy.hazards?.length > 0;

  return (
    <CircleMarker
      center={[buoy.lat, buoy.lon]}
      radius={hasHazard ? 8 : 6}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: hasHazard ? 2 : 1
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} className="buoy-tooltip">
        <div className="text-xs font-medium">{buoy.name}</div>
        {buoy.waveHeight != null && (
          <div className="text-xs">Waves: {formatWaveHeight(buoy.waveHeight)}</div>
        )}
        {buoy.windSpeed != null && (
          <div className="text-xs">Wind: {formatWind(buoy.windSpeed, buoy.windDirection)}</div>
        )}
      </Tooltip>

      <Popup className="buoy-popup" maxWidth={280}>
        <div className="p-1">
          <h3 className="font-bold text-sm mb-2">{buoy.name}</h3>
          <div className="text-xs text-gray-500 mb-2">Station {buoy.id}</div>

          {hasHazard && (
            <div className="mb-2 p-1 bg-amber-50 border border-amber-200 rounded text-xs">
              <span className="font-medium text-amber-700">
                {buoy.hazards.map(h => h.replace('_', ' ')).join(', ')}
              </span>
            </div>
          )}

          <table className="text-xs w-full">
            <tbody>
              {buoy.waveHeight != null && (
                <tr>
                  <td className="pr-2 text-gray-500">Wave Height</td>
                  <td className="font-medium">{formatWaveHeight(buoy.waveHeight)}</td>
                </tr>
              )}
              {buoy.wavePeriod != null && (
                <tr>
                  <td className="pr-2 text-gray-500">Wave Period</td>
                  <td className="font-medium">{buoy.wavePeriod} sec</td>
                </tr>
              )}
              {buoy.windSpeed != null && (
                <tr>
                  <td className="pr-2 text-gray-500">Wind</td>
                  <td className="font-medium">{formatWind(buoy.windSpeed, buoy.windDirection)}</td>
                </tr>
              )}
              {buoy.windGust != null && (
                <tr>
                  <td className="pr-2 text-gray-500">Gusts</td>
                  <td className="font-medium">{formatWind(buoy.windGust)}</td>
                </tr>
              )}
              {buoy.waterTemp != null && (
                <tr>
                  <td className="pr-2 text-gray-500">Water Temp</td>
                  <td className="font-medium">{formatTemp(buoy.waterTemp)}</td>
                </tr>
              )}
              {buoy.airTemp != null && (
                <tr>
                  <td className="pr-2 text-gray-500">Air Temp</td>
                  <td className="font-medium">{formatTemp(buoy.airTemp)}</td>
                </tr>
              )}
              {buoy.pressure != null && (
                <tr>
                  <td className="pr-2 text-gray-500">Pressure</td>
                  <td className="font-medium">{buoy.pressure} hPa</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-2 text-xs text-gray-400">
            Source: NOAA NDBC
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

/**
 * Tide station marker component
 */
function TideMarker({ tide }) {
  const color = getTideColor();

  return (
    <CircleMarker
      center={[tide.lat, tide.lon]}
      radius={5}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 1
      }}
    >
      <Tooltip direction="top" offset={[0, -6]} className="tide-tooltip">
        <div className="text-xs font-medium">{tide.name}</div>
        {tide.nextHigh && (
          <div className="text-xs">
            High: {formatTideTime(tide.nextHigh.time)} ({tide.nextHigh.height.toFixed(1)} ft)
          </div>
        )}
      </Tooltip>

      <Popup className="tide-popup" maxWidth={260}>
        <div className="p-1">
          <h3 className="font-bold text-sm mb-2">{tide.name}</h3>
          <div className="text-xs text-gray-500 mb-2">Station {tide.id}</div>

          <div className="text-xs mb-2">
            <div className="font-medium mb-1">Next Tides:</div>
            {tide.nextHigh && (
              <div className="flex justify-between">
                <span>High:</span>
                <span>{formatTideTime(tide.nextHigh.time)} - {tide.nextHigh.height.toFixed(1)} ft</span>
              </div>
            )}
            {tide.nextLow && (
              <div className="flex justify-between">
                <span>Low:</span>
                <span>{formatTideTime(tide.nextLow.time)} - {tide.nextLow.height.toFixed(1)} ft</span>
              </div>
            )}
          </div>

          {tide.predictions?.length > 4 && (
            <div className="text-xs">
              <div className="font-medium mb-1">48-Hour Forecast:</div>
              <div className="max-h-24 overflow-y-auto">
                {tide.predictions.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex justify-between text-gray-600">
                    <span>{p.type === 'high' ? 'H' : 'L'}</span>
                    <span>{formatTideTime(p.time)}</span>
                    <span>{p.height.toFixed(1)} ft</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-400">
            Source: NOAA CO-OPS
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

/**
 * Marine Layer component
 * Renders buoy observations and tide station markers on the map
 */
export default function MarineLayer({ buoys = [], tides = [], visible = true, showTides = true }) {
  if (!visible) return null;

  return (
    <>
      {/* Buoy markers */}
      {buoys.map(buoy => (
        <BuoyMarker key={buoy.id} buoy={buoy} />
      ))}

      {/* Tide station markers */}
      {showTides && tides.map(tide => (
        <TideMarker key={tide.id} tide={tide} />
      ))}
    </>
  );
}
