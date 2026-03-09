/**
 * Weather Notification Manager
 * Handles browser notifications for weather updates and alerts
 * Enhanced with comprehensive debugging for mobile devices
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
    // Always refresh permission before checking
    this.refreshPermission();
    return 'Notification' in window && this.permission === 'granted';
  }

  /**
   * Refresh the permission state from the browser
   * @returns {string} Current permission status
   */
  refreshPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  // ============================================
  // DEBUGGING METHODS - START
  // ============================================

  /**
   * DEBUG: Get comprehensive notification status
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    // Always get fresh permission state
    const currentPermission = 'Notification' in window ? Notification.permission : 'not-supported';
    
    const debugInfo = {
      // Area 1: Permission State
      storedPermission: this.permission,
      currentPermission: currentPermission,
      permissionMismatch: this.permission !== currentPermission,
      
      // Area 2: Browser Support
      notificationAPIExists: 'Notification' in window,
      notificationConstructor: typeof Notification,
      
      // Area 3: HTTPS Check
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      
      // Area 4: Platform Detection
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
      isAndroid: /Android/.test(navigator.userAgent),
      isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      
      // Current State
      isEnabled: 'Notification' in window && this.permission === 'granted',
      hasActiveInterval: this.intervalId !== null,
      hasActiveMonitor: this.changeMonitorId !== null,
      
      // Timestamp
      checkedAt: new Date().toISOString()
    };
    
    console.log('🔍 Notification Debug Info:', debugInfo);
    return debugInfo;
  }

  /**
   * Check detailed browser support for notifications
   * @returns {Object} Support details
   */
  checkBrowserSupport() {
    const support = {
      hasNotificationAPI: 'Notification' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushManager: 'PushManager' in window,
      hasPermissionsAPI: 'permissions' in navigator,
      
      // Detailed checks
      canRequestPermission: false,
      canCreateNotification: false,
      
      // Error messages
      errors: []
    };
    
    // Check if we can request permission
    if (support.hasNotificationAPI) {
      try {
        support.canRequestPermission = typeof Notification.requestPermission === 'function';
      } catch (e) {
        support.errors.push(`requestPermission check failed: ${e.message}`);
      }
      
      // Check if we can create a notification (when permission is granted)
      if (this.permission === 'granted') {
        try {
          const testNotification = new Notification('Test', { silent: true });
          testNotification.close();
          support.canCreateNotification = true;
        } catch (e) {
          support.errors.push(`Notification creation failed: ${e.message}`);
          support.canCreateNotification = false;
        }
      }
    } else {
      support.errors.push('Notification API not available in window');
    }
    
    console.log('🌐 Browser Support:', support);
    return support;
  }

  /**
   * Check if the current context supports notifications (HTTPS/localhost)
   * @returns {Object} Security context details
   */
  checkSecureContext() {
    const context = {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isLocalhost: ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname),
      canUseNotifications: false,
      reason: ''
    };
    
    if (context.isSecureContext) {
      context.canUseNotifications = true;
      context.reason = 'Secure context (HTTPS or localhost)';
    } else if (context.protocol === 'https:') {
      context.canUseNotifications = true;
      context.reason = 'HTTPS protocol';
    } else if (context.isLocalhost) {
      context.canUseNotifications = true;
      context.reason = 'Localhost exception';
    } else {
      context.canUseNotifications = false;
      context.reason = 'NOT SECURE: Notifications require HTTPS. Current protocol: ' + context.protocol;
    }
    
    console.log('🔒 Security Context:', context);
    return context;
  }

  /**
   * Check iOS-specific limitations
   * @returns {Object} iOS support details
   */
  checkiOSSupport() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    
    // Try to detect iOS version
    let iosVersion = null;
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      iosVersion = parseFloat(`${match[1]}.${match[2]}`);
    }
    
    const iosSupport = {
      isIOS,
      isSafari,
      isStandalone,
      iosVersion,
      supportsNotifications: false,
      reason: '',
      instructions: []
    };
    
    if (!isIOS) {
      iosSupport.supportsNotifications = true;
      iosSupport.reason = 'Not iOS - standard notification support';
      return iosSupport;
    }
    
    // iOS-specific checks
    if (iosVersion && iosVersion < 16.4) {
      iosSupport.reason = `iOS ${iosVersion} does not support web notifications. Requires iOS 16.4+`;
      iosSupport.instructions = [
        '1. Update your iOS to version 16.4 or later',
        '2. Add this app to your home screen',
        '3. Open the app from your home screen'
      ];
    } else if (!isStandalone) {
      iosSupport.reason = 'iOS requires app to be added to home screen for notifications';
      iosSupport.instructions = [
        '1. Tap the Share button (📤) at the bottom of Safari',
        '2. Scroll down and tap "Add to Home Screen"',
        '3. Tap "Add" to confirm',
        '4. Open SKYCAST from your home screen',
        '5. Then enable notifications in settings'
      ];
    } else {
      iosSupport.supportsNotifications = true;
      iosSupport.reason = 'iOS 16.4+ in standalone mode - notifications should work';
    }
    
    console.log('📱 iOS Support:', iosSupport);
    return iosSupport;
  }

  /**
   * Run complete notification diagnostics
   * Call this from browser console: notificationManager.runDiagnostics()
   * @returns {Promise<Object>} Complete diagnostic report
   */
  async runDiagnostics() {
    console.log('🔬 Starting Notification Diagnostics...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: 'unknown',
      checks: {}
    };
    
    // 1. Permission State
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CHECK 1: Permission State');
    this.refreshPermission();
    report.checks.permission = {
      status: this.permission,
      isGranted: this.permission === 'granted',
      isDenied: this.permission === 'denied',
      isDefault: this.permission === 'default'
    };
    console.log(`   Status: ${this.permission}`);
    console.log(`   ✅ Granted: ${report.checks.permission.isGranted}`);
    
    // 2. Browser Support
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 CHECK 2: Browser Support');
    report.checks.browserSupport = this.checkBrowserSupport();
    console.log(`   Notification API: ${report.checks.browserSupport.hasNotificationAPI ? '✅' : '❌'}`);
    console.log(`   Service Worker: ${report.checks.browserSupport.hasServiceWorker ? '✅' : '❌'}`);
    
    // 3. HTTPS/Secure Context
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔒 CHECK 3: HTTPS/Secure Context');
    report.checks.secureContext = this.checkSecureContext();
    console.log(`   Secure: ${report.checks.secureContext.isSecureContext ? '✅' : '❌'}`);
    console.log(`   Protocol: ${report.checks.secureContext.protocol}`);
    console.log(`   Can Use: ${report.checks.secureContext.canUseNotifications ? '✅' : '❌'}`);
    
    // 4. iOS Limitations
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 CHECK 4: iOS/Mobile Limitations');
    report.checks.iosSupport = this.checkiOSSupport();
    if (report.checks.iosSupport.isIOS) {
      console.log(`   iOS Version: ${report.checks.iosSupport.iosVersion || 'Unknown'}`);
      console.log(`   Standalone Mode: ${report.checks.iosSupport.isStandalone ? '✅' : '❌'}`);
      console.log(`   Supports Notifications: ${report.checks.iosSupport.supportsNotifications ? '✅' : '❌'}`);
      if (report.checks.iosSupport.instructions.length > 0) {
        console.log(`   Instructions:`);
        report.checks.iosSupport.instructions.forEach(i => console.log(`     ${i}`));
      }
    } else {
      console.log('   Not iOS device');
    }
    
    // 5. Test Notification
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 CHECK 5: Test Notification');
    report.checks.testNotification = { attempted: false, success: false, error: null };
    
    if (this.isEnabled()) {
      try {
        report.checks.testNotification.attempted = true;
        const testNotif = new Notification('🧪 SKYCAST Test', {
          body: 'If you see this, notifications work!',
          icon: '🌤️',
          tag: 'diagnostic-test',
          requireInteraction: false
        });
        
        setTimeout(() => testNotif.close(), 5000);
        report.checks.testNotification.success = true;
        console.log('   ✅ Test notification sent successfully!');
      } catch (error) {
        report.checks.testNotification.error = error.message;
        console.log(`   ❌ Test notification failed: ${error.message}`);
      }
    } else {
      console.log('   ⏭️ Skipped - notifications not enabled');
    }
    
    // Overall Status
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 OVERALL STATUS');
    
    const issues = [];
    
    if (!report.checks.permission.isGranted) {
      issues.push('Permission not granted');
    }
    if (!report.checks.browserSupport.hasNotificationAPI) {
      issues.push('Notification API not supported');
    }
    if (!report.checks.secureContext.canUseNotifications) {
      issues.push('Not in secure context (HTTPS required)');
    }
    if (report.checks.iosSupport.isIOS && !report.checks.iosSupport.supportsNotifications) {
      issues.push('iOS limitation: ' + report.checks.iosSupport.reason);
    }
    
    if (issues.length === 0) {
      report.overallStatus = 'WORKING';
      console.log('   ✅ All checks passed! Notifications should work.');
    } else {
      report.overallStatus = 'ISSUES_FOUND';
      console.log('   ❌ Issues found:');
      issues.forEach(issue => console.log(`      • ${issue}`));
    }
    
    report.issues = issues;
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Full report available in return value');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return report;
  }

  // ============================================
  // DEBUGGING METHODS - END
  // ============================================

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
   * @returns {boolean} Whether the notification was sent successfully
   */
  sendNotification(rawWeatherData, type = 'update') {
    // Refresh permission before sending
    this.refreshPermission();
    
    if (!this.isEnabled()) {
      console.warn('Notifications not enabled');
      
      // Log detailed reason for debugging
      const debugInfo = this.getDebugInfo();
      if (debugInfo.isIOS && !debugInfo.isStandalone) {
        console.warn('📱 iOS detected: App must be added to home screen for notifications');
      }
      if (!debugInfo.isSecureContext) {
        console.warn('🔒 Not in secure context: HTTPS required for notifications');
      }
      
      return false;
    }

    // Normalize the weather data first
    const weatherData = this.normalizeWeatherData(rawWeatherData);
    
    if (!weatherData) {
      console.error('Invalid weather data for notification');
      return false;
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
      return true;
      
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Provide more context on the error
      if (error.name === 'TypeError') {
        console.error('💡 This may be a browser compatibility issue. Run runDiagnostics() for details.');
      }
      
      return false;
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

    // Check if notifications can work before starting
    const iosCheck = this.checkiOSSupport();
    if (iosCheck.isIOS && !iosCheck.supportsNotifications) {
      console.warn('📱 Cannot start periodic notifications:', iosCheck.reason);
      console.warn('Instructions:', iosCheck.instructions.join(' → '));
      return false;
    }

    const sendUpdate = async () => {
      try {
        // Refresh permission before each send (in case it changed)
        this.refreshPermission();
        
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
    return true;
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

    // Check if notifications can work before starting
    const iosCheck = this.checkiOSSupport();
    if (iosCheck.isIOS && !iosCheck.supportsNotifications) {
      console.warn('📱 Cannot start change monitoring:', iosCheck.reason);
      return false;
    }

    const checkForChanges = async () => {
      try {
        // Refresh permission before each check
        this.refreshPermission();
        
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
    return true;
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