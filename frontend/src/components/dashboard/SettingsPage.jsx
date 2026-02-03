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
    isInitialized,
    getTempUnit,
    getSpeedUnit
  } = useSettings();

  // Local state for notification-specific settings
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
    setHasUnsavedChanges(true);
  };

  const handleNotificationSettingChange = (key, value) => {
    setWeatherNotifications(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Handle profile change - updates context immediately
  const handleProfileChange = (key, value) => {
    updateUserProfile({ [key]: value });
    setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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

  // Toggle periodic notifications
  const togglePeriodicNotifications = async (enabled) => {
    handleNotificationSettingChange('periodicUpdates', enabled);

    if (enabled && notificationManager.isEnabled()) {
      const location = userProfile.location || 'Nairobi';
      const interval = weatherNotifications.updateInterval;

      const fetchWeather = async () => {
        try {
          return await weatherAPI.getCurrentWeather(location);
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

  // Toggle change alerts
  const toggleChangeAlerts = async (enabled) => {
    handleNotificationSettingChange('changeAlerts', enabled);

    if (enabled && notificationManager.isEnabled()) {
      const location = userProfile.location || 'Nairobi';

      const fetchWeather = async () => {
        try {
          return await weatherAPI.getCurrentWeather(location);
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

  // Save all settings
  const saveAllSettings = async () => {
    // Validate email if provided
    if (userProfile.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userProfile.email)) {
        showSaveMessage('Please enter a valid email address', false);
        return;
      }
    }

    setIsSaving(true);
    
    try {
      // Save notification settings to localStorage
      localStorage.setItem('weatherNotifications', JSON.stringify(weatherNotifications));
      
      // Simulate save delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setHasUnsavedChanges(false);
      showSaveMessage('All settings saved successfully!', true);
    } catch (error) {
      console.error('Error saving settings:', error);
      showSaveMessage('Error saving settings. Please try again.', false);
    } finally {
      setIsSaving(false);
    }
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
        permission: Notification.permission || 'default',
        periodicUpdates: false,
        updateInterval: 60,
        changeAlerts: false,
        lastNotificationTime: null
      };
      setWeatherNotifications(defaultNotifications);
      localStorage.setItem('weatherNotifications', JSON.stringify(defaultNotifications));

      setHasUnsavedChanges(false);
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
    URL.revokeObjectURL(url);
  };

  const clearCache = () => {
    localStorage.removeItem('weatherCache');
    showSaveMessage('Cache cleared!', true);
  };

  // Get current units for display
  const tempUnit = getTempUnit();
  const speedUnit = getSpeedUnit();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h2>⚙️ Settings</h2>
          <p>Customize your SkyCast experience</p>
        </div>
        <div className="header-actions">
          {hasUnsavedChanges && (
            <span className="unsaved-indicator" style={{
              color: '#ed8936',
              fontWeight: '600',
              fontSize: '0.9rem',
              padding: '0.5rem 1rem',
              background: 'rgba(237, 137, 54, 0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(237, 137, 54, 0.3)'
            }}>
              ● Unsaved changes
            </span>
          )}
          {saveMessage && (
            <div className={`save-message ${saveMessage.isSuccess ? 'success' : 'error'}`}>
              {saveMessage.isSuccess ? '✅' : '⚠️'} {saveMessage.text}
            </div>
          )}
        </div>
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
                <label>Name</label>
                <input
                  type="text"
                  value={userProfile.name || ''}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={userProfile.email || ''}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="form-group">
                <label>Default Location</label>
                <input
                  type="text"
                  value={userProfile.location || ''}
                  onChange={(e) => handleProfileChange('location', e.target.value)}
                  placeholder="e.g., Nairobi, Kenya"
                />
                <p className="form-hint" style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Used for weather notifications and default forecasts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Preferences */}
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
              <p className="preference-note" style={{
                fontSize: '0.85rem',
                color: '#718096',
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '6px',
                borderLeft: '3px solid #667eea'
              }}>
                Currently using: {tempUnit} for temperature, {speedUnit} for wind speed
              </p>
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

        {/* Theme & Appearance */}
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

        {/* Language */}
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
                      <p>🌡️ Temperature changes ±3{tempUnit}</p>
                      <p>💧 Precipitation changes ±20%</p>
                      <p>🌤️ Weather condition changes</p>
                      <p>💨 Wind speed changes ±15 {speedUnit}</p>
                    </div>
                  )}
                </div>

                <div className="notification-divider"></div>

                <div className="notification-help">
                  <p className="help-text">
                    💡 <strong>Tip:</strong> Keep this tab open in the background to receive notifications. 
                    For best results, set your default location in the profile section above.
                  </p>
                  {weatherNotifications.lastNotificationTime && (
                    <p className="last-notification" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#718096' }}>
                      Last notification: {new Date(weatherNotifications.lastNotificationTime).toLocaleString()}
                    </p>
                  )}
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

      {/* Action Buttons - With Inline Styles for Visibility */}
      <div 
        className="settings-actions"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-card, #f0f4f8)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <button 
          type="button"
          onClick={saveAllSettings}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '10px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            minWidth: '180px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            opacity: isSaving ? 0.7 : 1,
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!isSaving) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          {isSaving ? '⏳ Saving...' : '💾 Save Changes'}
        </button>
        
        <button 
          type="button"
          onClick={resetToDefaults}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '10px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            background: 'transparent',
            color: '#e53e3e',
            border: '2px solid #e53e3e',
            minWidth: '180px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!isSaving) {
              e.currentTarget.style.background = '#e53e3e';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#e53e3e';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🔄 Reset to Defaults
        </button>
        
        <button 
          type="button"
          onClick={exportData}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '10px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            background: 'transparent',
            color: '#38a169',
            border: '2px solid #38a169',
            minWidth: '180px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!isSaving) {
              e.currentTarget.style.background = '#38a169';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#38a169';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
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
            <button className="advanced-action" onClick={clearCache}>
              Clear Cache
            </button>
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
            <span className="info-value">Open-Meteo API</span>
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