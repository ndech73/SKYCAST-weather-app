import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../../scripts/weatherAPI';
import { 
  IoAddOutline, 
  IoCloseOutline,
  IoWaterOutline,
  IoChevronForwardOutline,
  IoStarOutline,
  IoStar
} from 'react-icons/io5';
import { 
  WiDaySunny, 
  WiCloudy, 
  WiRain, 
  WiThunderstorm,
  WiSnow,
  WiFog,
  WiDayCloudy,
  WiWindy
} from 'react-icons/wi';

const MobileFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Load from localStorage or API
      const savedFavorites = JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
      
      // Fetch weather for each favorite
      const weatherPromises = savedFavorites.map(city => 
        weatherAPI.getCurrentWeather(city).catch(() => null)
      );
      
      const weatherData = await Promise.all(weatherPromises);
      setFavorites(weatherData.filter(Boolean));
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async () => {
    if (!newCity.trim()) return;
    
    try {
      const weather = await weatherAPI.getCurrentWeather(newCity);
      setFavorites(prev => [...prev, weather]);
      
      // Save to localStorage
      const savedFavorites = JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
      savedFavorites.push(newCity);
      localStorage.setItem('favoriteLocations', JSON.stringify(savedFavorites));
      
      setNewCity('');
      setShowAddModal(false);
    } catch (error) {
      alert('Failed to add city. Please try again.');
    }
  };

  // Helper to get the city name from weather data regardless of property name
  const getCityName = (weather) => {
    return weather.city || weather.name || weather.location || 'Unknown';
  };

  const removeFavorite = (index, cityName) => {
    if (confirm(`Remove ${cityName} from favorites?`)) {
      setFavorites(prev => prev.filter((_, i) => i !== index));
      
      // Update localStorage
      const savedFavorites = JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
      const updated = savedFavorites.filter(city => city !== cityName);
      localStorage.setItem('favoriteLocations', JSON.stringify(updated));
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
        <p className="mobile-loading-text">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="mobile-favorites">
      {/* Header */}
      <div className="mobile-section-header" style={{ marginBottom: '1rem' }}>
        <h2 className="mobile-section-title">Favorite Locations</h2>
        <button className="mobile-add-btn" onClick={() => setShowAddModal(true)}>
          <IoAddOutline style={{ marginRight: '0.25rem', fontSize: '18px' }} />
          Add
        </button>
      </div>

      {/* Empty State */}
      {favorites.length === 0 && (
        <div className="mobile-empty-state">
          <div className="mobile-empty-icon">
            <IoStarOutline style={{ fontSize: '4rem' }} />
          </div>
          <h3 className="mobile-empty-title">No Favorites Yet</h3>
          <p className="mobile-empty-message">
            Add your favorite cities to quickly check their weather
          </p>
          <button 
            className="mobile-add-favorite-btn"
            onClick={() => setShowAddModal(true)}
          >
            <IoAddOutline style={{ marginRight: '0.5rem', fontSize: '20px', verticalAlign: 'middle' }} />
            Add Your First City
          </button>
        </div>
      )}

      {/* Favorites Grid */}
      <div className="mobile-favorites-grid">
        {favorites.map((weather, index) => (
          <div key={index} className="mobile-favorite-card">
            <button 
              className="mobile-remove-favorite"
              onClick={() => removeFavorite(index, getCityName(weather))}
              aria-label="Remove favorite"
            >
              <IoCloseOutline />
            </button>
            
            <div className="mobile-favorite-header">
              <h3 className="mobile-favorite-city">{getCityName(weather)}</h3>
              <span className="mobile-favorite-icon">
                {getWeatherIcon(weather.condition)}
              </span>
            </div>

            <div className="mobile-favorite-temp">
              {Math.round(weather.temperature)}°
            </div>

            <div className="mobile-favorite-condition">
              {weather.condition || 'Clear'}
            </div>

            <div className="mobile-favorite-details">
              <div className="mobile-favorite-detail">
                <WiWindy style={{ fontSize: '24px' }} />
               <span>
  {typeof weather.wind_speed === 'number' 
    ? weather.wind_speed.toFixed(1) 
    : '0'} m/s
</span>
              </div>
              <div className="mobile-favorite-detail">
                <IoWaterOutline style={{ fontSize: '20px' }} />
                <span>{weather.humidity || 0}%</span>
              </div>
            </div>

            <button className="mobile-view-details-btn">
              View Details
              <IoChevronForwardOutline style={{ marginLeft: '0.5rem', fontSize: '16px', verticalAlign: 'middle' }} />
            </button>
          </div>
        ))}
      </div>

      {/* Add City Modal */}
      {showAddModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Add Favorite City</h3>
              <button 
                className="mobile-modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                <IoCloseOutline />
              </button>
            </div>

            <div className="mobile-modal-content">
              <input
                type="text"
                className="mobile-modal-input"
                placeholder="Enter city name..."
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFavorite()}
                autoFocus
              />
            </div>

            <div className="mobile-modal-actions">
              <button 
                className="mobile-modal-btn mobile-modal-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="mobile-modal-btn mobile-modal-add"
                onClick={addFavorite}
              >
                <IoAddOutline style={{ marginRight: '0.5rem', fontSize: '18px', verticalAlign: 'middle' }} />
                Add City
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFavorites;