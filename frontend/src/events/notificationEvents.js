// Notification Event System
// Use this for real-time events like weather alerts, notifications, etc.

import React from 'react';

const NOTIFICATION_EVENT = 'skycast-notification';
const WEATHER_UPDATE_EVENT = 'skycast-weather-update';

// Notification types
export const NotificationTypes = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  WEATHER_ALERT: 'weather-alert'
};

// Dispatch a notification event
export const dispatchNotification = (notification) => {
  const event = new CustomEvent(NOTIFICATION_EVENT, {
    detail: {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...notification
    }
  });
  window.dispatchEvent(event);
};

// Subscribe to notification events
export const subscribeToNotifications = (callback) => {
  const handler = (event) => callback(event.detail);
  window.addEventListener(NOTIFICATION_EVENT, handler);
  
  // Return unsubscribe function
  return () => window.removeEventListener(NOTIFICATION_EVENT, handler);
};

// Dispatch a weather update event
export const dispatchWeatherUpdate = (weatherData) => {
  const event = new CustomEvent(WEATHER_UPDATE_EVENT, {
    detail: {
      timestamp: new Date().toISOString(),
      ...weatherData
    }
  });
  window.dispatchEvent(event);
};

// Subscribe to weather update events
export const subscribeToWeatherUpdates = (callback) => {
  const handler = (event) => callback(event.detail);
  window.addEventListener(WEATHER_UPDATE_EVENT, handler);
  
  // Return unsubscribe function
  return () => window.removeEventListener(WEATHER_UPDATE_EVENT, handler);
};

// React hook for notifications
export const useNotificationListener = (callback) => {
  React.useEffect(() => {
    const unsubscribe = subscribeToNotifications(callback);
    return unsubscribe;
  }, [callback]);
};

// React hook for weather updates  
export const useWeatherUpdateListener = (callback) => {
  React.useEffect(() => {
    const unsubscribe = subscribeToWeatherUpdates(callback);
    return unsubscribe;
  }, [callback]);
};

// Helper to show common notifications
export const notify = {
  info: (message, title = 'Info') => 
    dispatchNotification({ type: NotificationTypes.INFO, title, message }),
  
  success: (message, title = 'Success') => 
    dispatchNotification({ type: NotificationTypes.SUCCESS, title, message }),
  
  warning: (message, title = 'Warning') => 
    dispatchNotification({ type: NotificationTypes.WARNING, title, message }),
  
  error: (message, title = 'Error') => 
    dispatchNotification({ type: NotificationTypes.ERROR, title, message }),
  
  weatherAlert: (message, severity = 'moderate') => 
    dispatchNotification({ 
      type: NotificationTypes.WEATHER_ALERT, 
      title: 'Weather Alert',
      message,
      severity 
    })
};

export default {
  dispatchNotification,
  subscribeToNotifications,
  dispatchWeatherUpdate,
  subscribeToWeatherUpdates,
  notify,
  NotificationTypes
};