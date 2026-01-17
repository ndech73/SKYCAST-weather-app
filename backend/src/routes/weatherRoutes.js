import { Router } from 'express';
import weatherController from '../controllers/weatherController.js';
import axios from 'axios';

const router = Router();

const OWM_KEY = process.env.WEATHER_API_KEY;

// AQI Label Helper
const aqiLabel = (val) => {
  switch (Number(val)) {
    case 1: return "Good";
    case 2: return "Fair";
    case 3: return "Moderate";
    case 4: return "Poor";
    case 5: return "Very Poor";
    default: return "Unknown";
  }
};

// =====================================================
// TILE URL ROUTE - For weather map overlays
// Must be FIRST before other routes
// =====================================================
router.get('/tile-url', (req, res) => {
  console.log('🗺️ Tile URL route hit');
  const { layer } = req.query;

  // Check if API key exists
  if (!OWM_KEY) {
    return res.status(500).json({
      success: false,
      error: 'OpenWeatherMap API key not configured on server'
    });
  }

  // Check if layer parameter is provided
  if (!layer) {
    return res.status(400).json({
      success: false,
      error: 'Layer parameter is required'
    });
  }

  // Valid OpenWeatherMap tile layers
  const validLayers = [
    'clouds_new',
    'precipitation_new',
    'temp_new',
    'wind_new',
    'pressure_new',
  ];

  if (!validLayers.includes(layer)) {
    return res.status(400).json({
      success: false,
      error: `Invalid layer. Valid layers are: ${validLayers.join(', ')}`
    });
  }

  // Construct the OpenWeatherMap tile URL - NO SPACE before appid!
  const url = `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${OWM_KEY}`;

  console.log('✅ Returning tile URL for layer:', layer);
  res.json({
    success: true,
    url,
    layer,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// WEATHER BY COORDINATES - For radar page
// =====================================================
router.get('/', async (req, res) => {
  console.log('📍 Weather root route hit');
  console.log('Query params:', req.query);

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "lat and lon query parameters required",
      received: req.query
    });
  }

  // Validate coordinates
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      success: false,
      error: "Invalid coordinates. lat and lon must be numbers."
    });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      error: "Coordinates out of range. lat: -90 to 90, lon: -180 to 180"
    });
  }

  try {
    console.log('🔑 Using API Key:', OWM_KEY ? 'Present' : 'Missing');
    
    // Fetch current weather
    const { data: weather } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=en&appid=${OWM_KEY}`
    );

    // Fetch air quality
    const { data: aq } = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${OWM_KEY}`
    );
    const air = aq?.list?.[0];

    // Construct response
    res.json({
      success: true,
      coord: weather.coord,
      location: {
        country: weather.sys?.country || "Unknown",
        name: weather.name || "Unknown Location"
      },
      temp: Math.round(weather.main?.temp),
      feels_like: Math.round(weather.main?.feels_like),
      temp_min: Math.round(weather.main?.temp_min),
      temp_max: Math.round(weather.main?.temp_max),
      humidity: weather.main?.humidity,
      pressure: weather.main?.pressure,
      wind: weather.wind?.speed,
      wind_deg: weather.wind?.deg,
      wind_gust: weather.wind?.gust || 0,
      cloud: weather.clouds?.all,
      visibility: weather.visibility,
      rain: weather.rain?.['1h'] ?? 0,
      snow: weather.snow?.['1h'] ?? 0,
      weather: {
        main: weather.weather?.[0]?.main,
        description: weather.weather?.[0]?.description,
        icon: weather.weather?.[0]?.icon
      },
      aqi: air?.main?.aqi || null,
      aqi_label: aqiLabel(air?.main?.aqi),
      aqi_components: air?.components || null,
      sunrise: weather.sys?.sunrise,
      sunset: weather.sys?.sunset,
      timezone: weather.timezone,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Weather fetch error:", err);
    console.error("Full error details:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: "Weather service failure",
      details: err.response?.data || err.message
    });
  }
});

// =====================================================
// FORECAST BY COORDINATES
// =====================================================
router.get('/forecast-coords', async (req, res) => {
  console.log('📅 Forecast by coordinates route hit');
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "lat and lon query parameters required"
    });
  }

  try {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=${OWM_KEY}`
    );

    // Process forecast data
    const forecast = data.list.map(item => ({
      dt: item.dt,
      dt_txt: item.dt_txt,
      temp: Math.round(item.main.temp),
      feels_like: Math.round(item.main.feels_like),
      temp_min: Math.round(item.main.temp_min),
      temp_max: Math.round(item.main.temp_max),
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      weather: {
        main: item.weather?.[0]?.main,
        description: item.weather?.[0]?.description,
        icon: item.weather?.[0]?.icon
      },
      wind: item.wind?.speed,
      wind_deg: item.wind?.deg,
      cloud: item.clouds?.all,
      rain: item.rain?.['3h'] ?? 0,
      snow: item.snow?.['3h'] ?? 0,
      visibility: item.visibility,
      pop: item.pop
    }));

    res.json({
      success: true,
      location: {
        name: data.city?.name,
        country: data.city?.country,
        coord: data.city?.coord
      },
      forecast,
      count: forecast.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Forecast fetch error:", err.message);
    res.status(500).json({
      success: false,
      error: "Forecast service failure",
      details: err.message
    });
  }
});

// =====================================================
// UV INDEX BY COORDINATES
// =====================================================
router.get('/uv', async (req, res) => {
  console.log('☀️ UV Index route hit');
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "lat and lon query parameters required"
    });
  }

  try {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`
    );

    // UV Index categories
    const getUVCategory = (uvi) => {
      if (uvi <= 2) return { level: 'Low', color: '#3EA72D', advice: 'No protection required' };
      if (uvi <= 5) return { level: 'Moderate', color: '#FFF300', advice: 'Wear sunscreen' };
      if (uvi <= 7) return { level: 'High', color: '#F18B00', advice: 'Reduce sun exposure' };
      if (uvi <= 10) return { level: 'Very High', color: '#E53210', advice: 'Extra protection needed' };
      return { level: 'Extreme', color: '#B567A4', advice: 'Avoid sun exposure' };
    };

    res.json({
      success: true,
      location: {
        name: data.name,
        country: data.sys?.country,
        coord: data.coord
      },
      uv_info: getUVCategory(5),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("UV Index fetch error:", err.message);
    res.status(500).json({
      success: false,
      error: "UV Index service failure",
      details: err.message
    });
  }
});

// =====================================================
// WEATHER ALERTS
// =====================================================
router.get('/alerts', async (req, res) => {
  console.log('⚠️ Weather alerts route hit');
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "lat and lon query parameters required"
    });
  }

  try {
    res.json({
      success: true,
      coord: { lat: parseFloat(lat), lon: parseFloat(lon) },
      alerts: [],
      message: "Weather alerts require OpenWeatherMap One Call API 3.0 subscription",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Weather alerts fetch error:", err.message);
    res.status(500).json({
      success: false,
      error: "Weather alerts service failure",
      details: err.message
    });
  }
});

// =====================================================
// LAYER INFO - Get information about available layers
// =====================================================
router.get('/layers', (req, res) => {
  console.log('📋 Layers info route hit');

  const layers = [
    {
      key: 'temp_new',
      name: 'Temperature',
      icon: '🌡️',
      unit: 'Celsius (°C)',
      description: 'Shows temperature distribution across the globe',
      legend: [
        { color: '#821692', value: '-40°C', label: 'Extreme Cold' },
        { color: '#0000CD', value: '-30°C', label: 'Severe Cold' },
        { color: '#1E90FF', value: '-20°C', label: 'Very Cold' },
        { color: '#00BFFF', value: '-10°C', label: 'Cold' },
        { color: '#00FFFF', value: '0°C', label: 'Freezing' },
        { color: '#7FFF00', value: '10°C', label: 'Cool' },
        { color: '#ADFF2F', value: '15°C', label: 'Mild' },
        { color: '#FFFF00', value: '20°C', label: 'Warm' },
        { color: '#FFD700', value: '25°C', label: 'Pleasant' },
        { color: '#FFA500', value: '30°C', label: 'Hot' },
        { color: '#FF4500', value: '35°C', label: 'Very Hot' },
        { color: '#DC143C', value: '40°C', label: 'Extreme Heat' },
        { color: '#8B0000', value: '50°C+', label: 'Dangerous Heat' }
      ]
    },
    {
      key: 'clouds_new',
      name: 'Cloud Cover',
      icon: '☁️',
      unit: 'Percentage (%)',
      description: 'Shows cloud coverage across the globe',
      legend: [
        { color: 'rgba(255,255,255,0)', value: '0%', label: 'Clear Sky' },
        { color: 'rgba(255,255,255,0.2)', value: '10%', label: 'Mostly Clear' },
        { color: 'rgba(255,255,255,0.35)', value: '25%', label: 'Partly Cloudy' },
        { color: 'rgba(255,255,255,0.5)', value: '50%', label: 'Cloudy' },
        { color: 'rgba(255,255,255,0.7)', value: '75%', label: 'Mostly Cloudy' },
        { color: 'rgba(255,255,255,0.85)', value: '90%', label: 'Overcast' },
        { color: 'rgba(255,255,255,1)', value: '100%', label: 'Complete Cover' }
      ]
    },
    {
      key: 'precipitation_new',
      name: 'Precipitation',
      icon: '🌧️',
      unit: 'mm/h',
      description: 'Shows rainfall and precipitation intensity',
      legend: [
        { color: 'rgba(225,200,100,0)', value: '0', label: 'No Rain' },
        { color: '#00E400', value: '0.1', label: 'Light Drizzle' },
        { color: '#A8E05F', value: '0.5', label: 'Light Rain' },
        { color: '#FFFF00', value: '1', label: 'Moderate Rain' },
        { color: '#FFBF00', value: '2', label: 'Rain' },
        { color: '#FF8000', value: '4', label: 'Heavy Rain' },
        { color: '#FF0000', value: '8', label: 'Very Heavy Rain' },
        { color: '#BF0000', value: '14', label: 'Intense Rain' },
        { color: '#800080', value: '20', label: 'Extreme Rain' },
        { color: '#4B0082', value: '40+', label: 'Torrential' }
      ]
    },
    {
      key: 'wind_new',
      name: 'Wind Speed',
      icon: '💨',
      unit: 'm/s',
      description: 'Shows wind speed distribution',
      legend: [
        { color: 'rgba(255,255,255,0)', value: '0', label: 'Calm' },
        { color: '#AEF1F9', value: '1', label: 'Light Air' },
        { color: '#96F7DC', value: '5', label: 'Light Breeze' },
        { color: '#96F7B4', value: '10', label: 'Gentle Breeze' },
        { color: '#6FF46F', value: '15', label: 'Moderate Breeze' },
        { color: '#73ED12', value: '20', label: 'Fresh Breeze' },
        { color: '#A4ED12', value: '25', label: 'Strong Breeze' },
        { color: '#DAED12', value: '30', label: 'Near Gale' },
        { color: '#EDC212', value: '40', label: 'Gale' },
        { color: '#ED8F12', value: '50', label: 'Strong Gale' },
        { color: '#ED6312', value: '60', label: 'Storm' },
        { color: '#ED2912', value: '80', label: 'Violent Storm' },
        { color: '#D5102D', value: '100+', label: 'Hurricane Force' }
      ]
    },
    {
      key: 'pressure_new',
      name: 'Sea Level Pressure',
      icon: '🌀',
      unit: 'hPa',
      description: 'Shows atmospheric pressure at sea level',
      legend: [
        { color: '#0000CD', value: '940', label: 'Very Low (Storm)' },
        { color: '#1E90FF', value: '960', label: 'Low Pressure' },
        { color: '#00BFFF', value: '980', label: 'Below Normal' },
        { color: '#87CEEB', value: '1000', label: 'Normal Low' },
        { color: '#98FB98', value: '1010', label: 'Normal' },
        { color: '#ADFF2F', value: '1020', label: 'Normal High' },
        { color: '#FFFF00', value: '1030', label: 'Above Normal' },
        { color: '#FFA500', value: '1040', label: 'High Pressure' },
        { color: '#FF4500', value: '1050+', label: 'Very High' }
      ]
    }
  ];

  res.json({
    success: true,
    layers,
    count: layers.length,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// EXISTING ROUTES - City-based weather
// =====================================================
router.get('/current/:city?', weatherController.getCurrentWeather);
router.get('/forecast/:city?', weatherController.getForecast);
router.get('/multiple', weatherController.getMultipleCities);
router.get('/grid', weatherController.getGlobalGrid);
router.get('/by-ip', weatherController.getWeatherByIP);
router.get('/historical/:city', weatherController.getHistoricalWeather);

export default router;