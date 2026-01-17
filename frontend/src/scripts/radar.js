// radarLogic.js - Ventusky-style weather logic - FIXED

export const radarLogic = {
  // Weather layers configuration (matches Ventusky)
  weatherLayers: [
    { id: 'temperature', name: 'Temperature', icon: '🌡️', unit: '°C', color: '#ff6b6b' },
    { id: 'precipitation', name: 'Precipitation', icon: '🌧️', unit: 'mm', color: '#4d96ff' },
    { id: 'radar', name: 'Radar', icon: '📡', unit: '', color: '#6bc46c' },
    { id: 'satellite', name: 'Satellite', icon: '🛰️', unit: '', color: '#333333' },
    { id: 'clouds', name: 'Clouds', icon: '☁️', unit: '%', color: '#a4b0be' },
    { id: 'wind', name: 'Wind Speed', icon: '💨', unit: 'km/h', color: '#78e08f' },
    { id: 'pressure', name: 'Air Pressure', icon: '📊', unit: 'hPa', color: '#e55039' },
    { id: 'humidity', name: 'Humidity', icon: '💧', unit: '%', color: '#3498db' },
    { id: 'thunderstorms', name: 'Thunderstorms', icon: '⚡', unit: '', color: '#f1c40f' },
    { id: 'snow', name: 'Snow Cover', icon: '❄️', unit: 'cm', color: '#74b9ff' },
    { id: 'airquality', name: 'Air Quality', icon: '🌫️', unit: 'AQI', color: '#95a5a6' },
  ],

  // Get tile URL for a specific layer
  getTileUrl(layerId) {
    // Using free tile sources
    const layerMap = {
      temperature: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      precipitation: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      clouds: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      wind: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      pressure: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      radar: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      humidity: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      thunderstorms: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      snow: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      airquality: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      default: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    };
    
    return layerMap[layerId] || layerMap.default;
  },

  // Get attribution for a layer
  getAttribution(layerId) {
    const attributions = {
      satellite: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      default: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    };
    
    return attributions[layerId] || attributions.default;
  },

  // Time slots for 24-hour timeline (like Ventusky)
  getTimeSlots() {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return `${hour}:00`;
    });
  },

  // Get time markers for display
  getTimeMarkers() {
    return ['00:00', '06:00', '12:00', '18:00', '23:00'];
  },

  // Sample weather data for major cities (for demo)
  getSampleWeatherData() {
    return [
      { 
        lat: 40.7128, 
        lng: -74.0060, 
        name: 'New York', 
        temp: 22, 
        humidity: 65, 
        pressure: 1013,
        windSpeed: 12,
        condition: 'Partly Cloudy'
      },
      { 
        lat: 51.5074, 
        lng: -0.1278, 
        name: 'London', 
        temp: 15, 
        humidity: 70, 
        pressure: 1015,
        windSpeed: 18,
        condition: 'Cloudy'
      },
      { 
        lat: 35.6762, 
        lng: 139.6503, 
        name: 'Tokyo', 
        temp: 18, 
        humidity: 55, 
        pressure: 1012,
        windSpeed: 10,
        condition: 'Sunny'
      },
      { 
        lat: -33.8688, 
        lng: 151.2093, 
        name: 'Sydney', 
        temp: 25, 
        humidity: 60, 
        pressure: 1014,
        windSpeed: 15,
        condition: 'Clear'
      },
      {
        lat: -1.2921,
        lng: 36.8219,
        name: 'Nairobi',
        temp: 24,
        humidity: 58,
        pressure: 1011,
        windSpeed: 14,
        condition: 'Sunny'
      }
    ];
  },

  // Initialize map state with default values
  initializeMapState() {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    
    return {
      activeLayer: 'temperature',
      isPlaying: false,
      currentTime: `${currentHour}:00`,
      selectedDate: now.toISOString().split('T')[0],
      mapCenter: [-1.2921, 36.8219], // Nairobi
      mapZoom: 10,
      opacity: 100,
      altitude: '7m',
      animationSpeed: 'normal',
      showGrid: false,
      showCities: true
    };
  },

  // Get layer info by ID
  getLayerById(layerId) {
    return this.weatherLayers.find(layer => layer.id === layerId) || this.weatherLayers[0];
  },

  // Format date for display (like Ventusky)
  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  },

  // Get color for temperature value (for legend)
  getTemperatureColor(temp) {
    if (temp < -20) return '#2E86C1';
    if (temp < -10) return '#3498DB';
    if (temp < 0) return '#5DADE2';
    if (temp < 10) return '#85C1E9';
    if (temp < 20) return '#F4D03F';
    if (temp < 30) return '#EB984E';
    return '#E74C3C';
  },

  // Get color for precipitation value (for legend)
  getPrecipitationColor(amount) {
    if (amount === 0) return '#E8F4F8';
    if (amount < 2.5) return '#A5D8DD';
    if (amount < 7.5) return '#4A90E2';
    if (amount < 15) return '#2C3E50';
    return '#1B2631';
  },

  // Convert wind speed to Beaufort scale
  getWindDescription(speedKmh) {
    if (speedKmh < 1) return 'Calm';
    if (speedKmh < 6) return 'Light Air';
    if (speedKmh < 12) return 'Light Breeze';
    if (speedKmh < 20) return 'Gentle Breeze';
    if (speedKmh < 29) return 'Moderate Breeze';
    if (speedKmh < 39) return 'Fresh Breeze';
    if (speedKmh < 50) return 'Strong Breeze';
    if (speedKmh < 62) return 'Near Gale';
    if (speedKmh < 75) return 'Gale';
    if (speedKmh < 89) return 'Strong Gale';
    if (speedKmh < 103) return 'Storm';
    return 'Violent Storm';
  },

  // Calculate feels-like temperature
  calculateFeelsLike(temp, humidity, windSpeed) {
    // Simplified wind chill/heat index calculation
    if (temp <= 10 && windSpeed > 5) {
      // Wind chill approximation
      return Math.round(13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16));
    } else if (temp >= 27) {
      // Heat index approximation
      return Math.round(temp + 0.5 * (humidity / 100) * (temp - 20));
    }
    return temp;
  }
};

export default radarLogic;