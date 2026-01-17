import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overviewLogic } from '../../scripts/overviewPage';
import '../../styles/pages/OverviewPage.css';

const OverviewPage = () => {
  const [state, setState] = useState(overviewLogic.initialState);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await overviewLogic.fetchAllData(state.currentLocation);
    setState(prev => ({ ...prev, ...data, loading: false }));
  };

  const handleLocationChange = (location) => {
    overviewLogic.handleLocationChange(location, setState);
  };

  const handleIconClick = (action) => {
    switch(action) {
      case 'micro-climate':
        navigate('/dashboard?page=radar');
        break;
      case 'weather-memory':
        navigate('/dashboard?page=history');
        break;
      case 'home-widget':
        alert('Home widget configuration will open in a new window');
        break;
      case 'moon-phase':
        alert('Moon phase details will be shown in a modal');
        break;
      default:
        console.log('Icon clicked:', action);
    }
  };

  const handleHourSelect = (hourData) => {
    overviewLogic.handleHourSelect(hourData, setState);
  };

  const handleRefresh = () => {
    overviewLogic.handleRefresh(state, setState);
  };

  const handleGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          alert(`Your location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          // In real app, you would reverse geocode to get city name
        },
        (err) => alert('Unable to get your location: ' + err.message)
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const { loading, error, weatherData, hourlyData, selectedHour, currentLocation, forecastData } = state;

  if (loading) {
    return (
      <div className="overview-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-page">
      {/* Location Selector */}
      <LocationSelector 
        currentLocation={currentLocation}
        onLocationChange={handleLocationChange}
        onGPSClick={handleGPSLocation}
      />

      {/* Weather Summary */}
      <WeatherSummary 
        weatherData={weatherData}
        onRefresh={handleRefresh}
      />

      {/* Hourly Forecast Section */}
      <HourlyForecastSection 
        hourlyData={hourlyData}
        selectedHour={selectedHour}
        city={currentLocation}
        onHourSelect={handleHourSelect}
        onRefresh={handleRefresh}
      />

      {/* 5-Day Forecast */}
      <FiveDayForecast forecastData={forecastData} />

      {/* Features Grid */}
      <FeaturesGrid 
        features={overviewLogic.getFeatures()}
        onIconClick={handleIconClick}
      />

      {/* Data Actions */}
      <DataActions onRefresh={handleRefresh} />

      {/* Error Banner */}
      {error && <ErrorBanner error={error} />}
    </div>
  );
};

// ============ SUB-COMPONENTS ============

const LocationSelector = ({ currentLocation, onLocationChange, onGPSClick }) => (
  <div className="location-selector">
    <select 
      value={currentLocation}
      onChange={(e) => onLocationChange(e.target.value)}
      className="location-select"
    >
      <option value="Nairobi">Nairobi, Kenya</option>
      <option value="Mombasa">Mombasa, Kenya</option>
      <option value="London">London, UK</option>
      <option value="New York">New York, USA</option>
      <option value="Tokyo">Tokyo, Japan</option>
    </select>
    <button className="gps-btn" onClick={onGPSClick}>
      📍 Use My Location
    </button>
  </div>
);

const WeatherSummary = ({ weatherData, onRefresh }) => {
  const metrics = overviewLogic.getWeatherMetrics(weatherData);

  return (
    <div className="weather-summary">
      <div className="current-weather-card">
        <div className="card-header">
          <h2>🌤️ Current Weather</h2>
          <button className="refresh-icon" onClick={onRefresh} title="Refresh data">
            🔄
          </button>
        </div>
        <div className="temp">{Math.round(weatherData?.temperature)}°C</div>
        <div className="condition">{weatherData?.condition}</div>
        <div className="location">
          {weatherData?.city}, {weatherData?.country}
        </div>
      </div>
      
      <div className="weather-metrics">
        {Object.entries(metrics).map(([key, metric]) => (
          <div key={key} className="metric-card">
            <span className="metric-icon">{metric.icon}</span>
            <div className="metric-info">
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
              {metric.level && <div className="uv-level">{metric.level}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HourlyForecastSection = ({ hourlyData, selectedHour, city, onHourSelect, onRefresh }) => {
  const temperatureTrend = overviewLogic.calculateTemperatureTrend(hourlyData);

  return (
    <div className="hourly-forecast-section">
      <div className="section-header">
        <h3>⏰ 24-Hour Forecast</h3>
        <div className="header-actions">
          <span className="location">{city}</span>
          <button className="refresh-btn" onClick={onRefresh} title="Refresh forecast">
            🔄
          </button>
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="hourly-timeline">
        <div className="timeline-container">
          {hourlyData.slice(0, 12).map((hour) => (
            <HourItem
              key={hour.hour}
              hour={hour}
              isSelected={selectedHour?.hour === hour.hour}
              onClick={() => onHourSelect(hour)}
            />
          ))}
        </div>
        
        <div className="scroll-hint">
          <span className="scroll-icon">→</span>
          <span>Scroll for more hours</span>
        </div>
      </div>

      {/* Selected Hour Details */}
      {selectedHour && <HourDetails hour={selectedHour} />}

      {/* Temperature Chart */}
      {temperatureTrend && (
        <TemperatureChart hourlyData={temperatureTrend.slice(0, 12)} />
      )}

      <div className="forecast-note">
        <p>
          <strong>Note:</strong> Hourly forecasts are estimates based on current weather patterns 
          and may change. Updated every 15 minutes.
        </p>
      </div>
    </div>
  );
};

const HourItem = ({ hour, isSelected, onClick }) => (
  <div
    className={`timeline-hour ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
    title={`${hour.displayHour}: ${hour.temperature}°C, ${hour.condition}`}
  >
    <div className="hour-time">{hour.displayHour}</div>
    <div className="hour-icon">{hour.icon}</div>
    <div 
      className="hour-temp"
      style={{ color: overviewLogic.getTemperatureColor(hour.temperature) }}
    >
      {hour.temperature}°
    </div>
    {hour.precipitation > 0 && (
      <div className="precipitation-indicator">
        <span className="raindrop">💧</span>
        <span className="precipitation-value">{Math.round(hour.precipitation)}%</span>
      </div>
    )}
  </div>
);

const HourDetails = ({ hour }) => (
  <div className="hour-details">
    <div className="details-header">
      <h4>{hour.displayHour} Details</h4>
      {hour.hour === new Date().getHours() && (
        <span className="current-badge">Current</span>
      )}
    </div>
    
    <div className="details-grid">
      {[
        { key: 'temperature', icon: '🌡️', label: 'Temperature', value: `${hour.temperature}°C` },
        { key: 'feelsLike', icon: '🤔', label: 'Feels Like', value: `${hour.feelsLike}°C` },
        { key: 'humidity', icon: '💧', label: 'Humidity', value: `${hour.humidity}%` },
        { key: 'windSpeed', icon: '💨', label: 'Wind Speed', value: `${hour.windSpeed} km/h` },
        { key: 'precipitation', icon: '🌧️', label: 'Precipitation', value: `${hour.precipitation}%` },
        { key: 'uvIndex', icon: '👁️', label: 'UV Index', value: hour.uvIndex }
      ].map(item => (
        <div key={item.key} className="detail-card">
          <div className="detail-icon">{item.icon}</div>
          <div className="detail-info">
            <div className="detail-value">{item.value}</div>
            <div className="detail-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
    
    <div className="condition-summary">
      <div className="condition-icon">{hour.icon}</div>
      <div className="condition-info">
        <h5>{hour.condition}</h5>
        <p>Weather conditions at {hour.displayHour}</p>
      </div>
    </div>
  </div>
);

const TemperatureChart = ({ hourlyData }) => (
  <div className="temperature-chart">
    <h4>Temperature Trend</h4>
    <div className="chart-container">
      <div className="chart-line">
        {hourlyData.map((hour, index) => (
          <div key={index} className="chart-point">
            <div 
              className="point"
              style={{
                bottom: `${hour.chartHeight}%`,
                backgroundColor: overviewLogic.getTemperatureColor(hour.temperature)
              }}
              title={`${hour.displayHour}: ${hour.temperature}°C`}
            ></div>
            <div className="point-label">{hour.displayHour}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="chart-legend">
      {['cold', 'cool', 'warm', 'hot'].map(type => (
        <div key={type} className="legend-item">
          <div className={`legend-color ${type}`}></div>
          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </div>
      ))}
    </div>
  </div>
);

const FiveDayForecast = ({ forecastData }) => {
  const forecast = overviewLogic.getFiveDayForecast(forecastData);
  
  if (!forecast.length) return null;

  return (
    <div className="five-day-forecast">
      <h3>📅 5-Day Forecast</h3>
      <div className="forecast-cards">
        {forecast.map((day, index) => (
          <div key={index} className="forecast-card">
            <div className="forecast-day">{day.day}</div>
            <div className="forecast-icon">{day.icon}</div>
            <div className="forecast-temp">{day.temperature}°C</div>
            <div className="forecast-condition">{day.condition}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeaturesGrid = ({ features, onIconClick }) => (
  <div className="features-grid">
    {features.map(feature => (
      <div 
        key={feature.id}
        className="feature-card clickable" 
        onClick={() => onIconClick(feature.id)}
      >
        <div className="feature-icon">{feature.icon}</div>
        <h3>{feature.title}</h3>
        <p>{feature.desc}</p>
        {feature.extra && <div className="feature-extra">{feature.extra}</div>}
      </div>
    ))}
  </div>
);

const DataActions = ({ onRefresh }) => (
  <div className="data-actions">
    <button className="refresh-btn" onClick={onRefresh}>
      🔄 Refresh Data
    </button>
    <span className="last-updated">
      Last updated: {new Date().toLocaleTimeString()}
    </span>
  </div>
);

const ErrorBanner = ({ error }) => (
  <div className="error-banner">
    <span className="error-icon">⚠️</span>
    <span>{error}</span>
  </div>
);

export default OverviewPage;