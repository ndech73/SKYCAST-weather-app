import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/searchBar';
import WeatherCard from '../components/weatherCard';
import Forecast from '../components/Forecast';
import '../styles/pages/home.css';

const Home = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city.trim()
      )}&format=jsonv2&accept-language=en&limit=1`;
      
      const geoRes = await fetch(geoUrl, {
        headers: { 
          "Accept-Language": "en", 
          "User-Agent": "SkyCastApp/1.0" 
        }
      });
      
      if (!geoRes.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const geoData = await geoRes.json();
      
      if (!geoData?.length) {
        setError('City not found. Please check the spelling and try again.');
        setLoading(false);
        return;
      }

      const { lat, lon, display_name } = geoData[0];
      console.log(`✅ Geocoded: ${display_name} -> lat: ${lat}, lon: ${lon}`);
      
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      
      if (!weatherRes.ok) {
        const errorData = await weatherRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch weather data');
      }
      
      const weatherResponse = await weatherRes.json();
      console.log('✅ Current weather:', weatherResponse);
      
      const transformedWeather = {
        coord: weatherResponse.coord,
        name: weatherResponse.location.name || display_name.split(',')[0],
        sys: { 
          country: weatherResponse.location.country 
        },
        main: {
          temp: weatherResponse.temp,
          humidity: weatherResponse.humidity,
          feels_like: weatherResponse.temp,
          temp_min: weatherResponse.temp,
          temp_max: weatherResponse.temp,
          pressure: 1013
        },
        wind: { 
          speed: weatherResponse.wind 
        },
        clouds: { 
          all: weatherResponse.cloud 
        },
        weather: [{
          main: weatherResponse.cloud > 50 ? 'Clouds' : 'Clear',
          description: weatherResponse.cloud > 50 ? 'cloudy' : 'clear sky',
          icon: weatherResponse.cloud > 50 ? '04d' : '01d'
        }],
        dt: Math.floor(Date.now() / 1000),
        aqi: weatherResponse.aqi,
        aqi_label: weatherResponse.aqi_label,
        snow: weatherResponse.snow,
        display_name: display_name
      };
      
      setWeatherData(transformedWeather);
      
      // --- START OF FIX ---
      // Step 3: Fetch forecast using the correct lat/lon endpoint.
      try {
        // Use the same lat and lon from geocoding for consistency.
        const forecastRes = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`);
        if (forecastRes.ok) {
          const forecast = await forecastRes.json();
          console.log('✅ Forecast:', forecast);
          // Assuming the forecast data is in a 'data' property or is the root object
          setForecastData(forecast.data || forecast);
        } else {
          console.warn('⚠️ Forecast not available, continuing without it.');
          setForecastData(null);
        }
      } catch (forecastErr) {
        console.warn('⚠️ Forecast fetch failed:', forecastErr.message);
        setForecastData(null);
      }
      // --- END OF FIX ---
      
    } catch (err) {
      console.error('❌ Search error:', err);
      setError(err.message || 'Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError('');

  const handleContinueToDashboard = (e) => {
    e.preventDefault();
    console.log('🚀 Continuing to dashboard with data:', { weatherData, forecastData });
    navigate('/dashboard', { 
      replace: true,
      state: { weatherData, forecastData }
    });
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
          {/* This component will now correctly receive forecastData */}
          {weatherData && !loading && !error && (
            <WeatherCard 
              weatherData={weatherData}
              loading={loading}
              error={error}
            />
          )}

          {weatherData && !loading && !error && forecastData && (
            <Forecast forecastData={forecastData} />
          )}

          {weatherData && !loading && !error && (
            <div className="dashboard-cta">
              <form onSubmit={handleContinueToDashboard}>
                <button 
                  type="submit"
                  className="dashboard-btn"
                >
                  🚀 Continue to Dashboard
                </button>
              </form>
              <p className="cta-subtext">
                View detailed analytics and advanced weather insights
              </p>
            </div>
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