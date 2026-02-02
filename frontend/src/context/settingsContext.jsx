import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

const defaultSettings = {
  units: 'metric',
  theme: 'auto',
  notifications: true,
  locationAccess: true,
  dataSharing: false,
  autoRefresh: true,
  language: 'en',
  timeFormat: '24h'
};

const defaultUserProfile = {
  name: '',
  email: '',
  location: '',
  avatar: '👤',
  avatarImage: null
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('weatherAppSettings');
    const savedProfile = localStorage.getItem('userProfile');
    
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to parse saved profile:', e);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((theme) => {
    let effectiveTheme = theme;
    
    if (theme === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(effectiveTheme);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (isInitialized) {
      applyTheme(settings.theme);
    }
  }, [settings.theme, isInitialized, applyTheme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('auto');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme, applyTheme]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('weatherAppSettings', JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
    }
  }, [settings, isInitialized]);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: userProfile }));
    }
  }, [userProfile, isInitialized]);

  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update multiple settings at once
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Update user profile
  const updateUserProfile = useCallback((updates) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  }, []);

  // Temperature conversion utilities
  const convertTemperature = useCallback((value, fromUnit = 'celsius') => {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    
    const isMetric = settings.units === 'metric';
    
    if (fromUnit === 'celsius') {
      return isMetric ? Math.round(value) : Math.round((value * 9/5) + 32);
    } else if (fromUnit === 'fahrenheit') {
      return isMetric ? Math.round((value - 32) * 5/9) : Math.round(value);
    }
    return Math.round(value);
  }, [settings.units]);

  const getTempUnit = useCallback(() => {
    return settings.units === 'metric' ? '°C' : '°F';
  }, [settings.units]);

  // Speed conversion utilities
  const convertSpeed = useCallback((value, fromUnit = 'ms') => {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    
    const isMetric = settings.units === 'metric';
    
    // Convert from source unit to m/s first, then to target
    let valueInMs = value;
    if (fromUnit === 'kmh') {
      valueInMs = value / 3.6;
    } else if (fromUnit === 'mph') {
      valueInMs = value * 0.44704;
    }
    
    // Convert to target unit
    if (isMetric) {
      return (valueInMs * 3.6).toFixed(1); // km/h
    } else {
      return (valueInMs * 2.237).toFixed(1); // mph
    }
  }, [settings.units]);

  const getSpeedUnit = useCallback(() => {
    return settings.units === 'metric' ? 'km/h' : 'mph';
  }, [settings.units]);

  // Format time based on user preference
  const formatTime = useCallback((date) => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.timeFormat === '12h'
    });
  }, [settings.timeFormat]);

  const value = {
    settings,
    userProfile,
    isInitialized,
    updateSetting,
    updateSettings,
    updateUserProfile,
    convertTemperature,
    getTempUnit,
    convertSpeed,
    getSpeedUnit,
    formatTime,
    // Convenience accessors
    theme: settings.theme,
    units: settings.units,
    isMetric: settings.units === 'metric'
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;