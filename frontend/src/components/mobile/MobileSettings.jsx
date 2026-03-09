import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import { weatherAPI } from '../../scripts/weatherAPI';
import notificationManager from '../../scripts/notificationManager';
import { notify } from '../../events/notificationEvents';
import {
  IoPersonOutline,
  IoNotificationsOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoLocationOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline,
  IoLogOutOutline,
  IoChevronForwardOutline,
  IoCheckmark,
  IoSpeedometerOutline,
  IoLanguageOutline,
  IoCloudOutline,
  IoTrendingUpOutline,
  IoCameraOutline,
  IoTimeOutline
} from 'react-icons/io5';

const MobileSettings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState('');
  
  const [settings, setSettings] = useState({
    // Notifications
    notifications: true,
    weatherAlerts: true,
    dailyForecast: false,
    
    // Appearance
    darkMode: false,
    autoTheme: true,
    
    // Units
    celsius: true,
    metric: true,
    
    // Location
    autoLocation: true,
    
    // Language
    language: 'en',
    
    // Data & Privacy
    saveHistory: true,
    shareData: false,
  });

  // Browser notification permission state
  const [permissionStatus, setPermissionStatus] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    const user = authUtils.getUserData();
    setUserData(user);
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }

    // Load profile image
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }

    // Apply theme
    applyTheme(settings.darkMode);

    // Sync permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    // Cleanup on unmount
    return () => {
      // Only cleanup if notifications are disabled
      const currentSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
      if (!currentSettings.notifications) {
        notificationManager.cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showStatus = (message) => {
    setNotificationStatus(message);
    setTimeout(() => setNotificationStatus(''), 4000);
  };

  const handleToggle = (setting) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    setSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(newSettings));

    // Apply theme if dark mode changed
    if (setting === 'darkMode') {
      applyTheme(newSettings.darkMode);
    }
  };

  const applyTheme = (isDark) => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.background = '#0f0f1a';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.background = 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const handleLanguageChange = (e) => {
    const newSettings = {
      ...settings,
      language: e.target.value
    };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  // ========== NOTIFICATION HANDLERS ==========

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    try {
      const permission = await notificationManager.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        showStatus('✅ Browser notifications enabled!');
      } else if (permission === 'denied') {
        // Mobile browsers often deny — fall back to in-app
        showStatus('ℹ️ Using in-app notifications instead (normal on mobile).');
      } else {
        showStatus('⚠️ Permission not yet granted.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      showStatus('ℹ️ Using in-app notifications instead.');
    }
  };

  // Toggle push notifications — request permission + start/stop periodic updates
  const handleNotificationsToggle = async () => {
    const enabling = !settings.notifications;

    // Update state & save
    const newSettings = { ...settings, notifications: enabling };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));

    if (enabling) {
      // Request permission if not already granted
      if (permissionStatus !== 'granted') {
        await requestNotificationPermission();
      }

      if (notificationManager.isEnabled()) {
        const fetchWeather = async () => {
          try {
            const location = userData?.location || 'Nairobi';
            return await weatherAPI.getCurrentWeather(location);
          } catch (error) {
            console.error('Error fetching weather for notification:', error);
            return null;
          }
        };

        notificationManager.startPeriodicNotifications(fetchWeather, 60);
        showStatus('✅ Push notifications started (every 60 min)');
      } else {
        // Fallback: in-app notifications via event system
        notify.success(
          "You'll receive weather updates as in-app notifications. Tap 🔔 anytime for a quick update!",
          '🔔 Notifications Enabled'
        );
        showStatus('✅ In-app notifications enabled (mobile mode)');
      }
    } else {
      notificationManager.stopPeriodicNotifications();
      showStatus('⏸️ Push notifications stopped.');
    }
  };

  // Toggle weather alerts — start/stop change monitoring
  const handleWeatherAlertsToggle = async () => {
    const enabling = !settings.weatherAlerts;

    const newSettings = { ...settings, weatherAlerts: enabling };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));

    if (enabling) {
      if (permissionStatus !== 'granted') {
        await requestNotificationPermission();
      }

      if (notificationManager.isEnabled()) {
        const fetchWeather = async () => {
          try {
            const location = userData?.location || 'Nairobi';
            return await weatherAPI.getCurrentWeather(location);
          } catch (error) {
            console.error('Error fetching weather for alert:', error);
            return null;
          }
        };

        notificationManager.startChangeMonitoring(fetchWeather, 15);
        showStatus('✅ Weather alerts enabled (checking every 15 min)');
      } else {
        // Fallback for mobile
        notify.success(
          "Weather alerts active! You'll see alerts inside the app when conditions change.",
          '⚠️ Weather Alerts Enabled'
        );
        showStatus('✅ In-app weather alerts enabled (mobile mode)');
      }
    } else {
      notificationManager.stopChangeMonitoring();
      showStatus('⏸️ Weather alerts disabled.');
    }
  };

  // Toggle daily forecast — send a test notification immediately
  const handleDailyForecastToggle = async () => {
    const enabling = !settings.dailyForecast;

    const newSettings = { ...settings, dailyForecast: enabling };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));

    if (enabling) {
      if (permissionStatus !== 'granted') {
        await requestNotificationPermission();
      }

      if (notificationManager.isEnabled()) {
        // Send a test notification to confirm it works
        try {
          const location = userData?.location || 'Nairobi';
          const weatherData = await weatherAPI.getCurrentWeather(location);
          notificationManager.sendNotification(weatherData, 'update');
          showStatus('✅ Daily forecast enabled! Test notification sent.');
        } catch (error) {
          showStatus('✅ Daily forecast enabled.');
        }
      } else {
        notify.info(
          "Daily summaries will appear inside the app on mobile.",
          "📅 Daily Forecast Enabled"
        );
        showStatus('✅ In-app daily summaries enabled (mobile mode)');
      }
    } else {
      showStatus('⏸️ Daily forecast disabled.');
    }
  };

  // ========== END NOTIFICATION HANDLERS ==========

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setProfileImage(imageData);
        localStorage.setItem('profileImage', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      notificationManager.cleanup();
      authUtils.logout(navigate);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeProfileImage = () => {
    if (confirm('Remove profile picture?')) {
      setProfileImage(null);
      localStorage.removeItem('profileImage');
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'sw', name: 'Kiswahili' },
  ];

  return (
    <div className="mobile-settings">
      {/* Header */}
      <div className="mobile-settings-header">
        <h1 className="mobile-settings-title">Settings</h1>
        <p className="mobile-settings-subtitle">Manage your preferences</p>
      </div>

      {/* Content */}
      <div className="mobile-settings-content">
        
        {/* Profile Section */}
        <div className="mobile-settings-section">
          <h3 className="mobile-settings-section-title">
            <IoPersonOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Profile
          </h3>
          
          <div className="mobile-profile-card">
            <div className="mobile-profile-avatar-wrapper">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="mobile-profile-avatar-image" />
              ) : (
                <div className="mobile-profile-avatar">
                  {userData?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <button className="mobile-profile-camera-btn" onClick={triggerFileInput}>
                <IoCameraOutline />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
            <div className="mobile-profile-info">
              <div className="mobile-profile-name">{userData?.name || 'User'}</div>
              <div className="mobile-profile-email">{userData?.email || 'user@example.com'}</div>
              {profileImage && (
                <button className="mobile-remove-image-btn" onClick={removeProfileImage}>
                  Remove Picture
                </button>
              )}
            </div>
            <button className="mobile-profile-edit" aria-label="Edit profile">
              <IoChevronForwardOutline />
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="mobile-settings-section">
          <h3 className="mobile-settings-section-title">Appearance</h3>
          
          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoMoonOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Dark Mode
              </div>
              <div className="mobile-setting-description">
                Use dark theme
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>

          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoSunnyOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Auto Theme
              </div>
              <div className="mobile-setting-description">
                Match system theme
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.autoTheme}
                onChange={() => handleToggle('autoTheme')}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Units & Measurements */}
        <div className="mobile-settings-section">
          <h3 className="mobile-settings-section-title">
            <IoSpeedometerOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Units & Measurements
          </h3>
          
          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">Temperature Unit</div>
              <div className="mobile-setting-description">
                {settings.celsius ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.celsius}
                onChange={() => handleToggle('celsius')}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>

          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoTrendingUpOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Metric System
              </div>
              <div className="mobile-setting-description">
                Use metric units (km, m/s)
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.metric}
                onChange={() => handleToggle('metric')}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Language */}
        <div className="mobile-settings-section">
          <h3 className="mobile-settings-section-title">
            <IoLanguageOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Language
          </h3>
          
          <div className="mobile-setting-item mobile-setting-full">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">App Language</div>
              <select 
                className="mobile-setting-select"
                value={settings.language}
                onChange={handleLanguageChange}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mobile-settings-section">
          <h3 className="mobile-settings-section-title">
            <IoNotificationsOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Notifications
          </h3>

          {/* Permission status banner */}
          <div className="mobile-setting-item" style={{ 
            padding: '0.75rem 1rem', 
            background: permissionStatus === 'granted' ? '#e6ffed' : '#fff3e6',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            border: `1px solid ${permissionStatus === 'granted' ? '#48bb78' : '#ed8936'}`
          }}>
            <div className="mobile-setting-info">
              <div className="mobile-setting-label" style={{ fontSize: '0.85rem' }}>
                Browser Permission: 
                <span style={{ 
                  fontWeight: 600, 
                  marginLeft: '0.5rem',
                  color: permissionStatus === 'granted' ? '#38a169' : '#dd6b20'
                }}>
                  {permissionStatus === 'granted' && '✅ Enabled'}
                  {permissionStatus === 'denied' && '❌ Blocked'}
                  {permissionStatus === 'default' && '⏳ Not set'}
                </span>
              </div>
            </div>
            {permissionStatus !== 'granted' && (
              <button 
                onClick={requestNotificationPermission}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Enable
              </button>
            )}
          </div>

          {/* Notification status message */}
          {notificationStatus && (
            <div style={{
              padding: '0.5rem 1rem',
              background: '#667eea20',
              borderRadius: '6px',
              marginBottom: '0.5rem',
              fontSize: '0.85rem',
              textAlign: 'center',
              color: '#667eea',
              fontWeight: 500
            }}>
              {notificationStatus}
            </div>
          )}
          
          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">Push Notifications</div>
              <div className="mobile-setting-description">
                Receive weather updates every hour
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.notifications}
                onChange={handleNotificationsToggle}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>

          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoWarningOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Weather Alerts
              </div>
              <div className="mobile-setting-description">
                Get notified about severe weather changes
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.weatherAlerts}
                onChange={handleWeatherAlertsToggle}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>

          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoTimeOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Daily Forecast
              </div>
              <div className="mobile-setting-description">
                Receive daily weather summary
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.dailyForecast}
                onChange={handleDailyForecastToggle}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="mobile-settings-section">
          <h3 className="mobile-settings-section-title">
            <IoLocationOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Location
          </h3>
          
          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">Auto Location</div>
              <div className="mobile-setting-description">
                Detect location automatically
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.autoLocation}
                onChange={() => handleToggle('autoLocation')}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="mobile-settings-section">
          <h3 className="mobile-settings-section-title">
            <IoShieldCheckmarkOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Data & Privacy
          </h3>
          
          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoCloudOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Save History
              </div>
              <div className="mobile-setting-description">
                Store weather history locally
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.saveHistory}
                onChange={() => handleToggle('saveHistory')}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>

          <div className="mobile-setting-item">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">Share Usage Data</div>
              <div className="mobile-setting-description">
                Help improve the app
              </div>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                className="mobile-toggle-input"
                checked={settings.shareData}
                onChange={() => handleToggle('shareData')}
              />
              <span className="mobile-toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* About Section */}
        <div className="mobile-settings-section">
          <h3 className="mobile-settings-section-title">About</h3>
          
          <div className="mobile-setting-item mobile-setting-clickable">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoInformationCircleOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Version
              </div>
              <div className="mobile-setting-description">2.0.0</div>
            </div>
            <IoChevronForwardOutline className="mobile-setting-arrow" />
          </div>

          <div className="mobile-setting-item mobile-setting-clickable">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoShieldCheckmarkOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Privacy Policy
              </div>
            </div>
            <IoChevronForwardOutline className="mobile-setting-arrow" />
          </div>

          <div className="mobile-setting-item mobile-setting-clickable">
            <div className="mobile-setting-info">
              <div className="mobile-setting-label">
                <IoDocumentTextOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Terms of Service
              </div>
            </div>
            <IoChevronForwardOutline className="mobile-setting-arrow" />
          </div>
        </div>

        {/* Logout Button */}
        <div className="mobile-settings-section">
          <button className="mobile-logout-btn" onClick={handleLogout}>
            <IoLogOutOutline className="mobile-logout-icon" />
            <span>Logout</span>
          </button>
        </div>

        {/* Account Info */}
        <div className="mobile-account-info">
          <p>Logged in since: {new Date(userData?.loginTime).toLocaleDateString()}</p>
          <p>User ID: {userData?.id}</p>
        </div>
      </div>
    </div>
  );
};

export default MobileSettings;