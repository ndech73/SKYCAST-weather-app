import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../../scripts/weatherAPI';
import { 
  IoSearchOutline, 
  IoLocationOutline,
  IoWaterOutline,
  IoSpeedometerOutline,
  IoEyeOutline,
  IoChevronForwardOutline,
  IoRefreshOutline
} from 'react-icons/io5';
import { 
  WiDaySunny, 
  WiCloudy, 
  WiRain, 
  WiThunderstorm,
  WiSnow,
  WiFog,
  WiDayCloudy,
  WiNightClear,
  WiWindy
} from 'react-icons/wi';

const MobileWeatherHome = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWeather('Nairobi'); // Default city
  }, []);

  const fetchWeather = async (city) => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherAPI.getCurrentWeather(city);
      setWeatherData(data);
    } catch (err) {
      setError('Unable to fetch weather data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeather(searchQuery);
    }
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return <WiDaySunny />;
    
    const cond = condition.toLowerCase();
    if (cond.includes('thunder')) return <WiThunderstorm />;
    if (cond.includes('rain')) return <WiRain />;
    if (cond.includes('snow')) return <WiSnow />;
    if (cond.includes('cloud')) return <WiCloudy />;
    if (cond.includes('clear') || cond.includes('sunny')) return <WiDaySunny />;
    if (cond.includes('fog') || cond.includes('mist')) return <WiFog />;
    return <WiDayCloudy />;
  };

  if (loading) {
    return (
      <div className="mobile-loading">
        <div className="mobile-loading-spinner"></div>
        <p className="mobile-loading-text">Loading weather...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-error">
        <div className="mobile-error-icon">⚠️</div>
        <h3 className="mobile-error-title">Oops!</h3>
        <p className="mobile-error-message">{error}</p>
        <button className="mobile-retry-btn" onClick={() => fetchWeather('Nairobi')}>
          <IoRefreshOutline style={{ marginRight: '0.5rem' }} />
          Try Again
        </button>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="mobile-empty-state">
        <div className="mobile-empty-icon">
          <WiDaySunny style={{ fontSize: '4rem' }} />
        </div>
        <h2 className="mobile-empty-title">No Weather Data</h2>
        <p className="mobile-empty-message">Search for a city to see weather information</p>
      </div>
    );
  }

  return (
    <div className="mobile-animate-in">
      {/* Search Bar */}
      <div className="mobile-search">
        <form onSubmit={handleSearch}>
          <div className="mobile-search-input-wrapper">
            <IoSearchOutline className="mobile-search-icon" />
            <input
              type="text"
              className="mobile-search-input"
              placeholder="Search city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Current Weather Card */}
      <div className="mobile-current-weather">
        <div className="mobile-weather-location">
          <IoLocationOutline className="mobile-location-icon" />
          <span className="mobile-location-name">{weatherData.location || 'Unknown'}</span>
        </div>

        <div className="mobile-weather-main">
          <div className="mobile-temp-section">
            <div className="mobile-temperature">{Math.round(weatherData.temperature)}°</div>
            <div className="mobile-condition">{weatherData.condition || 'Clear'}</div>
            <div className="mobile-feels-like">Feels like {Math.round(weatherData.feels_like || weatherData.temperature)}°</div>
          </div>
          <div className="mobile-weather-icon-large">
            {getWeatherIcon(weatherData.condition)}
          </div>
        </div>

        <div className="mobile-weather-details">
          <div className="mobile-detail-item">
            <WiWindy className="mobile-detail-icon" />
            <div className="mobile-detail-value">
  {typeof weatherData.wind_speed === 'number' 
    ? weatherData.wind_speed.toFixed(1) 
    : (weatherData.windSpeed?.toFixed?.(1) || '0')} m/s
</div>
            <div className="mobile-detail-label">Wind</div>
          </div>
          <div className="mobile-detail-item">
            <IoWaterOutline className="mobile-detail-icon" />
            <div className="mobile-detail-value">{weatherData.humidity || 0}%</div>
            <div className="mobile-detail-label">Humidity</div>
          </div>
          <div className="mobile-detail-item">
            <IoEyeOutline className="mobile-detail-icon" />
            <div className="mobile-detail-value">{(weatherData.visibility || 10) / 1000} km</div>
            <div className="mobile-detail-label">Visibility</div>
          </div>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="mobile-hourly-section">
        <div className="mobile-section-header">
          <h3 className="mobile-section-title">Hourly Forecast</h3>
          <a href="#" className="mobile-see-all">
            See all <IoChevronForwardOutline style={{ verticalAlign: 'middle' }} />
          </a>
        </div>

        <div className="mobile-hourly-scroll">
          {[0, 1, 2, 3, 4, 5, 6].map((hour) => (
            <div key={hour} className={`mobile-hourly-card ${hour === 0 ? 'active' : ''}`}>
              <div className="mobile-hourly-time">
                {new Date(Date.now() + hour * 3600000).toLocaleTimeString('en-US', { hour: 'numeric' })}
              </div>
              <div className="mobile-hourly-icon">
                {hour % 3 === 0 ? <WiDaySunny /> : hour % 3 === 1 ? <WiDayCloudy /> : <WiCloudy />}
              </div>
              <div className="mobile-hourly-temp">
                {Math.round(weatherData.temperature - hour * 0.5)}°
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Forecast */}
      <div className="mobile-daily-section">
        <div className="mobile-section-header">
          <h3 className="mobile-section-title">7-Day Forecast</h3>
        </div>

        <div className="mobile-daily-list">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={index} className="mobile-daily-item">
              <div className="mobile-day-info">
                <div className="mobile-day-icon">
                  {index % 3 === 0 ? <WiDaySunny /> : index % 3 === 1 ? <WiRain /> : <WiDayCloudy />}
                </div>
                <div>
                  <div className="mobile-day-name">{day}</div>
                  <div className="mobile-day-condition">
                    {index % 3 === 0 ? 'Sunny' : index % 3 === 1 ? 'Rainy' : 'Partly Cloudy'}
                  </div>
                </div>
              </div>
              <div className="mobile-day-temp">
                <span className="mobile-temp-high">{Math.round(weatherData.temperature + index)}°</span>
                <span className="mobile-temp-low">{Math.round(weatherData.temperature - 5 + index)}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileWeatherHome;