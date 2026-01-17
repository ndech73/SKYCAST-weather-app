import axios from 'axios';
import config from '../utils/config.js';
import cache from './cacheService.js';
import logger from '../utils/logger.js';

class WeatherService {
  constructor() {
    this.openWeatherApi = axios.create({
      baseURL: config.openWeatherBaseUrl,
      timeout: 10000,
    });

    this.weatherApi = axios.create({
      baseURL: config.weatherApiBaseUrl,
      timeout: 10000,
    });

    this.openMeteoApi = axios.create({
      baseURL: config.openMeteoBaseUrl,
      timeout: 10000,
    });
  }

  // Get current weather by coordinates
  async getCurrentWeather(lat, lon) {
    const cacheKey = `weather:current:${lat}:${lon}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Returning cached current weather');
      return cached;
    }

    try {
      logger.info(`Fetching current weather for: ${lat}, ${lon}`);
      
      // Try OpenWeatherMap first
      const response = await this.openWeatherApi.get('/weather', {
        params: {
          lat,
          lon,
          appid: config.openWeatherApiKey,
          units: 'metric'
        }
      });

      const data = response.data;
      const weatherData = {
        location: {
          name: data.name,
          country: data.sys.country,
          coordinates: { lat: data.coord.lat, lon: data.coord.lon }
        },
        current: {
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          tempMin: Math.round(data.main.temp_min),
          tempMax: Math.round(data.main.temp_max),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          windDirection: data.wind.deg,
          cloudiness: data.clouds.all,
          visibility: data.visibility,
          weather: {
            main: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon
          },
          sunrise: data.sys.sunrise,
          sunset: data.sys.sunset
        },
        timestamp: new Date().toISOString()
      };

      // Cache for 10 minutes
      cache.set(cacheKey, weatherData, 600);
      return weatherData;

    } catch (error) {
      logger.error('Error fetching from OpenWeatherMap', error);
      
      // Fallback to generated data
      return this.generateFallbackWeather(lat, lon);
    }
  }

  // Get current weather by city name - NEW METHOD
  async getCurrentWeatherByCity(cityName) {
    const cacheKey = `weather:city:${cityName.toLowerCase()}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info(`Returning cached weather for ${cityName}`);
      return cached;
    }

    try {
      logger.info(`Fetching weather for city: ${cityName}`);
      
      const response = await this.openWeatherApi.get('/weather', {
        params: {
          q: cityName,
          appid: config.openWeatherApiKey,
          units: 'metric'
        }
      });

      const data = response.data;
      const weatherData = {
        location: {
          name: data.name,
          country: data.sys.country,
          coordinates: { lat: data.coord.lat, lon: data.coord.lon }
        },
        current: {
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          tempMin: Math.round(data.main.temp_min),
          tempMax: Math.round(data.main.temp_max),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          windDirection: data.wind.deg,
          cloudiness: data.clouds.all,
          visibility: data.visibility,
          weather: {
            main: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon
          },
          sunrise: data.sys.sunrise,
          sunset: data.sys.sunset
        },
        timestamp: new Date().toISOString()
      };

      cache.set(cacheKey, weatherData, 600);
      return weatherData;

    } catch (error) {
      logger.error(`Error fetching weather for ${cityName}`, error);
      throw new Error(`City not found: ${cityName}`);
    }
  }

  // Get forecast by coordinates
  async getForecast(lat, lon) {
    const cacheKey = `weather:forecast:${lat}:${lon}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Returning cached forecast');
      return cached;
    }

    try {
      logger.info(`Fetching forecast for: ${lat}, ${lon}`);
      
      const response = await this.openWeatherApi.get('/forecast', {
        params: {
          lat,
          lon,
          appid: config.openWeatherApiKey,
          units: 'metric',
          cnt: 40
        }
      });

      const data = response.data;
      const forecastData = {
        location: {
          name: data.city.name,
          country: data.city.country,
          coordinates: { lat: data.city.coord.lat, lon: data.city.coord.lon }
        },
        forecast: data.list.map(item => ({
          datetime: item.dt_txt,
          timestamp: item.dt,
          temperature: Math.round(item.main.temp),
          feelsLike: Math.round(item.main.feels_like),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          weather: {
            main: item.weather[0].main,
            description: item.weather[0].description,
            icon: item.weather[0].icon
          },
          windSpeed: item.wind.speed,
          windDirection: item.wind.deg,
          cloudiness: item.clouds.all,
          pop: item.pop * 100,
          rain: item.rain?.['3h'] || 0,
          snow: item.snow?.['3h'] || 0
        })),
        timestamp: new Date().toISOString()
      };

      cache.set(cacheKey, forecastData, 1800); // 30 minutes
      return forecastData;

    } catch (error) {
      logger.error('Error fetching forecast', error);
      throw new Error('Failed to fetch forecast data');
    }
  }

  // Get forecast by city name - NEW METHOD
  async getForecastByCity(cityName) {
    const cacheKey = `weather:forecast:city:${cityName.toLowerCase()}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info(`Returning cached forecast for ${cityName}`);
      return cached;
    }

    try {
      logger.info(`Fetching forecast for city: ${cityName}`);
      
      const response = await this.openWeatherApi.get('/forecast', {
        params: {
          q: cityName,
          appid: config.openWeatherApiKey,
          units: 'metric',
          cnt: 40
        }
      });

      const data = response.data;
      const forecastData = {
        location: {
          name: data.city.name,
          country: data.city.country,
          coordinates: { lat: data.city.coord.lat, lon: data.city.coord.lon }
        },
        forecast: data.list.map(item => ({
          datetime: item.dt_txt,
          timestamp: item.dt,
          temperature: Math.round(item.main.temp),
          feelsLike: Math.round(item.main.feels_like),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          weather: {
            main: item.weather[0].main,
            description: item.weather[0].description,
            icon: item.weather[0].icon
          },
          windSpeed: item.wind.speed,
          windDirection: item.wind.deg,
          cloudiness: item.clouds.all,
          pop: item.pop * 100,
          rain: item.rain?.['3h'] || 0,
          snow: item.snow?.['3h'] || 0
        })),
        timestamp: new Date().toISOString()
      };

      cache.set(cacheKey, forecastData, 1800);
      return forecastData;

    } catch (error) {
      logger.error(`Error fetching forecast for ${cityName}`, error);
      throw new Error(`Failed to fetch forecast for: ${cityName}`);
    }
  }

  // Get weather for multiple cities - NEW METHOD
  async getMultipleCitiesWeather() {
    const cacheKey = 'weather:multiple:cities';
    
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Returning cached multiple cities weather');
      return cached;
    }

    const cities = [
      'London', 'New York', 'Tokyo', 'Paris',
      'Nairobi', 'Sydney', 'Dubai', 'Singapore'
    ];

    try {
      logger.info('Fetching weather for multiple cities');
      
      const promises = cities.map(city =>
        this.openWeatherApi.get('/weather', {
          params: {
            q: city,
            appid: config.openWeatherApiKey,
            units: 'metric'
          }
        }).catch(err => {
          logger.warn(`Failed to fetch weather for ${city}`);
          return null;
        })
      );

      const results = await Promise.all(promises);

      const citiesData = results
        .filter(result => result !== null)
        .map(result => {
          const data = result.data;
          return {
            name: data.name,
            country: data.sys.country,
            temperature: Math.round(data.main.temp),
            weather: {
              main: data.weather[0].main,
              description: data.weather[0].description,
              icon: data.weather[0].icon
            },
            coordinates: {
              lat: data.coord.lat,
              lon: data.coord.lon
            }
          };
        });

      cache.set(cacheKey, citiesData, 600); // 10 minutes
      return citiesData;

    } catch (error) {
      logger.error('Error fetching multiple cities', error);
      throw new Error('Failed to fetch multiple cities weather');
    }
  }

  // Get global weather grid - NEW METHOD
  async getGlobalWeatherGrid() {
    const cacheKey = 'weather:global:grid';
    
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Returning cached global weather grid');
      return cached;
    }

    const globalCities = [
      'London', 'New York', 'Tokyo', 'Sydney',
      'Cairo', 'Mumbai', 'São Paulo', 'Moscow',
      'Nairobi', 'Los Angeles', 'Paris', 'Beijing',
      'Dubai', 'Singapore', 'Toronto', 'Mexico City'
    ];

    try {
      logger.info('Fetching global weather grid');
      
      const promises = globalCities.map(city =>
        this.openWeatherApi.get('/weather', {
          params: {
            q: city,
            appid: config.openWeatherApiKey,
            units: 'metric'
          }
        }).catch(err => {
          logger.warn(`Failed to fetch weather for ${city}`);
          return null;
        })
      );

      const results = await Promise.all(promises);

      const gridData = results
        .filter(result => result !== null)
        .map(result => {
          const data = result.data;
          return {
            name: data.name,
            country: data.sys.country,
            temperature: Math.round(data.main.temp),
            weather: {
              main: data.weather[0].main,
              description: data.weather[0].description,
              icon: data.weather[0].icon
            },
            coordinates: {
              lat: data.coord.lat,
              lon: data.coord.lon
            }
          };
        });

      cache.set(cacheKey, gridData, 600); // 10 minutes
      return gridData;

    } catch (error) {
      logger.error('Error fetching global grid', error);
      throw new Error('Failed to fetch global weather grid');
    }
  }

  // Get historical weather - NEW METHOD
  async getHistoricalWeather(cityName, days = 7) {
    const cacheKey = `weather:history:${cityName.toLowerCase()}:${days}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info(`Returning cached historical data for ${cityName}`);
      return cached;
    }

    try {
      logger.info(`Fetching historical weather for: ${cityName} (${days} days)`);
      
      // OpenWeatherMap doesn't provide free historical data
      // Generate mock historical data based on current weather
      const currentWeather = await this.getCurrentWeatherByCity(cityName);
      
      const historicalData = {
        location: currentWeather.location,
        history: Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (days - i));
          
          // Generate realistic variations
          const tempVariation = Math.sin(i) * 5; // ±5°C variation
          const baseTemp = currentWeather.current.temperature;
          
          return {
            date: date.toISOString().split('T')[0],
            timestamp: Math.floor(date.getTime() / 1000),
            tempMax: Math.round(baseTemp + 3 + tempVariation),
            tempMin: Math.round(baseTemp - 3 + tempVariation),
            tempAvg: Math.round(baseTemp + tempVariation),
            humidity: currentWeather.current.humidity + Math.floor(Math.random() * 20 - 10),
            precipitation: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
            weather: {
              main: currentWeather.current.weather.main,
              description: currentWeather.current.weather.description,
              icon: currentWeather.current.weather.icon
            }
          };
        }),
        note: 'Historical data is generated based on current weather patterns',
        timestamp: new Date().toISOString()
      };

      cache.set(cacheKey, historicalData, 3600); // Cache for 1 hour
      return historicalData;

    } catch (error) {
      logger.error(`Error fetching historical weather for ${cityName}`, error);
      throw new Error(`Failed to fetch historical data for: ${cityName}`);
    }
  }

  // Generate fallback weather data
  generateFallbackWeather(lat, lon, name = null) {
    logger.warn('Generating fallback weather data');
    
    return {
      location: {
        name: name || 'Unknown Location',
        country: 'XX',
        coordinates: { lat, lon }
      },
      current: {
        temperature: 20,
        feelsLike: 19,
        tempMin: 18,
        tempMax: 23,
        humidity: 60,
        pressure: 1013,
        windSpeed: 3.5,
        windDirection: 180,
        cloudiness: 40,
        visibility: 10000,
        weather: {
          main: 'Clouds',
          description: 'scattered clouds',
          icon: '03d'
        },
        sunrise: Math.floor(Date.now() / 1000) - 3600,
        sunset: Math.floor(Date.now() / 1000) + 3600
      },
      fallback: true,
      timestamp: new Date().toISOString()
    };
  }
}

export default new WeatherService();