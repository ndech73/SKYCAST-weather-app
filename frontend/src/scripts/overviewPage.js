import { weatherAPI } from './weatherAPI';

export const overviewLogic = {
  // Initial state
  initialState: {
    weatherData: null,
    forecastData: null,
    hourlyData: [],
    loading: true,
    error: null,
    currentLocation: 'Nairobi',
    selectedHour: null,
    currentTime: new Date()
  },

  // Fetch all data for overview
  async fetchAllData(location) {
    try {
      const [current, forecast] = await Promise.all([
        weatherAPI.getCurrentWeather(location),
        weatherAPI.getForecast(location)
      ]);
      
      const hourly = this.generateHourlyData(current, forecast);
      const selectedHour = this.getCurrentHour(hourly);
      
      return {
        weatherData: current,
        forecastData: forecast,
        hourlyData: hourly,
        current,
        forecast,
        hourly,
        selectedHour,
        error: null
      };
    } catch (error) {
      console.error('Overview fetch error:', error);
      return this.getFallbackData(location);
    }
  },

  // Generate hourly forecast data
  generateHourlyData(currentWeather, forecast) {
    const hourly = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      const hourData = this.createHourData(hour, i, currentWeather, forecast);
      hourly.push(hourData);
    }
    
    return hourly;
  },

  // Create data for a specific hour
  createHourData(hour, index, currentWeather, forecast) {
    const hourDate = new Date();
    hourDate.setHours(hour);
    
    const baseTemp = currentWeather?.temperature || 24;
    const hourTemp = this.calculateHourTemperature(baseTemp, index);
    
    const { condition, icon } = this.getHourCondition(hour, index);
    
    return {
      hour,
      time: hourDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      displayHour: this.formatHourDisplay(hour),
      temperature: Math.round(hourTemp),
      condition,
      icon,
      precipitation: this.calculatePrecipitationChance(hour),
      humidity: this.calculateHumidity(index, currentWeather?.humidity),
      windSpeed: this.calculateWindSpeed(index, currentWeather?.windSpeed),
      feelsLike: Math.round(hourTemp + Math.sin(index * Math.PI / 8)),
      uvIndex: this.calculateUVIndex(hour)
    };
  },

  // Calculate temperature for hour
  calculateHourTemperature(baseTemp, index) {
    return baseTemp + Math.sin(index * Math.PI / 12) * 3;
  },

  // Get weather condition for hour
  getHourCondition(hour, index) {
    if (hour >= 6 && hour < 18) {
      return {
        condition: hour < 12 ? 'Partly Cloudy' : 'Sunny',
        icon: hour < 12 ? '⛅' : '☀️'
      };
    } else {
      return {
        condition: hour < 21 ? 'Clear' : 'Mostly Clear',
        icon: hour < 21 ? '🌙' : '✨'
      };
    }
  },

  // Format hour for display
  formatHourDisplay(hour) {
    return hour === 0 ? '12 AM' : 
           hour === 12 ? '12 PM' : 
           hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  },

  // Calculate precipitation chance
  calculatePrecipitationChance(hour) {
    return hour >= 3 && hour <= 6 ? 30 : 0;
  },

  // Calculate humidity
  calculateHumidity(index, baseHumidity = 50) {
    return baseHumidity + Math.sin(index * Math.PI / 8) * 20;
  },

  // Calculate wind speed
  calculateWindSpeed(index, baseSpeed = 5) {
    return baseSpeed + Math.cos(index * Math.PI / 6) * 10;
  },

  // Calculate UV index
  calculateUVIndex(hour) {
    return hour >= 10 && hour <= 16 ? Math.floor(Math.random() * 8) + 3 : 0;
  },

  // Get current hour from hourly data
  getCurrentHour(hourlyData) {
    const currentHour = new Date().getHours();
    return hourlyData.find(hour => hour.hour === currentHour) || hourlyData[0];
  },

  // Fallback data when API fails
  getFallbackData(location) {
    const current = weatherAPI.getMockCurrentWeather(location);
    const forecast = weatherAPI.getMockForecast(location);
    const hourly = this.generateMockHourlyData(current);
    const selectedHour = this.getCurrentHour(hourly);
    
    return {
      weatherData: current,
      forecastData: forecast,
      hourlyData: hourly,
      selectedHour,
      error: 'Using demo data. Real data unavailable.'
    };
  },

  // Generate mock hourly data
  generateMockHourlyData(currentWeather) {
    const hourly = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      const hourDate = new Date(now);
      hourDate.setHours(hour);
      
      const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Clear'];
      const icons = ['☀️', '⛅', '☁️', '🌙'];
      const conditionIndex = i % 4;
      
      hourly.push({
        hour,
        time: hourDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        displayHour: this.formatHourDisplay(hour),
        temperature: 20 + Math.sin(i * Math.PI / 12) * 5,
        condition: conditions[conditionIndex],
        icon: icons[conditionIndex],
        precipitation: Math.random() * 40,
        humidity: 40 + Math.sin(i * Math.PI / 8) * 30,
        windSpeed: 3 + Math.cos(i * Math.PI / 6) * 8,
        feelsLike: 20 + Math.sin(i * Math.PI / 12) * 6,
        uvIndex: hour >= 10 && hour <= 16 ? Math.floor(Math.random() * 8) + 3 : 0
      });
    }
    
    return hourly;
  },

  // Weather metrics helpers
  getWeatherMetrics(weatherData) {
    return {
      humidity: { 
        value: `${weatherData?.humidity || '--'}%`, 
        icon: '💧', 
        label: 'Humidity' 
      },
      windSpeed: { 
        value: `${Math.round(weatherData?.windSpeed || 0)} km/h`, 
        icon: '💨', 
        label: 'Wind Speed' 
      },
      pressure: { 
        value: `${weatherData?.pressure || '--'} hPa`, 
        icon: '🌡️', 
        label: 'Pressure' 
      },
      uvIndex: { 
        value: weatherData?.uvIndex || '--', 
        icon: '👁️', 
        label: 'UV Index',
        level: this.getUVLevel(weatherData?.uvIndex)
      }
    };
  },

  // Get UV level description
  getUVLevel(uvIndex) {
    if (!uvIndex || uvIndex === '--') return '--';
    if (uvIndex <= 2) return 'Low';
    if (uvIndex <= 5) return 'Moderate';
    if (uvIndex <= 7) return 'High';
    if (uvIndex <= 10) return 'Very High';
    return 'Extreme';
  },

  // Get temperature color for visualization
  getTemperatureColor(temp) {
    if (temp <= 10) return '#4299e1'; // Cold - blue
    if (temp <= 20) return '#48bb78'; // Cool - green
    if (temp <= 30) return '#ed8936'; // Warm - orange
    return '#f56565'; // Hot - red
  },

  // Get weather icon based on condition
  getWeatherIcon(condition) {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain')) return '🌧️';
    if (conditionLower.includes('storm')) return '⛈️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
    return '🌤️';
  },

  // Get features for the features grid
  getFeatures() {
    return [
      { 
        id: 'moon-phase', 
        icon: '🌕', 
        title: 'Moon Phase', 
        desc: this.getMoonPhase(),
        extra: this.getMoonEmoji()
      },
      { 
        id: 'micro-climate', 
        icon: '📡', 
        title: 'Micro-climate', 
        desc: 'Local station data' 
      },
      { 
        id: 'weather-memory', 
        icon: '🧠', 
        title: 'Weather Memory', 
        desc: '7-day analysis' 
      },
      { 
        id: 'home-widget', 
        icon: '📱', 
        title: 'Home Widget', 
        desc: 'PWA widget active' 
      }
    ];
  },

  // Get moon phase
  getMoonPhase() {
    const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    const day = new Date().getDate();
    return phases[day % 8];
  },

  // Get moon emoji
  getMoonEmoji() {
    const phase = this.getMoonPhase();
    const emojis = {
      'New Moon': '🌑',
      'Waxing Crescent': '🌒',
      'First Quarter': '🌓',
      'Waxing Gibbous': '🌔',
      'Full Moon': '🌕',
      'Waning Gibbous': '🌖',
      'Last Quarter': '🌗',
      'Waning Crescent': '🌘'
    };
    return emojis[phase] || '🌙';
  },

  // Calculate temperature trend for chart
  calculateTemperatureTrend(hourlyData) {
    if (!hourlyData || hourlyData.length < 2) return hourlyData;
    
    const maxTemp = Math.max(...hourlyData.map(h => h.temperature));
    const minTemp = Math.min(...hourlyData.map(h => h.temperature));
    const range = maxTemp - minTemp;
    
    return hourlyData.map(hour => ({
      ...hour,
      chartHeight: range > 0 ? ((hour.temperature - minTemp) / range) * 100 : 50
    }));
  },

  // Get forecast for next 5 days
  getFiveDayForecast(forecastData) {
    if (!forecastData?.forecast) return [];
    
    return forecastData.forecast.slice(0, 5).map((day, index) => ({
      day: new Date(Date.now() + index * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      temperature: Math.round(day.temperature),
      condition: day.condition,
      icon: this.getWeatherIcon(day.condition)
    }));
  },

  // Handle location change
  async handleLocationChange(location, setState) {
    setState(prev => ({ ...prev, loading: true, currentLocation: location }));
    
    setTimeout(async () => {
      const data = await this.fetchAllData(location);
      setState(prev => ({
        ...prev,
        ...data,
        loading: false
      }));
    }, 500);
  },

  // Handle hour selection
  handleHourSelect(hourData, setState) {
    setState(prev => ({ ...prev, selectedHour: hourData }));
  },

  // Handle refresh
  async handleRefresh(state, setState) {
    setState(prev => ({ ...prev, loading: true }));
    
    const data = await this.fetchAllData(state.currentLocation);
    setState(prev => ({
      ...prev,
      ...data,
      loading: false,
      currentTime: new Date()
    }));
  }
};