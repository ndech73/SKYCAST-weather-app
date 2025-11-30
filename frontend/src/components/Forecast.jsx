import React from 'react';
import '../styles/pages/Forecast.css';

const Forecast = ({ forecastData, loading, error }) => {
  if (loading) {
    return (
      <div className="forecast-container loading">
        <p>Loading forecast...</p>
      </div>
    );
  }

  if (error) {
    const sanitizedError = typeof error === 'string' 
      ? error.replace(/<[^>]*>/g, '')
      : 'Unable to fetch forecast data.';
    
    return (
      <div className="forecast-container error">
        <p>Error: {sanitizedError}</p>
      </div>
    );
  }

  // Validate data structure
  if (!forecastData || !Array.isArray(forecastData.list) || forecastData.list.length === 0) {
    return (
      <div className="forecast-container initial">
        <p>5-day forecast will appear here</p>
      </div>
    );
  }

  // Safely filter and validate forecast data
  const dailyForecasts = forecastData.list
    .filter((reading, index) => index % 8 === 0)
    .slice(0, 5)
    .filter(day => {
      // Validate each day has required structure
      return day && 
             day.main && 
             day.weather && 
             Array.isArray(day.weather) && 
             day.weather.length > 0 &&
             typeof day.dt === 'number';
    });

  // Check if we have valid forecast data after filtering
  if (dailyForecasts.length === 0) {
    return (
      <div className="forecast-container error">
        <p>Invalid forecast data received.</p>
      </div>
    );
  }

  const formatDay = (timestamp) => {
    try {
      // Validate timestamp is reasonable (between 1970 and 2100)
      if (timestamp < 0 || timestamp > 4102444800) {
        return 'Unknown';
      }
      const date = new Date(timestamp * 1000);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (e) {
      return 'Unknown';
    }
  };

  // Validate icon code (OpenWeatherMap format: 01d, 02n, etc.)
  const validateIcon = (icon) => {
    if (typeof icon !== 'string') return false;
    return /^[0-9]{2}[dn]$/.test(icon);
  };

  return (
    <div className="forecast-container">
      <h3>5-Day Forecast</h3>
      <div className="forecast-grid">
        {dailyForecasts.map((day, index) => {
          const { dt, main, weather } = day;
          const { temp_max, temp_min } = main;
          const { description, icon } = weather[0];

          // Sanitize and validate data
          const safeIcon = validateIcon(icon) ? icon : '01d';
          const safeDescription = String(description || 'No description').slice(0, 200);
          const safeTempMax = typeof temp_max === 'number' ? Math.round(temp_max) : '--';
          const safeTempMin = typeof temp_min === 'number' ? Math.round(temp_min) : '--';

          return (
            <div key={`${dt}-${index}`} className="forecast-day">
              <p className="day-name">
                {index === 0 ? 'Today' : formatDay(dt)}
              </p>
              <img
                src={`https://openweathermap.org/img/wn/${safeIcon}.png`}
                alt={safeDescription}
                className="forecast-icon"
                onError={(e) => {
                  e.target.src = 'https://openweathermap.org/img/wn/01d.png';
                }}
              />
              <div className="forecast-temps">
                <span className="temp-high">{safeTempMax}°</span>
                <span className="temp-low">{safeTempMin}°</span>
              </div>
              <p className="forecast-desc">{safeDescription}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Forecast;