/**
 * Weather Notification Manager
 * Handles browser notifications for weather updates and alerts
 */

class NotificationManager {
  constructor() {
    this.permission = 'Notification' in window ? Notification.permission : 'denied';
    this.intervalId = null;
    this.changeMonitorId = null;
    this.lastWeatherData = null;
  }

  /**
   * Request notification permission from user
   * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
   */
  async requestPermission() {
    if (!('Notification' in window)) {
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
   * Normalize weather data from various sources to a consistent format
   * @param {Object} rawData - Raw weather data from API
   * @returns {Object} Normalized weather data
   */
  normalizeWeatherData(rawData) {
    if (!rawData) return null;

    // Extract city name
    const city = rawData.city || rawData.name || rawData.location?.name || 'Unknown Location';
    
    // Extract country
    const country = rawData.country || rawData.sys?.country || rawData.location?.country || '';

    // Extract temperature (handle various formats)
    let temperature = '--';
    if (typeof rawData.temperature === 'number') {
      temperature = Math.round(rawData.temperature);
    } else if (typeof rawData.temp === 'number') {
      temperature = Math.round(rawData.temp);
    } else if (rawData.main?.temp !== undefined) {
      temperature = Math.round(rawData.main.temp);
    } else if (rawData.current?.temp !== undefined) {
      temperature = Math.round(rawData.current.temp);
    }

    // Extract feels like temperature
    let feelsLike = null;
    if (typeof rawData.feelsLike === 'number') {
      feelsLike = Math.round(rawData.feelsLike);
    } else if (typeof rawData.feels_like === 'number') {
      feelsLike = Math.round(rawData.feels_like);
    } else if (rawData.main?.feels_like !== undefined) {
      feelsLike = Math.round(rawData.main.feels_like);
    }

    // Extract condition/description
    let condition = 'Unknown';
    if (typeof rawData.condition === 'string') {
      condition = rawData.condition;
    } else if (rawData.weather?.[0]?.description) {
      condition = rawData.weather[0].description;
    } else if (rawData.weather?.[0]?.main) {
      condition = rawData.weather[0].main;
    } else if (rawData.current?.condition?.text) {
      condition = rawData.current.condition.text;
    }

    // Extract wind speed (handle object or number)
    let windSpeed = null;
    if (typeof rawData.windSpeed === 'number') {
      windSpeed = Math.round(rawData.windSpeed * 10) / 10;
    } else if (typeof rawData.wind === 'number') {
      windSpeed = Math.round(rawData.wind * 10) / 10;
    } else if (typeof rawData.wind === 'object' && rawData.wind?.speed !== undefined) {
      // wind is an object with speed property (OpenWeatherMap format)
      windSpeed = Math.round(rawData.wind.speed * 10) / 10;
    } else if (rawData.main?.wind !== undefined) {
      windSpeed = Math.round(rawData.main.wind * 10) / 10;
    } else if (rawData.current?.wind_kph !== undefined) {
      windSpeed = Math.round(rawData.current.wind_kph * 10) / 10;
    }

    // Extract humidity
    let humidity = null;
    if (typeof rawData.humidity === 'number') {
      humidity = Math.round(rawData.humidity);
    } else if (rawData.main?.humidity !== undefined) {
      humidity = Math.round(rawData.main.humidity);
    } else if (rawData.current?.humidity !== undefined) {
      humidity = Math.round(rawData.current.humidity);
    }

    // Extract precipitation
    let precipitation = null;
    if (typeof rawData.precipitation === 'number') {
      precipitation = Math.round(rawData.precipitation);
    } else if (rawData.rain?.['1h'] !== undefined) {
      precipitation = Math.round(rawData.rain['1h']);
    } else if (rawData.pop !== undefined) {
      precipitation = Math.round(rawData.pop * 100);
    }

    // Extract pressure
    let pressure = null;
    if (typeof rawData.pressure === 'number') {
      pressure = Math.round(rawData.pressure);
    } else if (rawData.main?.pressure !== undefined) {
      pressure = Math.round(rawData.main.pressure);
    }

    // Extract UV index
    let uvIndex = null;
    if (rawData.uvIndex !== undefined) {
      uvIndex = rawData.uvIndex;
    } else if (rawData.uvi !== undefined) {
      uvIndex = rawData.uvi;
    } else if (rawData.current?.uv !== undefined) {
      uvIndex = rawData.current.uv;
    }

    return {
      city,
      country,
      temperature,
      feelsLike,
      condition,
      windSpeed,
      humidity,
      precipitation,
      pressure,
      uvIndex,
      timestamp: Date.now()
    };
  }

  /**
   * Send a weather notification
   * @param {Object} rawWeatherData - Weather data object from API
   * @param {string} type - Notification type: 'update', 'change', or 'test'
   */
  sendNotification(rawWeatherData, type = 'update') {
    if (!this.isEnabled()) {
      console.warn('Notifications not enabled');
      return;
    }

    // Normalize the weather data first
    const weatherData = this.normalizeWeatherData(rawWeatherData);
    
    if (!weatherData) {
      console.error('Invalid weather data for notification');
      return;
    }

    const { city } = weatherData;
    
    const titles = {
      update: `🌤️ Weather Update - ${city}`,
      change: `⚠️ Weather Alert - ${city}`,
      test: `🧪 Test Notification - ${city}`
    };

    const body = this.formatNotificationBody(weatherData);
    const icon = this.getWeatherIcon(weatherData.condition);

    const options = {
      body,
      icon,
      badge: icon,
      tag: `weather-notification-${type}`,
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
      
      console.log(`✅ Notification sent: ${type} for ${city}`);
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Format weather data into notification body text
   * @param {Object} weatherData - Normalized weather data
   * @returns {string}
   */
  formatNotificationBody(weatherData) {
    const { temperature, condition, precipitation, windSpeed, feelsLike, humidity } = weatherData;
    
    let lines = [];
    
    // Main temperature and condition
    lines.push(`${temperature}°C - ${condition}`);
    
    // Feels like (if significantly different)
    if (feelsLike !== null && Math.abs(feelsLike - temperature) > 2) {
      lines.push(`🌡️ Feels like ${feelsLike}°C`);
    }
    
    // Humidity
    if (humidity !== null) {
      lines.push(`💧 Humidity: ${humidity}%`);
    }
    
    // Wind speed
    if (windSpeed !== null) {
      lines.push(`💨 Wind: ${windSpeed} km/h`);
    }
    
    // Precipitation
    if (precipitation !== null && precipitation > 0) {
      lines.push(`🌧️ Precipitation: ${precipitation}%`);
    }
    
    return lines.join('\n');
  }

  /**
   * Get weather icon based on condition
   * @param {string} condition - Weather condition
   * @returns {string} Icon emoji
   */
  getWeatherIcon(condition) {
    const conditionLower = (condition || '').toLowerCase();
    
    // Map weather conditions to emoji/icons
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) {
      return '🌧️';
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return '⛈️';
    } else if (conditionLower.includes('snow') || conditionLower.includes('sleet')) {
      return '❄️';
    } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
      return '☁️';
    } else if (conditionLower.includes('partly') || conditionLower.includes('few clouds')) {
      return '⛅';
    } else if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
      return '☀️';
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) {
      return '🌫️';
    } else if (conditionLower.includes('wind')) {
      return '💨';
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
    
    console.log(`📢 Periodic notifications started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop periodic notifications
   */
  stopPeriodicNotifications() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Periodic notifications stopped');
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
        const rawWeatherData = await fetchWeatherFn();
        const weatherData = this.normalizeWeatherData(rawWeatherData);
        
        if (weatherData && this.lastWeatherData) {
          const changes = this.detectSignificantChanges(this.lastWeatherData, weatherData);
          
          if (changes.length > 0) {
            console.log('⚠️ Significant weather changes detected:', changes);
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
    
    console.log(`👁️ Weather change monitoring started (checking every ${checkIntervalMinutes} minutes)`);
  }

  /**
   * Stop monitoring weather changes
   */
  stopChangeMonitoring() {
    if (this.changeMonitorId) {
      clearInterval(this.changeMonitorId);
      this.changeMonitorId = null;
      this.lastWeatherData = null;
      console.log('⏹️ Weather change monitoring stopped');
    }
  }

  /**
   * Detect significant changes between two weather states
   * @param {Object} oldData - Previous weather data (normalized)
   * @param {Object} newData - Current weather data (normalized)
   * @returns {Array<string>} Array of change descriptions
   */
  detectSignificantChanges(oldData, newData) {
    const changes = [];

    // Temperature change > 3°C
    if (typeof oldData.temperature === 'number' && typeof newData.temperature === 'number') {
      const tempDiff = Math.abs(newData.temperature - oldData.temperature);
      if (tempDiff >= 3) {
        const direction = newData.temperature > oldData.temperature ? 'increased' : 'decreased';
        changes.push(`Temperature ${direction} by ${tempDiff}°C`);
      }
    }

    // Precipitation change > 20%
    if (oldData.precipitation !== null && newData.precipitation !== null) {
      const precipDiff = Math.abs(newData.precipitation - oldData.precipitation);
      if (precipDiff >= 20) {
        changes.push(`Precipitation changed by ${precipDiff}%`);
      }
    }

    // Condition change (significant)
    if (oldData.condition && newData.condition && oldData.condition !== newData.condition) {
      const significantConditions = ['rain', 'storm', 'snow', 'thunder', 'clear', 'sunny'];
      const oldLower = oldData.condition.toLowerCase();
      const newLower = newData.condition.toLowerCase();
      
      for (const cond of significantConditions) {
        if ((oldLower.includes(cond) && !newLower.includes(cond)) ||
            (!oldLower.includes(cond) && newLower.includes(cond))) {
          changes.push(`Weather changed from "${oldData.condition}" to "${newData.condition}"`);
          break;
        }
      }
    }

    // Wind speed change > 15 km/h
    if (oldData.windSpeed !== null && newData.windSpeed !== null) {
      const windDiff = Math.abs(newData.windSpeed - oldData.windSpeed);
      if (windDiff >= 15) {
        changes.push(`Wind speed changed by ${Math.round(windDiff)} km/h`);
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