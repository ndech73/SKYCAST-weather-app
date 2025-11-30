import express from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Validate API key exists
if (!API_KEY) {
  throw new Error('WEATHER_API_KEY environment variable is required');
}

// Create axios instance with better defaults
const weatherClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Increased to 10 seconds
  headers: {
    'Accept': 'application/json',
  }
});

// Add response interceptor for better error handling
weatherClient.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Request timeout - OpenWeatherMap API took too long');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 DNS lookup failed - check internet connection');
    }
    return Promise.reject(error);
  }
);

// Rate limiting middleware - 100 requests per 15 minutes per IP
const weatherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    success: false, 
    error: 'Too many requests, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced city validation middleware
const validateCity = (req, res, next) => {
  const { city } = req.params;
  
  // Check existence and type
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'City parameter is required and must be a string' 
    });
  }
  
  const trimmedCity = city.trim();
  
  // Check length (1-100 characters)
  if (trimmedCity.length === 0 || trimmedCity.length > 100) {
    return res.status(400).json({ 
      success: false,
      error: 'City name must be between 1 and 100 characters' 
    });
  }
  
  // Allow only letters, spaces, hyphens, apostrophes, and common diacritics
  const cityRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!cityRegex.test(trimmedCity)) {
    return res.status(400).json({ 
      success: false,
      error: 'City name contains invalid characters' 
    });
  }
  
  // Store sanitized city for use in route
  req.sanitizedCity = trimmedCity;
  next();
};

// Custom validation for search (allows shorter queries)
const validateSearchQuery = (req, res, next) => {
  const { query } = req.params;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'Search query is required and must be a string' 
    });
  }
  
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length < 2 || trimmedQuery.length > 50) {
    return res.status(400).json({ 
      success: false,
      error: 'Search query must be between 2 and 50 characters' 
    });
  }
  
  req.sanitizedQuery = trimmedQuery;
  next();
};

// Sanitize error messages to avoid information disclosure
const sanitizeError = (error) => {
  if (error.code === 'ECONNABORTED') {
    return { status: 504, message: 'Weather service timeout. Please try again.' };
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    return { status: 503, message: 'Unable to reach weather service. Check your connection.' };
  }
  
  if (error.response) {
    const status = error.response.status;
    
    // Map specific error codes to user-friendly messages
    switch (status) {
      case 404:
        return { status: 404, message: 'City not found. Please check the spelling.' };
      case 401:
        return { status: 500, message: 'Service temporarily unavailable.' };
      case 429:
        return { status: 429, message: 'Too many requests. Please try again later.' };
      default:
        return { status: 500, message: 'Unable to fetch weather data.' };
    }
  }
  
  // Don't expose internal errors
  return { status: 500, message: 'Internal server error.' };
};

// Filter response to only include needed data
const filterWeatherData = (data) => {
  if (!data) return null;
  
  return {
    name: data.name,
    main: {
      temp: data.main?.temp,
      feels_like: data.main?.feels_like,
      humidity: data.main?.humidity,
      pressure: data.main?.pressure,
    },
    weather: data.weather?.map(w => ({
      description: w.description,
      icon: w.icon,
      main: w.main
    })),
    wind: {
      speed: data.wind?.speed
    },
    sys: {
      country: data.sys?.country
    }
  };
};

const filterForecastData = (data) => {
  if (!data) return null;
  
  return {
    city: {
      name: data.city?.name,
      country: data.city?.country
    },
    list: data.list?.map(item => ({
      dt: item.dt,
      main: {
        temp: item.main?.temp,
        temp_min: item.main?.temp_min,
        temp_max: item.main?.temp_max,
        humidity: item.main?.humidity
      },
      weather: item.weather?.map(w => ({
        description: w.description,
        icon: w.icon,
        main: w.main
      }))
    }))
  };
};

// Apply rate limiting to all routes
router.use(weatherLimiter);

// Get current weather
router.get('/current/:city', validateCity, async (req, res) => {
  try {
    const city = req.sanitizedCity;
    
    console.log(`🌤️  Weather request for city: ${city}`);
    
    const response = await weatherClient.get('/weather', {
      params: {
        q: city,
        units: 'metric',
        appid: API_KEY
      }
    });
    
    const filteredData = filterWeatherData(response.data);
    
    console.log(`✅ Weather data received for: ${city}`);
    
    res.json({
      success: true,
      data: filteredData
    });
    
  } catch (error) {
    // Log error securely (without exposing API keys or sensitive data)
    console.error('❌ Weather API error:', {
      city: req.sanitizedCity,
      status: error.response?.status,
      code: error.code,
      message: error.message
    });
    
    const { status, message } = sanitizeError(error);
    res.status(status).json({
      success: false,
      error: message
    });
  }
});

// Get 5-day forecast
router.get('/forecast/:city', validateCity, async (req, res) => {
  try {
    const city = req.sanitizedCity;
    
    console.log(`🌤️  Forecast request for city: ${city}`);
    
    const response = await weatherClient.get('/forecast', {
      params: {
        q: city,
        units: 'metric',
        appid: API_KEY
      }
    });
    
    const filteredData = filterForecastData(response.data);
    
    console.log(`✅ Forecast data received for: ${city}`);
    
    res.json({
      success: true,
      data: filteredData
    });
    
  } catch (error) {
    console.error('❌ Forecast API error:', {
      city: req.sanitizedCity,
      status: error.response?.status,
      code: error.code,
      message: error.message
    });
    
    const { status, message } = sanitizeError(error);
    res.status(status).json({
      success: false,
      error: message
    });
  }
});

// Search multiple cities
router.get('/search/:query', validateSearchQuery, async (req, res) => {
  try {
    const query = req.sanitizedQuery;
    
    console.log(`🔍 Search request for: ${query}`);
    
    const response = await weatherClient.get('/find', {
      params: {
        q: query,
        type: 'like',
        sort: 'population',
        cnt: 5,
        units: 'metric',
        appid: API_KEY
      }
    });
    
    // Filter search results
    const filteredResults = {
      count: response.data.count,
      list: response.data.list?.map(item => filterWeatherData(item))
    };
    
    console.log(`✅ Search results received: ${filteredResults.count} cities`);
    
    res.json({
      success: true,
      data: filteredResults
    });
    
  } catch (error) {
    console.error('❌ Search API error:', {
      query: req.sanitizedQuery,
      status: error.response?.status,
      code: error.code,
      message: error.message
    });
    
    const { status, message } = sanitizeError(error);
    res.status(status).json({
      success: false,
      error: message
    });
  }
});

export default router;