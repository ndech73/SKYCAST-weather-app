import React, { useState } from 'react';
import SearchBar from '../components/searchBar';
import WeatherCard from '../components/weatherCard';
import Forecast from '../components/Forecast';
import { weatherAPI } from '../scripts/weatherAPI';
import '../styles/pages/home.css';

const Home = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (city) => {
    if (!city || city.trim() === '') {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');
    setWeatherData(null);
    setForecastData(null);

    try {
      console.log('🔍 Searching for:', city);
      
      const currentWeather = await weatherAPI.getCurrentWeather(city);
      console.log('✅ Current weather:', currentWeather);
      setWeatherData(currentWeather);
      
      const forecast = await weatherAPI.getForecast(city);
      console.log('✅ Forecast:', forecast);
      setForecastData(forecast);
      
    } catch (err) {
      console.error('❌ Search error:', err);
      setError(err.message || 'Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError('');

  const handleContinueToDashboard = () => {
    console.log('🚀 Continuing to dashboard with data:', { weatherData, forecastData });
    alert('Continuing to Dashboard! Implement your navigation logic here.');
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="weather-icon">🌤️</div>
            <div>
              <h1 className="home-title">SkyCast</h1>
              <p className="home-subtitle">Accurate weather forecasting at your fingertips</p>
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="search-section">
          <div className="search-container">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search for a city (e.g., London, New York, Tokyo)"
              disabled={loading}
            />
          </div>
        </section>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Scanning the skies...</p>
            <p className="loading-subtext">Fetching latest weather data for you</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h3>Weather Data Unavailable</h3>
              <p>{error}</p>
            </div>
            <button 
              onClick={clearError}
              className="error-dismiss-btn"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="weather-content">
          <WeatherCard 
            weatherData={weatherData}
            loading={loading}
            error={error}
          />

          {/* FIXED: Show dashboard button when we have weather data, even if forecast fails */}
          {weatherData && !loading && !error && (
            <>
              {forecastData && <Forecast forecastData={forecastData} />}
              
              <div className="dashboard-cta">
                <button 
                  onClick={handleContinueToDashboard}
                  className="dashboard-btn"
                >
                  🚀 Continue to Dashboard
                </button>
                <p className="cta-subtext">
                  View detailed analytics and advanced weather insights
                </p>
              </div>
            </>
          )}
        </div>

        {!weatherData && !loading && !error && (
          <div className="welcome-state">
            <div className="welcome-icon">🌎</div>
            <h2>Welcome to SkyCast</h2>
            <p>Your trusted companion for weather forecasting</p>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h4>Global Coverage</h4>
                <p>Get weather data for any city worldwide</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h4>Real-Time Data</h4>
                <p>Current conditions with live updates</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h4>Extended Forecast</h4>
                <p>5-day outlook to help you plan ahead</p>
              </div>
            </div>

            <div className="quick-tips">
              <h4>Pro Tips for Better Results:</h4>
              <ul>
                <li>Make sure to spell the city name correctly</li>
                <li>Try including country code for precise results (e.g., "Paris, FR")</li>
                <li>Check your internet connection if results are slow</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer className="home-footer">
        <p>SkyCast 🌤️ - Forecasting your world, one city at a time</p>
      </footer>
    </div>
  );
};

export default Home;