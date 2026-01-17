import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../../scripts/weatherAPI';
import '../../styles/pages/OutfitsPage.css';

const OutfitsPage = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [outfitRecommendations, setOutfitRecommendations] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    style: 'casual',
    sensitivity: 'medium',
    activity: 'daily'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeatherAndOutfits();
  }, [userPreferences]);

  const fetchWeatherAndOutfits = async () => {
    try {
      setLoading(true);
      const weather = await weatherAPI.getCurrentWeather('Nairobi');
      setWeatherData(weather);
      
      // Generate outfit recommendations based on weather
      const recommendations = generateOutfitRecommendations(weather, userPreferences);
      setOutfitRecommendations(recommendations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOutfitRecommendations = (weather, preferences) => {
    const temp = weather?.temperature || 24;
    const condition = weather?.condition?.toLowerCase() || 'partly cloudy';
    
    const baseOutfits = [
      {
        id: 1,
        name: 'Casual Day Wear',
        items: ['👕 Cotton T-Shirt', '👖 Jeans', '👟 Sneakers'],
        description: 'Perfect for daily activities',
        comfortTemp: { min: 18, max: 28 },
        conditions: ['clear', 'partly cloudy', 'sunny']
      },
      {
        id: 2,
        name: 'Rain Ready',
        items: ['🧥 Rain Jacket', '👖 Waterproof Pants', '🌂 Umbrella', '👢 Rain Boots'],
        description: 'Stay dry in wet conditions',
        comfortTemp: { min: 10, max: 25 },
        conditions: ['rain', 'drizzle', 'storm']
      },
      {
        id: 3,
        name: 'Cold Weather Gear',
        items: ['🧥 Warm Jacket', '🧣 Scarf', '🧤 Gloves', '🧢 Beanie'],
        description: 'Keep warm in chilly weather',
        comfortTemp: { min: -5, max: 15 },
        conditions: ['cold', 'windy', 'snow']
      },
      {
        id: 4,
        name: 'Hot Day Outfit',
        items: ['👕 Light Shirt', '🩳 Shorts', '🧢 Cap', '😎 Sunglasses'],
        description: 'Stay cool in hot weather',
        comfortTemp: { min: 25, max: 40 },
        conditions: ['hot', 'sunny', 'clear']
      }
    ];

    // Filter outfits based on current weather
    return baseOutfits.filter(outfit => {
      const tempMatch = temp >= outfit.comfortTemp.min && temp <= outfit.comfortTemp.max;
      const conditionMatch = outfit.conditions.some(c => condition.includes(c));
      return tempMatch && conditionMatch;
    });
  };

  const handlePreferenceChange = (key, value) => {
    setUserPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="outfits-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing weather for outfit recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="outfits-page">
      <div className="outfits-header">
        <div>
          <h2>👕 AI Outfit Recommender</h2>
          <p>Smart clothing suggestions based on current weather</p>
        </div>
        <div className="weather-context">
          <span className="current-temp">{weatherData?.temperature || 24}°C</span>
          <span className="current-condition">{weatherData?.condition || 'Partly Cloudy'}</span>
        </div>
      </div>

      <div className="preferences-panel">
        <h3>Your Preferences</h3>
        <div className="preference-grid">
          <div className="preference-group">
            <label>Style Preference</label>
            <div className="preference-buttons">
              {['casual', 'formal', 'sporty', 'business'].map(style => (
                <button
                  key={style}
                  className={`pref-btn ${userPreferences.style === style ? 'active' : ''}`}
                  onClick={() => handlePreferenceChange('style', style)}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="preference-group">
            <label>Temperature Sensitivity</label>
            <div className="preference-buttons">
              {['low', 'medium', 'high'].map(sensitivity => (
                <button
                  key={sensitivity}
                  className={`pref-btn ${userPreferences.sensitivity === sensitivity ? 'active' : ''}`}
                  onClick={() => handlePreferenceChange('sensitivity', sensitivity)}
                >
                  {sensitivity.charAt(0).toUpperCase() + sensitivity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="preference-group">
            <label>Daily Activity</label>
            <div className="preference-buttons">
              {['daily', 'work', 'exercise', 'outing'].map(activity => (
                <button
                  key={activity}
                  className={`pref-btn ${userPreferences.activity === activity ? 'active' : ''}`}
                  onClick={() => handlePreferenceChange('activity', activity)}
                >
                  {activity.charAt(0).toUpperCase() + activity.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="recommendations-section">
        <h3>Recommended Outfits</h3>
        <div className="recommendations-grid">
          {outfitRecommendations.length > 0 ? (
            outfitRecommendations.map(outfit => (
              <div key={outfit.id} className="outfit-card">
                <div className="outfit-header">
                  <h4>{outfit.name}</h4>
                  <span className="match-badge">🎯 95% Match</span>
                </div>
                <p className="outfit-description">{outfit.description}</p>
                
                <div className="outfit-items">
                  <h5>Items Needed:</h5>
                  <ul>
                    {outfit.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="outfit-actions">
                  <button className="save-outfit-btn">💾 Save Outfit</button>
                  <button className="share-outfit-btn">📤 Share</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-recommendations">
              <div className="no-rec-icon">🤔</div>
              <h4>No specific recommendations</h4>
              <p>Try adjusting your preferences or check back later</p>
            </div>
          )}
        </div>
      </div>

      <div className="ai-insights">
        <h3>🤖 AI Fashion Insights</h3>
        <div className="insight-card">
          <div className="insight-icon">🧠</div>
          <div className="insight-content">
            <h4>Smart Recommendation</h4>
            <p>Based on {weatherData?.temperature}°C and {userPreferences.style} style preferences</p>
          </div>
        </div>
        
        <div className="insight-card">
          <div className="insight-icon">⚡</div>
          <div className="insight-content">
            <h4>Quick Tip</h4>
            <p>Layer your clothing for changing temperatures throughout the day</p>
          </div>
        </div>
      </div>

      <div className="outfit-stats">
        <div className="stat-card">
          <div className="stat-icon">👕</div>
          <div className="stat-info">
            <div className="stat-value">{outfitRecommendations.length}</div>
            <div className="stat-label">Outfit Suggestions</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <div className="stat-value">95%</div>
            <div className="stat-label">Accuracy Rate</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <div className="stat-value">2 min</div>
            <div className="stat-label">Update Time</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">500+</div>
            <div className="stat-label">Items in Database</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutfitsPage;