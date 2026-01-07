import { memo, useState } from 'react';
import { ModulePanel, DataProvenance } from '../ui';
import useForecast from '../../hooks/useForecast';

// Weather icon mapping based on NWS short forecast text
function getWeatherEmoji(shortForecast) {
  const lower = (shortForecast || '').toLowerCase();

  if (lower.includes('thunder') || lower.includes('storm')) return 'thunderstorm';
  if (lower.includes('snow') || lower.includes('flurr')) return 'snow';
  if (lower.includes('rain') || lower.includes('shower')) return 'rain';
  if (lower.includes('drizzle')) return 'drizzle';
  if (lower.includes('fog') || lower.includes('mist')) return 'fog';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
  if (lower.includes('partly')) return 'partly-cloudy';
  if (lower.includes('sun') || lower.includes('clear')) return 'sunny';
  if (lower.includes('wind')) return 'windy';

  return 'unknown';
}

// Weather icon SVG components
const WeatherIcons = {
  sunny: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-warning">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  'partly-cloudy': (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-muted">
      <circle cx="8" cy="8" r="4" fill="#FCD34D" />
      <path d="M17 18H8a4 4 0 01-.88-7.9 5.5 5.5 0 0110.37 3.4A3.5 3.5 0 0117 18z" fill="currentColor" />
    </svg>
  ),
  cloudy: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-muted">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  ),
  rain: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-action">
      <path d="M16 13v6M8 13v6M12 15v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 8h-1.26A6 6 0 107 16h11a4 4 0 000-8z" fill="currentColor" fillOpacity="0.5" />
    </svg>
  ),
  drizzle: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-action">
      <path d="M8 15v2M16 15v2M12 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 8h-1.26A6 6 0 107 14h11a4 4 0 000-6z" fill="currentColor" fillOpacity="0.5" />
    </svg>
  ),
  snow: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-info">
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <path d="M18 6h-1.26A6 6 0 107 12h11a4 4 0 000-6z" fill="currentColor" fillOpacity="0.5" />
    </svg>
  ),
  thunderstorm: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-warning">
      <path d="M13 11l-2 4h3l-2 4" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M18 6h-1.26A6 6 0 107 12h11a4 4 0 000-6z" fill="currentColor" fillOpacity="0.7" />
    </svg>
  ),
  fog: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-muted">
      <path d="M3 12h18M3 16h18M3 8h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  windy: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-muted">
      <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),
  unknown: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-muted">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
};

function ForecastCard({ location, forecast, onClick }) {
  if (!forecast) {
    return (
      <div className="forecast-card forecast-card--error">
        <div className="forecast-card-header">
          <h3 className="text-headline">{location.name}</h3>
        </div>
        <div className="forecast-card-content">
          <p className="text-muted">Forecast unavailable</p>
        </div>
      </div>
    );
  }

  const currentPeriod = forecast.periods?.[0];
  const nextPeriods = forecast.periods?.slice(1, 5) || [];
  const weatherType = getWeatherEmoji(currentPeriod?.shortForecast);

  return (
    <button
      className="forecast-card"
      onClick={() => onClick?.(location, forecast)}
    >
      <div className="forecast-card-header">
        <div>
          <h3 className="text-headline">{forecast.city || location.name}</h3>
          <p className="text-label-sm text-muted">{forecast.state}</p>
        </div>
        <div className="forecast-card-temp">
          <span className="text-display">{currentPeriod?.temperature}</span>
          <span className="text-label">{currentPeriod?.temperatureUnit}</span>
        </div>
      </div>

      <div className="forecast-card-current">
        <div className="forecast-card-icon">
          {WeatherIcons[weatherType]}
        </div>
        <div className="forecast-card-details">
          <p className="text-body font-medium">{currentPeriod?.shortForecast}</p>
          <p className="text-body-sm text-muted">
            Wind: {currentPeriod?.windSpeed} {currentPeriod?.windDirection}
          </p>
        </div>
      </div>

      {/* Next periods mini forecast */}
      <div className="forecast-card-upcoming">
        {nextPeriods.map((period, idx) => {
          const periodWeather = getWeatherEmoji(period.shortForecast);
          return (
            <div key={idx} className="forecast-mini">
              <span className="text-label-sm text-muted">{period.name.split(' ')[0]}</span>
              <div className="forecast-mini-icon">
                {WeatherIcons[periodWeather]}
              </div>
              <span className="text-label font-bold">{period.temperature}{period.temperatureUnit}</span>
            </div>
          );
        })}
      </div>
    </button>
  );
}

function ForecastDetail({ location, forecast, onClose }) {
  if (!forecast) return null;

  return (
    <div className="forecast-detail">
      <div className="forecast-detail-header">
        <div>
          <h2 className="text-title">{forecast.city || location.name}</h2>
          <p className="text-body text-muted">{forecast.state}</p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Close forecast details"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="forecast-detail-periods">
        {forecast.periods?.map((period, idx) => {
          const weatherType = getWeatherEmoji(period.shortForecast);
          return (
            <div key={idx} className={`forecast-period ${period.isDaytime ? 'forecast-period--day' : 'forecast-period--night'}`}>
              <div className="forecast-period-header">
                <span className="text-label font-bold">{period.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6">
                    {WeatherIcons[weatherType]}
                  </div>
                  <span className="text-headline">{period.temperature}{period.temperatureUnit}</span>
                </div>
              </div>
              <p className="text-body-sm">{period.detailedForecast}</p>
              <p className="text-label-sm text-muted mt-1">
                Wind: {period.windSpeed} {period.windDirection}
              </p>
            </div>
          );
        })}
      </div>

      {/* NWS Attribution */}
      <div className="forecast-detail-attribution">
        <p className="text-label-sm text-muted">
          Forecast data from the National Weather Service
        </p>
        {forecast.generatedAt && (
          <p className="text-label-sm text-muted">
            Generated: {new Date(forecast.generatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function ForecastPage() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedForecast, setSelectedForecast] = useState(null);

  const {
    forecastList,
    loading,
    error,
    lastUpdated,
    refresh,
    locations
  } = useForecast();

  const handleForecastClick = (location, forecast) => {
    setSelectedLocation(location);
    setSelectedForecast(forecast);
  };

  const handleCloseDetail = () => {
    setSelectedLocation(null);
    setSelectedForecast(null);
  };

  if (selectedLocation && selectedForecast) {
    return (
      <div className="forecast-page">
        <ForecastDetail
          location={selectedLocation}
          forecast={selectedForecast}
          onClose={handleCloseDetail}
        />
      </div>
    );
  }

  return (
    <div className="forecast-page">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-title mb-1">7-Day Forecast</h1>
        <p className="text-body text-muted">Pacific Northwest Regions</p>
      </div>

      {/* Data Provenance */}
      <div className="px-4 pb-4">
        <DataProvenance
          lastUpdated={lastUpdated}
          sources={['National Weather Service (weather.gov)']}
          isLoading={loading}
          error={error}
          onRefresh={refresh}
        />
      </div>

      {/* Loading State */}
      {loading && forecastList.length === 0 && (
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="forecast-card animate-pulse">
              <div className="h-32 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && forecastList.length === 0 && (
        <div className="p-4">
          <ModulePanel severity="danger">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <div>
                <p className="text-body font-medium">Unable to load forecasts</p>
                <p className="text-body-sm text-muted">{error}</p>
              </div>
            </div>
            <button
              className="btn btn-secondary mt-3"
              onClick={refresh}
            >
              Try Again
            </button>
          </ModulePanel>
        </div>
      )}

      {/* Forecast Cards */}
      {forecastList.length > 0 && (
        <div className="forecast-grid">
          {locations.map(location => {
            const locationData = forecastList.find(f => f.id === location.id);
            return (
              <ForecastCard
                key={location.id}
                location={location}
                forecast={locationData?.forecast}
                onClick={handleForecastClick}
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && forecastList.length === 0 && (
        <div className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-muted opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
          </svg>
          <p className="text-headline mb-1">No forecast data</p>
          <p className="text-body-sm text-muted">
            Unable to retrieve forecast information at this time.
          </p>
          <button
            className="btn btn-primary mt-4"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 text-center">
        <p className="text-label-sm text-muted">
          Forecasts are provided by the National Weather Service.
          <br />
          Always verify conditions before travel or outdoor activities.
        </p>
      </div>
    </div>
  );
}

export default memo(ForecastPage);
