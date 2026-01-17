// Simple cache service with ES6 exports
const cache = new Map();

const cacheService = {
  generateWeatherKey: (lat, lon, type) => `weather_${lat}_${lon}_${type}`,
  
  generateForecastKey: (lat, lon) => `forecast_${lat}_${lon}`,
  
  generateCitiesKey: () => 'cities_weather',
  
  generateGlobalGridKey: () => 'global_grid',
  
  get: (key) => {
    const item = cache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.value;
    }
    cache.delete(key);
    return null;
  },
  
  set: (key, value, ttl = 600000) => { // 10 minutes default
    cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  },
  
  delete: (key) => {
    cache.delete(key);
  },
  
  clear: () => {
    cache.clear();
  }
};

export default cacheService;
