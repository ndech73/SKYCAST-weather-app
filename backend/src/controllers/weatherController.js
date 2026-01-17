import weatherService from '../services/weatherService.js';

const weatherController = {
  // Get current weather - handles both city name (URL param) and coordinates (query params)
  getCurrentWeather: async (req, res) => {
    try {
      let { city } = req.params;
      const { lat, lon } = req.query;
      
      // Remove any suffix from city name (e.g., "Nairobi-1" -> "Nairobi")
      if (city) {
        city = city.split('-')[0];
      }
      
      let weather;
      
      // Priority: city name from URL > coordinates from query
      if (city) {
        console.log(`🌤️  Fetching weather for city: ${city}`);
        weather = await weatherService.getCurrentWeatherByCity(city);
      } else if (lat && lon) {
        console.log(`🌤️  Fetching weather for coordinates: ${lat}, ${lon}`);
        weather = await weatherService.getCurrentWeather(parseFloat(lat), parseFloat(lon));
      } else {
        return res.status(400).json({
          success: false,
          message: 'City name or coordinates (lat, lon) are required'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: weather
      });
    } catch (error) {
      console.error('❌ Error fetching current weather:', error.message);
      
      // Check if it's a "city not found" error
      if (error.message.includes('City not found') || error.message.includes('city not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data',
        error: error.message
      });
    }
  },

  // Get forecast - handles both city name and coordinates
  getForecast: async (req, res) => {
    try {
      let { city } = req.params;
      const { lat, lon } = req.query;
      
      // Remove any suffix from city name
      if (city) {
        city = city.split('-')[0];
      }
      
      let forecast;
      
      if (city) {
        console.log(`📅 Fetching forecast for city: ${city}`);
        forecast = await weatherService.getForecastByCity(city);
      } else if (lat && lon) {
        console.log(`📅 Fetching forecast for coordinates: ${lat}, ${lon}`);
        forecast = await weatherService.getForecast(parseFloat(lat), parseFloat(lon));
      } else {
        return res.status(400).json({
          success: false,
          message: 'City name or coordinates (lat, lon) are required'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: forecast
      });
    } catch (error) {
      console.error('❌ Error fetching forecast:', error.message);
      
      if (error.message.includes('Failed to fetch forecast for:') || error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch forecast data',
        error: error.message
      });
    }
  },

  getMultipleCities: async (req, res) => {
    try {
      console.log('🌍 Fetching multiple cities weather');
      const cities = await weatherService.getMultipleCitiesWeather();
      
      return res.status(200).json({
        success: true,
        count: cities.length,
        data: cities
      });
    } catch (error) {
      console.error('❌ Error fetching multiple cities:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch cities data',
        error: error.message
      });
    }
  },

  getGlobalGrid: async (req, res) => {
    try {
      console.log('🌐 Fetching global weather grid');
      const gridData = await weatherService.getGlobalWeatherGrid();
      
      return res.status(200).json({
        success: true,
        count: gridData.length,
        data: gridData
      });
    } catch (error) {
      console.error('❌ Error fetching global grid:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch global weather grid',
        error: error.message
      });
    }
  },

  getWeatherByIP: async (req, res) => {
    try {
      // Get client IP
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      
      console.log(`📍 Fetching weather for IP: ${clientIp}`);
      
      // Default to Nairobi for localhost/development
      const defaultLat = -1.2921;
      const defaultLon = 36.8219;
      
      const weather = await weatherService.getCurrentWeather(defaultLat, defaultLon);
      
      return res.status(200).json({
        success: true,
        data: {
          ...weather,
          detectedLocation: 'Nairobi, Kenya (default)',
          clientIp: clientIp === '::1' || clientIp === '127.0.0.1' ? 'localhost' : clientIp
        }
      });
    } catch (error) {
      console.error('❌ Error fetching weather by IP:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch weather by IP',
        error: error.message
      });
    }
  },

  // Get historical weather
  getHistoricalWeather: async (req, res) => {
    try {
      let { city } = req.params;
      const days = parseInt(req.query.days) || 7;

      // Remove any suffix from city name
      if (city) {
        city = city.split('-')[0];
      }

      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City name is required'
        });
      }

      console.log(`📊 Fetching historical weather for: ${city} (${days} days)`);
      const historical = await weatherService.getHistoricalWeather(city, days);

      return res.status(200).json({
        success: true,
        data: historical
      });
    } catch (error) {
      console.error('❌ Error fetching historical weather:', error.message);

      if (error.message.includes('Failed to fetch historical data for:')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch historical weather data',
        error: error.message
      });
    }
  }
};

export default weatherController;