import React, { useState, useEffect, useRef } from 'react';
import '../../styles/pages/SettingsPage.css';
import { notificationManager } from '../../scripts/notificationManager';
import { weatherAPI } from '../../scripts/weatherAPI';
import { useSettings } from '../../context/settingsContext';

const SettingsPage = () => {
  // Get settings and profile from context
  const {
    settings,
    userProfile,
    updateSetting,
    updateSettings,
    updateUserProfile,
    isInitialized
  } = useSettings();

  // Local state for notification-specific settings (complex nested object)
  const [weatherNotifications, setWeatherNotifications] = useState({
    enabled: false,
    permission: 'default',
    periodicUpdates: false,
    updateInterval: 60,
    changeAlerts: false,
    lastNotificationTime: null
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('');
  const fileInputRef = useRef(null);

  // Load notification settings from localStorage on mount
  useEffect(() => {
    const savedNotifications = JSON.parse(localStorage.getItem('weatherNotifications'));
    if (savedNotifications) {
      setWeatherNotifications(savedNotifications);
    }
    checkNotificationPermission();
  }, []);

  // Save notification settings to localStorage when they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('weatherNotifications', JSON.stringify(weatherNotifications));
    }
  }, [weatherNotifications, isInitialized]);

  // Show save message helper
  const showSaveMessage = (message, isSuccess = true) => {
    setSaveMessage({ text: message, isSuccess });
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setWeatherNotifications(prev => ({
        ...prev,
        permission: Notification.permission
      }));
    }
  };

  // Handle setting change - updates context immediately
  const handleSettingChange = (key, value) => {
    updateSetting(key, value);
    showSaveMessage('Setting updated!', true);
  };

  const handleNotificationSettingChange = (key, value) => {
    setWeatherNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle profile change - updates context immediately
  const handleProfileChange = (key, value) => {
    updateUserProfile({ [key]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showSaveMessage('Please upload a valid image file', false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showSaveMessage('Image size must be less than 5MB', false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserProfile({
          avatarImage: reader.result,
          avatar: null
        });
        showSaveMessage('Profile image updated!', true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    updateUserProfile({
      avatarImage: null,
      avatar: '👤'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showSaveMessage('Profile image removed', true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await notificationManager.requestPermission();
      
      setWeatherNotifications(prev => ({
        ...prev,
        permission,
        enabled: permission === 'granted'
      }));

      if (permission === 'granted') {
        setNotificationStatus('✅ Notifications enabled!');
      } else if (permission === 'denied') {
        setNotificationStatus('❌ Notification permission denied. Please enable in browser settings.');
      }

      setTimeout(() => setNotificationStatus(''), 5000);
    } catch (error) {
      console.error('Error requesting permission:', error);
      setNotificationStatus('❌ Error requesting permission');
      setTimeout(() => setNotificationStatus(''), 5000);
    }
  };

  const sendTestNotification = async () => {
    if (!notificationManager.isEnabled()) {
      setNotificationStatus('❌ Please enable notifications first');
      setTimeout(() => setNotificationStatus(''), 3000);
      return;
    }

    try {
      const location = userProfile.location || 'Nairobi';
      const weatherData = await weatherAPI.getCurrentWeather(location);
      
      if (weatherData) {
        notificationManager.sendNotification(weatherData, 'test');
        setNotificationStatus('🧪 Test notification sent!');
        
        handleNotificationSettingChange('lastNotificationTime', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setNotificationStatus('❌ Error sending notification');
    }

    setTimeout(() => setNotificationStatus(''), 3000);
  };

  const togglePeriodicNotifications = async (enabled) => {
    handleNotificationSettingChange('periodicUpdates', enabled);

    if (enabled && notificationManager.isEnabled()) {
      const location = userProfile.location || 'Nairobi';
      const interval = weatherNotifications.updateInterval;

      const fetchWeather = async () => {
        try {
          const data = await weatherAPI.getCurrentWeather(location);
          return {
            city: location,
            temperature: data.temp || data.temperature,
            condition: data.condition || data.weather,
            precipitation: data.precipitation || data.rain || 0,
            wind: data.wind || data.windSpeed,
            feelsLike: data.feelsLike || data.feels_like
          };
        } catch (error) {
          console.error('Error fetching weather:', error);
          return null;
        }
      };

      notificationManager.startPeriodicNotifications(fetchWeather, interval);
      setNotificationStatus(`✅ Periodic updates started (every ${interval} min)`);
    } else {
      notificationManager.stopPeriodicNotifications();
      setNotificationStatus('⏸️ Periodic updates stopped');
    }

    setTimeout(() => setNotificationStatus(''), 3000);
  };

  const toggleChangeAlerts = async (enabled) => {
    handleNotificationSettingChange('changeAlerts', enabled);

    if (enabled && notificationManager.isEnabled()) {
      const location = userProfile.location || 'Nairobi';

      const fetchWeather = async () => {
        try {
          const data = await weatherAPI.getCurrentWeather(location);
          return {
            city: location,
            temperature: data.temp || data.temperature,
            condition: data.condition || data.weather,
            precipitation: data.precipitation || data.rain || 0,
            wind: data.wind || data.windSpeed,
            feelsLike: data.feelsLike || data.feels_like
          };
        } catch (error) {
          console.error('Error fetching weather:', error);
          return null;
        }
      };

      notificationManager.startChangeMonitoring(fetchWeather, 15);
      setNotificationStatus('✅ Weather change alerts enabled');
    } else {
      notificationManager.stopChangeMonitoring();
      setNotificationStatus('⏸️ Weather change alerts disabled');
    }

    setTimeout(() => setNotificationStatus(''), 3000);
  };

  const updateNotificationInterval = (interval) => {
    handleNotificationSettingChange('updateInterval', interval);

    if (weatherNotifications.periodicUpdates && notificationManager.isEnabled()) {
      togglePeriodicNotifications(false);
      setTimeout(() => {
        handleNotificationSettingChange('updateInterval', interval);
        togglePeriodicNotifications(true);
      }, 500);
    }
  };

  useEffect(() => {
    return () => {
      if (!weatherNotifications.periodicUpdates) {
        notificationManager.cleanup();
      }
    };
  }, [weatherNotifications.periodicUpdates]);

  const saveUserProfile = () => {
    if (!userProfile.name?.trim()) {
      showSaveMessage('Please enter your name', false);
      return;
    }

    if (!userProfile.email?.trim()) {
      showSaveMessage('Please enter your email', false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userProfile.email)) {
      showSaveMessage('Please enter a valid email address', false);
      return;
    }

    if (!userProfile.location?.trim()) {
      showSaveMessage('Please enter your default location', false);
      return;
    }

    setIsSaving(true);
    
    // Profile is automatically saved via context, just show confirmation
    setTimeout(() => {
      setIsSaving(false);
      showSaveMessage('Profile saved successfully!', true);
    }, 800);
  };

  const saveSettings = () => {
    setIsSaving(true);
    
    // Settings are automatically saved via context, just show confirmation
    setTimeout(() => {
      setIsSaving(false);
      showSaveMessage('Settings saved successfully!', true);
    }, 1000);
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      notificationManager.cleanup();

      // Reset settings via context
      updateSettings({
        units: 'metric',
        theme: 'auto',
        locationAccess: true,
        dataSharing: false,
        autoRefresh: true,
        language: 'en',
        timeFormat: '24h'
      });

      // Reset notification settings
      const defaultNotifications = {
        enabled: false,
        permission: 'default',
        periodicUpdates: false,
        updateInterval: 60,
        changeAlerts: false,
        lastNotificationTime: null
      };
      setWeatherNotifications(defaultNotifications);
      localStorage.setItem('weatherNotifications', JSON.stringify(defaultNotifications));

      showSaveMessage('Settings reset to defaults', true);
    }
  };

  const exportData = () => {
    const data = {
      settings,
      weatherNotifications,
      userProfile: {
        ...userProfile,
        avatarImage: userProfile.avatarImage ? '[Image Data]' : null
      },
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skycast-settings-${new Date().getTime()}.json`;
    link.click();
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h2>⚙️ Settings</h2>
          <p>Customize your SkyCast experience</p>
        </div>
        {saveMessage && (
          <div className={`save-message ${saveMessage.isSuccess ? 'success' : 'error'}`}>
            {saveMessage.isSuccess ? '✅' : '⚠️'} {saveMessage.text}
          </div>
        )}
      </div>

      <div className="settings-grid">
        {/* User Profile Section */}
        <div className="settings-section profile-section">
          <h3>👤 User Profile</h3>
          <div className="profile-card">
            <div className="avatar-selector">
              <div className="avatar-preview">
                {userProfile.avatarImage ? (
                  <img 
                    src={userProfile.avatarImage} 
                    alt="Profile" 
                    className="avatar-image"
                  />
                ) : (
                  <span className="avatar-emoji">{userProfile.avatar || '👤'}</span>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              
              <div className="avatar-actions">
                <button 
                  className="upload-btn"
                  onClick={handleUploadClick}
                  title="Upload your photo"
                >
                  📷 Upload Photo
                </button>
                
                {userProfile.avatarImage && (
                  <button 
                    className="remove-btn"
                    onClick={handleRemoveImage}
                    title="Remove photo"
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>
              
              {!userProfile.avatarImage && (
                <>
                  <div className="avatar-divider">
                    <span>or choose emoji</span>
                  </div>
                  <div className="avatar-options">
                    {['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🧙', '🦸'].map(avatar => (
                      <button
                        key={avatar}
                        className={`avatar-option ${userProfile.avatar === avatar && !userProfile.avatarImage ? 'selected' : ''}`}
                        onClick={() => handleProfileChange('avatar', avatar)}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="profile-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={userProfile.name || ''}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={userProfile.email || ''}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Default Location *</label>
                <input
                  type="text"
                  value={userProfile.location || ''}
                  onChange={(e) => handleProfileChange('location', e.target.value)}
                  placeholder="e.g., Nairobi, Kenya"
                  required
                />
              </div>

              <button 
                className="save-profile-btn"
                onClick={saveUserProfile}
                disabled={isSaving}
              >
                {isSaving ? '💾 Saving...' : '💾 Save Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Weather Preferences - Moved Up */}
        <div className="settings-section">
          <h3>🌤️ Weather Preferences</h3>
          <div className="preferences-grid">
            <div className="preference-item">
              <label>Units System</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="units"
                    checked={settings.units === 'metric'}
                    onChange={() => handleSettingChange('units', 'metric')}
                  />
                  <span className="radio-text">Metric (°C, km/h)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="units"
                    checked={settings.units === 'imperial'}
                    onChange={() => handleSettingChange('units', 'imperial')}
                  />
                  <span className="radio-text">Imperial (°F, mph)</span>
                </label>
              </div>
            </div>

            <div className="preference-item">
              <label>Time Format</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="timeFormat"
                    checked={settings.timeFormat === '24h'}
                    onChange={() => handleSettingChange('timeFormat', '24h')}
                  />
                  <span className="radio-text">24-hour</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="timeFormat"
                    checked={settings.timeFormat === '12h'}
                    onChange={() => handleSettingChange('timeFormat', '12h')}
                  />
                  <span className="radio-text">12-hour</span>
                </label>
              </div>
            </div>

            <div className="preference-item">
              <label>Auto-refresh Data</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  id="autoRefresh"
                />
                <label htmlFor="autoRefresh" className="toggle-slider"></label>
                <span className="toggle-text">
                  {settings.autoRefresh ? 'Enabled (every 15min)' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme & Appearance - Now Using Context */}
        <div className="settings-section">
          <h3>🎨 Theme & Appearance</h3>
          <div className="theme-selector">
            {[
              { id: 'light', name: 'Light', icon: '☀️', desc: 'Light mode' },
              { id: 'dark', name: 'Dark', icon: '🌙', desc: 'Dark mode' },
              { id: 'auto', name: 'Auto', icon: '🌓', desc: 'Follow system theme' }
            ].map(theme => (
              <div
                key={theme.id}
                className={`theme-option ${settings.theme === theme.id ? 'selected' : ''}`}
                onClick={() => handleSettingChange('theme', theme.id)}
              >
                <div className="theme-icon">{theme.icon}</div>
                <div className="theme-info">
                  <h4>{theme.name}</h4>
                  <p>{theme.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language - Now Using Context */}
        <div className="settings-section">
          <h3>🌐 Language</h3>
          <div className="language-selector">
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="language-select"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="sw">Kiswahili</option>
              <option value="ar">العربية</option>
              <option value="zh">中文</option>
            </select>
            <p className="language-note">Language preference saved locally</p>
          </div>
        </div>

        {/* Weather Notifications Section */}
        <div className="settings-section notification-section">
          <h3>🔔 Weather Notifications</h3>
          
          {notificationStatus && (
            <div className="notification-status">
              {notificationStatus}
            </div>
          )}

          <div className="notification-card">
            <div className="notification-permission">
              <div className="permission-info">
                <h4>Browser Notifications</h4>
                <p className="permission-status">
                  Status: 
                  <span className={`status-badge ${weatherNotifications.permission}`}>
                    {weatherNotifications.permission === 'granted' && '✅ Enabled'}
                    {weatherNotifications.permission === 'denied' && '❌ Blocked'}
                    {weatherNotifications.permission === 'default' && '⏸️ Not Set'}
                  </span>
                </p>
              </div>

              {weatherNotifications.permission !== 'granted' && (
                <button 
                  className="enable-notifications-btn"
                  onClick={requestNotificationPermission}
                >
                  🔔 Enable Notifications
                </button>
              )}
            </div>

            {weatherNotifications.permission === 'granted' && (
              <>
                <div className="notification-divider"></div>

                <div className="notification-control">
                  <div className="control-header">
                    <div className="control-info">
                      <h4>⏰ Periodic Weather Updates</h4>
                      <p>Get weather notifications at regular intervals</p>
                    </div>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={weatherNotifications.periodicUpdates}
                        onChange={(e) => togglePeriodicNotifications(e.target.checked)}
                        id="periodicUpdates"
                      />
                      <label htmlFor="periodicUpdates" className="toggle-slider"></label>
                    </div>
                  </div>

                  {weatherNotifications.periodicUpdates && (
                    <div className="interval-selector">
                      <label>Update Interval</label>
                      <select
                        value={weatherNotifications.updateInterval}
                        onChange={(e) => updateNotificationInterval(Number(e.target.value))}
                        className="interval-select"
                      >
                        <option value={15}>Every 15 minutes</option>
                        <option value={30}>Every 30 minutes</option>
                        <option value={60}>Every 1 hour</option>
                        <option value={120}>Every 2 hours</option>
                        <option value={180}>Every 3 hours</option>
                        <option value={360}>Every 6 hours</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="notification-divider"></div>

                <div className="notification-control">
                  <div className="control-header">
                    <div className="control-info">
                      <h4>⚡ Weather Change Alerts</h4>
                      <p>Get notified when weather changes significantly</p>
                    </div>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={weatherNotifications.changeAlerts}
                        onChange={(e) => toggleChangeAlerts(e.target.checked)}
                        id="changeAlerts"
                      />
                      <label htmlFor="changeAlerts" className="toggle-slider"></label>
                    </div>
                  </div>

                  {weatherNotifications.changeAlerts && (
                    <div className="alert-info">
                      <p>🌡️ Temperature changes ±2°C</p>
                      <p>💧 Precipitation changes ±20%</p>
                      <p>🌤️ Weather condition changes</p>
                      <p>💨 Wind speed changes ±15 km/h</p>
                    </div>
                  )}
                </div>

                <div className="notification-divider"></div>

                <div className="notification-test">
                  <button 
                    className="test-notification-btn"
                    onClick={sendTestNotification}
                  >
                    🧪 Send Test Notification
                  </button>
                  
                  {weatherNotifications.lastNotificationTime && (
                    <p className="last-notification">
                      Last notification: {new Date(weatherNotifications.lastNotificationTime).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="notification-help">
                  <p className="help-text">
                    💡 <strong>Tip:</strong> Keep this tab open in the background to receive notifications. 
                    For best results, set your default location in the profile section above.
                  </p>
                </div>
              </>
            )}

            {weatherNotifications.permission === 'denied' && (
              <div className="permission-denied-help">
                <p>❌ Notifications are blocked in your browser.</p>
                <p><strong>To enable:</strong></p>
                <ol>
                  <li>Click the lock icon 🔒 in your browser's address bar</li>
                  <li>Find "Notifications" and change to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* App Settings */}
        <div className="settings-section">
          <h3>📱 App Settings</h3>
          <div className="toggle-grid">
            <div className="toggle-item">
              <div className="toggle-info">
                <h4>Location Access</h4>
                <p>Allow automatic location detection</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.locationAccess}
                  onChange={(e) => handleSettingChange('locationAccess', e.target.checked)}
                  id="locationAccess"
                />
                <label htmlFor="locationAccess" className="toggle-slider"></label>
              </div>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <h4>Data Sharing</h4>
                <p>Share anonymous usage data to improve app</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.dataSharing}
                  onChange={(e) => handleSettingChange('dataSharing', e.target.checked)}
                  id="dataSharing"
                />
                <label htmlFor="dataSharing" className="toggle-slider"></label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button 
          className="action-btn primary-btn"
          onClick={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : '💾 Save All Settings'}
        </button>
        
        <button 
          className="action-btn secondary-btn"
          onClick={resetToDefaults}
        >
          🔄 Reset to Defaults
        </button>
        
        <button 
          className="action-btn export-btn"
          onClick={exportData}
        >
          📥 Export Settings
        </button>
      </div>

      {/* Advanced Settings */}
      <div className="advanced-settings">
        <h3>🔧 Advanced Settings</h3>
        <div className="advanced-grid">
          <div className="advanced-item">
            <h4>API Configuration</h4>
            <p>Configure weather data sources</p>
            <button className="advanced-action">Configure</button>
          </div>
          
          <div className="advanced-item">
            <h4>Cache Management</h4>
            <p>Clear cached weather data</p>
            <button className="advanced-action">Clear Cache</button>
          </div>
          
          <div className="advanced-item">
            <h4>Privacy Controls</h4>
            <p>Manage your privacy settings</p>
            <button className="advanced-action">Privacy</button>
          </div>
          
          <div className="advanced-item">
            <h4>Account Security</h4>
            <p>Change password & 2FA</p>
            <button className="advanced-action">Security</button>
          </div>
        </div>
      </div>

      {/* App Information */}
      <div className="app-info">
        <h3>ℹ️ App Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Version</span>
            <span className="info-value">2.1.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Updated</span>
            <span className="info-value">2024-12-01</span>
          </div>
          <div className="info-item">
            <span className="info-label">Data Provider</span>
            <span className="info-value">WeatherAPI.com</span>
          </div>
          <div className="info-item">
            <span className="info-label">Support</span>
            <span className="info-value">support@skycast.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;