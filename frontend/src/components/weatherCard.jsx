// components/WeatherCard.jsx
import React from 'react';
import { useSettings } from '../context/settingsContext';
import LoadingSpinner from './loadingSpinner';
import '../styles/pages/weatherCard.css';

const WeatherCard = ({ weatherData, loading, error }) => {
  // Get conversion utilities from settings context
  const { convertTemperature, getTempUnit, convertSpeed, getSpeedUnit } = useSettings();

  if (loading) {
    return <LoadingSpinner message="Fetching weather data..." />;
  }

  if (error) {
    const sanitizedError = typeof error === 'string' 
      ? error.replace(/<[^>]*>/g, '')
      : 'Unable to fetch weather data. Please try again.';
    
    return (
      <div className="weather-card error">
        <p>Error: {sanitizedError}</p>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="weather-card initial">
        <p>Search for a city to see the weather!</p>
      </div>
    );
  }

  const { name, main, weather, wind } = weatherData;
  
  if (!main || !weather || !Array.isArray(weather) || weather.length === 0 || !wind) {
    return (
      <div className="weather-card error">
        <p>Invalid weather data received.</p>
      </div>
    );
  }

  const { temp, feels_like, humidity, pressure } = main;
  const { description, icon } = weather[0];

  const isValidIcon = /^[0-9]{2}[dn]$/.test(icon);
  const safeIcon = isValidIcon ? icon : '01d';
  const safeName = String(name || 'Unknown').slice(0, 100);
  const safeDescription = String(description || 'No description').slice(0, 200);

  return (
    <div className="weather-card">
      <h2 className="city-name">Weather in {safeName}</h2>
      
      <div className="weather-main">
        <img
          src={`https://openweathermap.org/img/wn/${safeIcon}@2x.png`}
          alt={safeDescription}
          className="weather-icon"
          onError={(e) => {
            e.target.src = 'https://openweathermap.org/img/wn/01d@2x.png';
          }}
        />
        <div className="temperature-section">
          <p className="temperature">
            {convertTemperature(temp, 'celsius')}{getTempUnit()}
          </p>
          <p className="description">{safeDescription}</p>
        </div>
      </div>
      
      <div className="weather-details">
        <div className="detail-item">
          <span className="label">Feels like:</span>
          <span className="value">
            {convertTemperature(feels_like, 'celsius')}{getTempUnit()}
          </span>
        </div>
        <div className="detail-item">
          <span className="label">Humidity:</span>
          <span className="value">
            {typeof humidity === 'number' ? humidity : '--'}%
          </span>
        </div>
        <div className="detail-item">
          <span className="label">Pressure:</span>
          <span className="value">
            {typeof pressure === 'number' ? pressure : '--'} hPa
          </span>
        </div>
        <div className="detail-item">
          <span className="label">Wind Speed:</span>
          <span className="value">
            {convertSpeed(wind?.speed, 'ms')} {getSpeedUnit()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;