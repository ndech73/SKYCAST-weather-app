import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../../scripts/weatherAPI';
import '../../styles/pages/FavoritesPage.css';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Load from localStorage or API
      const savedFavorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [
        { id: 1, name: 'Nairobi', country: 'Kenya', temp: 24, condition: 'Partly Cloudy' },
        { id: 2, name: 'Mombasa', country: 'Kenya', temp: 28, condition: 'Sunny' },
        { id: 3, name: 'London', country: 'UK', temp: 12, condition: 'Cloudy' },
        { id: 4, name: 'Tokyo', country: 'Japan', temp: 18, condition: 'Clear' }
      ];
      
      // Fetch updated weather for each favorite
      const updatedFavorites = await Promise.all(
        savedFavorites.map(async fav => {
          try {
            const weather = await weatherAPI.getCurrentWeather(fav.name);
            return {
              ...fav,
              temp: weather.temperature || fav.temp,
              condition: weather.condition || fav.condition,
              humidity: weather.humidity,
              windSpeed: weather.windSpeed
            };
          } catch (error) {
            return fav; // Return original if API fails
          }
        })
      );
      
      setFavorites(updatedFavorites);
      localStorage.setItem('weatherFavorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async () => {
    if (!newCity.trim()) return;
    
    try {
      const weather = await weatherAPI.getCurrentWeather(newCity);
      const newFavorite = {
        id: Date.now(),
        name: newCity,
        country: weather.country || 'Unknown',
        temp: weather.temperature,
        condition: weather.condition,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed
      };
      
      const updatedFavorites = [...favorites, newFavorite];
      setFavorites(updatedFavorites);
      localStorage.setItem('weatherFavorites', JSON.stringify(updatedFavorites));
      setNewCity('');
    } catch (error) {
      alert('Failed to add city. Please check the name and try again.');
    }
  };

  const removeFavorite = (id) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem('weatherFavorites', JSON.stringify(updatedFavorites));
  };

  const refreshFavorites = () => {
    loadFavorites();
  };

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your favorite locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <div>
          <h2>⭐ Favorite Locations</h2>
          <p>Your saved weather locations at a glance</p>
        </div>
        <button className="refresh-btn" onClick={refreshFavorites}>
          🔄 Refresh All
        </button>
      </div>

      <div className="add-favorite-section">
        <h3>Add New Favorite</h3>
        <div className="add-favorite-form">
          <input
            type="text"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="Enter city name (e.g., Paris, FR)"
            className="city-input"
          />
          <button className="add-btn" onClick={addFavorite}>
            ➕ Add Location
          </button>
        </div>
        <p className="form-hint">Press Enter or click Add to save the location</p>
      </div>

      <div className="favorites-grid">
        {favorites.length > 0 ? (
          favorites.map(favorite => (
            <div key={favorite.id} className="favorite-card">
              <div className="favorite-header">
                <div className="location-info">
                  <h3>{favorite.name}</h3>
                  <p className="country">{favorite.country}</p>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeFavorite(favorite.id)}
                  title="Remove from favorites"
                >
                  ❌
                </button>
              </div>
              
              <div className="weather-info">
                <div className="temperature">
                  <span className="temp-value">{favorite.temp}°C</span>
                  <span className="condition">{favorite.condition}</span>
                </div>
                
                <div className="weather-details">
                  <div className="detail">
                    <span className="detail-icon">💧</span>
                    <span className="detail-value">{favorite.humidity || '--'}%</span>
                  </div>
                  <div className="detail">
                    <span className="detail-icon">💨</span>
                    <span className="detail-value">{favorite.windSpeed || '--'} km/h</span>
                  </div>
                </div>
              </div>
              
              <div className="favorite-actions">
                <button className="action-btn view-btn">
                  👁️ View Details
                </button>
                <button className="action-btn compare-btn">
                  📊 Compare
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-favorites">
            <div className="empty-icon">⭐</div>
            <h4>No favorite locations yet</h4>
            <p>Add cities above to see their weather here</p>
          </div>
        )}
      </div>

      {favorites.length > 0 && (
        <div className="comparison-section">
          <h3>📍 Location Comparison</h3>
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>Temp (°C)</th>
                  <th>Condition</th>
                  <th>Humidity</th>
                  <th>Wind Speed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {favorites.map(fav => (
                  <tr key={fav.id}>
                    <td>
                      <strong>{fav.name}</strong>
                      <div className="country-small">{fav.country}</div>
                    </td>
                    <td className="temp-cell">{fav.temp}°C</td>
                    <td>
                      <span className="condition-badge">{fav.condition}</span>
                    </td>
                    <td>{fav.humidity || '--'}%</td>
                    <td>{fav.windSpeed || '--'} km/h</td>
                    <td>
                      <button className="table-action-btn">📈 View Graph</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="favorites-stats">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <div className="stat-value">{favorites.length}</div>
            <div className="stat-label">Saved Locations</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🌡️</div>
          <div className="stat-info">
            <div className="stat-value">
              {favorites.length > 0 
                ? (favorites.reduce((sum, fav) => sum + fav.temp, 0) / favorites.length).toFixed(1)
                : '0'
              }°C
            </div>
            <div className="stat-label">Average Temp</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🕒</div>
          <div className="stat-info">
            <div className="stat-value">5 min</div>
            <div className="stat-label">Update Interval</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🌍</div>
          <div className="stat-info">
            <div className="stat-value">
              {new Set(favorites.map(f => f.country)).size}
            </div>
            <div className="stat-label">Countries</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button className="quick-action-btn" onClick={() => alert('Export coming soon!')}>
            📥 Export All Data
          </button>
          <button className="quick-action-btn" onClick={() => alert('Share coming soon!')}>
            📤 Share Favorites
          </button>
          <button className="quick-action-btn" onClick={() => setFavorites([])}>
            🗑️ Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;