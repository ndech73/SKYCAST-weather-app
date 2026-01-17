const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/weather';
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 2;

if (import.meta.env.PROD && API_BASE_URL.startsWith('http://')) {
  console.warn('Warning: Using insecure HTTP in production.  Use HTTPS instead.');
}

const validateInput = (input, maxLength = 100) => {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) throw new Error('Input cannot be empty');
  if (trimmed.length > maxLength) throw new Error(`Input too long (max ${maxLength} characters)`);
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|SHOW|GRANT|REVOKE)\b)/i,
    /(\b(OR|AND|NOT)\b.*\b(\d+|\'|\"|=|>|<))/i,
    /(;|\-\-|\/\*|\*\/|\\\*|\\\-)/,
    /(\|\||&&|>>|<<|\. \.)/,
    /(\$|\{|\}|\[|\]|`)/,
    /(\b(true|false|null|undefined)\b)/i,
  ];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      console.warn('Potential SQL injection attempt detected:', trimmed);
      throw new Error('Invalid input detected');
    }
  }
  const safePattern = /^[a-zA-ZÀ-ÿ0-9\s\-,.'()]+$/;
  if (!safePattern.test(trimmed)) {
    throw new Error('Please enter a valid city name with only letters, numbers, spaces, hyphens, apostrophes, commas, dots, or parentheses');
  }
  const normalized = trimmed.normalize('NFKC');
  if (normalized !== trimmed) console.warn('Unicode normalization applied to input');
  return normalized;
};

const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') throw new Error('Invalid protocol');
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ... options.headers,
      },
      credentials: options.credentials || 'include',
      mode: options.mode || 'cors',
      referrerPolicy: 'strict-origin-when-cross-origin',
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout.  Please check your connection and try again.');
    }
    throw error;
  }
};

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      if (error.message.includes('invalid') || 
          error.message.includes('timeout') ||
          error.message.includes('Invalid protocol') ||
          error.message.includes('Potential SQL injection') ||
          (error.status >= 400 && error.status < 500)) {
        throw error;
      }
      if (i === retries) throw error;
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`Retrying request (attempt ${i + 2}/${retries + 1})...`);
    }
  }
};

const sanitizeError = (error) => {
  const errorMap = {
    'Failed to fetch': 'Unable to connect to the server.  Please check your internet connection.',
    'NetworkError': 'Network error. Please check your connection.',
    'timeout': 'Request timed out.  Please try again.',
    'invalid characters': 'Please enter a valid city name.',
    'invalid input detected': 'Invalid input provided.',
    'too long': 'City name is too long.',
    'cannot be empty': 'Please enter a city name.',
    'invalid response format': 'Server returned invalid data format.',
    'invalid json': 'Server returned invalid data.',
    'invalid protocol': 'Invalid request configuration.',
  };
  const message = error.message.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key.toLowerCase())) return value;
  }
  return 'Unable to fetch weather data.  Please try again. ';
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Invalid response format from server');
  }
  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response from server');
  }
  if (!response.ok) {
    console.error('API Error Status:', response.status);
    throw new Error(data.error || `Server error (${response.status})`);
  }
  if (data && typeof data === 'object') {
    if (data.success === false || data.error) {
      throw new Error(data.message || data.error || 'Request failed');
    }
  }
  return data.data || data;
};

const geocodeCity = async (city) => {
  const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=jsonv2&accept-language=en&limit=1`;
  console.log('Geocoding city:', city);
  try {
    const geoRes = await fetch(geoUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'SkyCastApp/2.0 (Weather Forecasting Application)'
      },
      mode: 'cors',
      cache: 'default'
    });
    if (!geoRes.ok) {
      console.error('Geocoding failed with status:', geoRes.status);
      throw new Error('Geocoding service unavailable');
    }
    const geoData = await geoRes.json();
    if (!geoData?.length) throw new Error('City not found');
    console.log('✅ Geocoding successful:', geoData[0].display_name);
    return {
      lat: parseFloat(geoData[0].lat),
      lon: parseFloat(geoData[0].lon),
      display_name: geoData[0].display_name
    };
  } catch (error) {
    console.error('❌ Geocoding error:', error.message);
    throw error;
  }
};

const formatCurrentWeather = (data) => {
  if (data.location && data.coord) {
    return {
      name: data.location.name || 'Unknown City',
      city: data.location.name || 'Unknown City',
      country: data.location.country || 'Unknown',
      sys: { country: data.location.country },
      coord: data.coord,
      main: {
        temp: data.temp,
        feels_like: data.temp,
        temp_min: data.temp,
        temp_max: data.temp,
        humidity: data.humidity,
        pressure: 1013
      },
      wind: { speed: data.wind },
      clouds: { all: data.cloud },
      weather: [{
        main: data.cloud > 50 ? 'Clouds' :  'Clear',
        description: data.cloud > 50 ? 'cloudy' : 'clear sky',
        icon: data.cloud > 50 ? '04d' : '01d'
      }],
      dt: Math.floor(Date.now() / 1000),
      aqi: data.aqi,
      aqi_label: data.aqi_label,
      snow: data.snow,
      temperature: data.temp,
      feelsLike: data.temp,
      condition: data.cloud > 50 ? 'Cloudy' : 'Clear',
      humidity: data.humidity,
      pressure: 1013,
      windSpeed: data.wind,
      cloudCover: data.cloud,
      precipitation: data.snow || 0
    };
  }
  return {
    city: data.name || data.city || data.location?.name || 'Unknown City',
    country: data.sys?.country || data.country || data.location?.country || 'Unknown',
    temperature: data.main?.temp || data.temperature || data.current?.temp || 20,
    feelsLike: data.main?.feels_like || data.feelsLike || data.current?.feels_like,
    condition: data.weather?.[0]?.description || data.condition || data.current?.condition?.text || 'Unknown',
    humidity:  data.main?.humidity || data.humidity || data.current?.humidity,
    pressure: data.main?.pressure || data.pressure || data.current?.pressure,
    windSpeed: data.wind?.speed || data.windSpeed || data.current?.wind_kph || 0,
    windDirection: data.wind?.deg || data.windDirection || data.current?.wind_degree,
    cloudCover: data.clouds?.all || data.cloudCover || data.current?.cloud,
    visibility: data.visibility || data.current?.vis_km,
    sunrise: data.sys?.sunrise || data.astro?.sunrise,
    sunset: data.sys?.sunset || data.astro?.sunset,
    timestamp: data.dt || data.last_updated_epoch || Date.now(),
    icon: data.weather?.[0]?.icon || data.current?.condition?.icon,
    uvIndex: data.current?.uv || data.uvi,
    precipitation: data.rain?.['1h'] || data.snow?.['1h'] || data.current?.precip_mm || 0
  };
};

const formatForecast = (data) => {
  if (data.forecast?.forecastday) {
    return {
      city: data.location?.name || data.city,
      country: data.location?.country || data.country,
      forecast: data.forecast.forecastday.map(day => ({
        date: day.date,
        temperature: day.day?.avgtemp_c || day.day?.avgtemp_f,
        maxTemp: day.day?.maxtemp_c || day.day?.maxtemp_f,
        minTemp: day.day?.mintemp_c || day.day?.mintemp_f,
        condition: day.day?.condition?.text,
        humidity: day.day?.avghumidity,
        precipitation: day.day?.totalprecip_mm,
        uvIndex: day.day?.uv,
        icon: day.day?.condition?.icon
      }))
    };
  } else if (data.list && Array.isArray(data.list)) {
    return {
      city: data.city?.name || data.city,
      country: data.city?.country,
      forecast: data.list.map(item => ({
        timestamp: item.dt,
        temperature: item.main?.temp,
        feelsLike: item.main?.feels_like,
        condition:  item.weather?.[0]?.description,
        humidity: item.main?.humidity,
        pressure: item.main?.pressure,
        windSpeed: item.wind?.speed,
        precipitation: item.pop || item.rain?.['3h'] || 0,
        icon: item.weather?.[0]?.icon
      }))
    };
  }
  return data;
};

const getMockCurrentWeather = (city) => {
  return {
    city: city,
    country: 'Unknown',
    temperature: 20 + Math.random() * 15,
    condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
    humidity: 40 + Math.random() * 40,
    pressure: 1000 + Math.random() * 30,
    windSpeed: 5 + Math.random() * 15,
    windDirection: Math.random() * 360,
    cloudCover: Math.random() * 100,
    uvIndex: Math.floor(Math.random() * 11)
  };
};

const getMockForecast = (city) => {
  const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Stormy'];
  return {
    city: city,
    forecast: Array.from({ length: 5 }, (_, i) => ({
      day: new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      temperature: 20 + Math.random() * 10,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: 50 + Math.random() * 30,
      precipitation: Math.random() * 20
    }))
  };
};

const getMockHistoricalData = (city, days) => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
    temperature: 20 + Math.random() * 10,
    humidity: 50 + Math.random() * 30,
    rainfall: Math.random() * 15,
    windSpeed: 5 + Math.random() * 15
  }));
};

export const weatherAPI = {
  getWeatherByCoords: async (lat, lon) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      // 🚨 FIX: NO space before 'lat'
      const url = `${baseUrl}/api/weather?lat=${lat}&lon=${lon}`;
      console.log('Fetching weather by coords:', { lat, lon, url });
      const response = await fetchWithRetry(url);
      const data = await handleResponse(response);
      return formatCurrentWeather(data);
    } catch (error) {
      console.error('Weather by coords fetch error:', error.message);
      throw error;
    }
  },
  getCurrentWeather: async (city) => {
    try {
      const validCity = validateInput(city);
      const { lat, lon, display_name } = await geocodeCity(validCity);
      const weather = await weatherAPI.getWeatherByCoords(lat, lon);
      return {
        ...weather,
        display_name
      };
    } catch (error) {
      console.error('Weather fetch error:', error.message);
      console.warn('⚠️ Falling back to mock data for:', city);
      return getMockCurrentWeather(city);
    }
  },
  getForecast: async (city) => {
    try {
      const validCity = validateInput(city);
      const encodedCity = encodeURIComponent(validCity);
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const url = `${baseUrl}/api/weather/forecast/${encodedCity}`;
      const response = await fetchWithRetry(url);
      const data = await handleResponse(response);
      return formatForecast(data);
    } catch (error) {
      console.error('Forecast fetch error:', error.message);
      console.warn('⚠️ Falling back to mock forecast for:', city);
      return getMockForecast(city);
    }
  },
  getHistoricalWeather: async (city, days = 7) => {
    try {
      const validCity = validateInput(city);
      const encodedCity = encodeURIComponent(validCity);
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const url = `${baseUrl}/api/weather/historical/${encodedCity}?days=${days}`;
      const response = await fetchWithRetry(url);
      return await handleResponse(response);
    } catch (error) {
      console.error('Historical Weather API Error:', error.message);
      console.warn('⚠️ Falling back to mock historical data for:', city);
      return getMockHistoricalData(city, days);
    }
  },
  getMultipleLocationsWeather: async (cities) => {
    try {
      const promises = cities.map(city => weatherAPI.getCurrentWeather(city));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Multiple Locations API Error:', error);
      return cities.map(city => getMockCurrentWeather(city));
    }
  },
  searchCities: async (query) => {
    try {
      const validQuery = validateInput(query, 50);
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(validQuery)}&format=jsonv2&accept-language=en&limit=10`;
      const response = await fetch(geoUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Accept-Language': 'en',
          'User-Agent': 'SkyCastApp/2.0 (Weather Forecasting Application)'
        },
        mode: 'cors'
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.map(place => ({
        name: place.display_name.split(',')[0],
        country: place.display_name.split(',').pop().trim(),
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
        display_name: place.display_name
      }));
    } catch (error) {
      console.error('Search error:', error.message);
      return [];
    }
  },
  healthCheck: async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetchWithTimeout(`${baseUrl}/health`, {}, 5000);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  },
  geocodeCity,
  formatCurrentWeather,
  formatForecast,
  getMockCurrentWeather,
  getMockForecast,
  getMockHistoricalData
};

export { validateInput, sanitizeError };