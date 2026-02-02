/**
 * Weather Notification Manager
 * Handles browser notifications for weather updates and alerts
 */

class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.intervalId = null;
    this. changeMonitorId = null;
    this.lastWeatherData = null;
  }

  /**
   * Request notification permission from user
   * @returns {Promise<string>} Permission status:  'granted', 'denied', or 'default'
   */
  async requestPermission() {
    if (! ('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are supported and permitted
   * @returns {boolean}
   */
  isEnabled() {
    return 'Notification' in window && this.permission === 'granted';
  }

  /**
   * Send a weather notification
   * @param {Object} weatherData - Weather data object from API
   * @param {string} type - Notification type:  'update' or 'change'
   */
  sendNotification(weatherData, type = 'update') {
    if (!this.isEnabled()) {
      console.warn('Notifications not enabled');
      return;
    }

    const { city, temperature, condition, precipitation, wind } = weatherData;
    
    const titles = {
      update: `🌤️ Weather Update - ${city}`,
      change: `⚠️ Weather Alert - ${city}`,
      test: `🧪 Test Notification - ${city}`
    };

    const body = this.formatNotificationBody(weatherData);
    const icon = this.getWeatherIcon(condition);

    const options = {
      body,
      icon,
      badge: icon,
      tag: 'weather-notification',
      requireInteraction: false,
      silent: false,
      timestamp: Date.now(),
      data: { city, type }
    };

    try {
      const notification = new Notification(titles[type] || titles.update, options);
      
      // Focus app when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Format weather data into notification body text
   * @param {Object} weatherData
   * @returns {string}
   */
  formatNotificationBody(weatherData) {
    const { temperature, condition, precipitation, wind, feelsLike } = weatherData;
    
    let body = `${temperature}°C - ${condition}`;
    
    if (feelsLike && Math.abs(feelsLike - temperature) > 2) {
      body += ` (Feels like ${feelsLike}°C)`;
    }
    
    if (precipitation !== undefined && precipitation > 0) {
      body += `\n💧 Precipitation: ${precipitation}%`;
    }
    
    if (wind !== undefined) {
      body += `\n💨 Wind: ${wind} km/h`;
    }
    
    return body;
  }

  /**
   * Get weather icon based on condition
   * @param {string} condition - Weather condition
   * @returns {string} Icon URL
   */
  getWeatherIcon(condition) {
    const conditionLower = condition?. toLowerCase() || '';
    
    // Map weather conditions to emoji/icons
    if (conditionLower. includes('rain') || conditionLower.includes('drizzle')) {
      return '🌧️';
    } else if (conditionLower.includes('cloud')) {
      return '☁️';
    } else if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
      return '☀️';
    } else if (conditionLower.includes('snow')) {
      return '❄️';
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return '⛈️';
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
      return '🌫️';
    }
    
    return '🌤️'; // Default
  }

  /**
   * Start periodic weather notifications
   * @param {Function} fetchWeatherFn - Function that fetches weather data
   * @param {number} intervalMinutes - Interval in minutes
   */
  startPeriodicNotifications(fetchWeatherFn, intervalMinutes = 60) {
    this.stopPeriodicNotifications(); // Clear any existing interval

    const sendUpdate = async () => {
      try {
        const weatherData = await fetchWeatherFn();
        if (weatherData) {
          this.sendNotification(weatherData, 'update');
        }
      } catch (error) {
        console.error('Error fetching weather for notification:', error);
      }
    };

    // Send immediately, then on interval
    sendUpdate();
    this.intervalId = setInterval(sendUpdate, intervalMinutes * 60 * 1000);
    
    console.log(`Periodic notifications started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop periodic notifications
   */
  stopPeriodicNotifications() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Periodic notifications stopped');
    }
  }

  /**
   * Start monitoring for significant weather changes
   * @param {Function} fetchWeatherFn - Function that fetches weather data
   * @param {number} checkIntervalMinutes - How often to check (default: 15 min)
   */
  startChangeMonitoring(fetchWeatherFn, checkIntervalMinutes = 15) {
    this.stopChangeMonitoring(); // Clear any existing monitor

    const checkForChanges = async () => {
      try {
        const weatherData = await fetchWeatherFn();
        
        if (weatherData && this.lastWeatherData) {
          const changes = this.detectSignificantChanges(this.lastWeatherData, weatherData);
          
          if (changes.length > 0) {
            console.log('Significant weather changes detected:', changes);
            this.sendNotification(weatherData, 'change');
          }
        }
        
        this.lastWeatherData = weatherData;
      } catch (error) {
        console.error('Error checking weather changes:', error);
      }
    };

    // Initial check
    checkForChanges();
    this.changeMonitorId = setInterval(checkForChanges, checkIntervalMinutes * 60 * 1000);
    
    console.log(`Weather change monitoring started (checking every ${checkIntervalMinutes} minutes)`);
  }

  /**
   * Stop monitoring weather changes
   */
  stopChangeMonitoring() {
    if (this.changeMonitorId) {
      clearInterval(this. changeMonitorId);
      this.changeMonitorId = null;
      this.lastWeatherData = null;
      console.log('Weather change monitoring stopped');
    }
  }

  /**
   * Detect significant changes between two weather states
   * @param {Object} oldData - Previous weather data
   * @param {Object} newData - Current weather data
   * @returns {Array<string>} Array of change descriptions
   */
  detectSignificantChanges(oldData, newData) {
    const changes = [];

    // Temperature change > 2°C
    const tempDiff = Math.abs(newData.temperature - oldData.temperature);
    if (tempDiff >= 2) {
      changes.push(`Temperature ${newData.temperature > oldData.temperature ? 'increased' : 'decreased'} by ${tempDiff. toFixed(1)}°C`);
    }

    // Precipitation change > 20%
    if (oldData.precipitation !== undefined && newData.precipitation !== undefined) {
      const precipDiff = Math.abs(newData.precipitation - oldData.precipitation);
      if (precipDiff >= 20) {
        changes.push(`Precipitation changed by ${precipDiff.toFixed(0)}%`);
      }
    }

    // Condition change
    if (oldData.condition !== newData.condition) {
      changes.push(`Condition changed from ${oldData.condition} to ${newData.condition}`);
    }

    // Wind speed change > 15 km/h
    if (oldData.wind !== undefined && newData.wind !== undefined) {
      const windDiff = Math. abs(newData.wind - oldData.wind);
      if (windDiff >= 15) {
        changes.push(`Wind speed changed by ${windDiff.toFixed(0)} km/h`);
      }
    }

    return changes;
  }

  /**
   * Clean up all intervals and monitoring
   */
  cleanup() {
    this.stopPeriodicNotifications();
    this.stopChangeMonitoring();
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
export default notificationManager;