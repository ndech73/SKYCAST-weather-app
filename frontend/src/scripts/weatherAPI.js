
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/weather`
  : 'http://localhost:3001/api/weather';
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 2;

if (import.meta.env.PROD && API_BASE_URL.startsWith('http://')) {
  console.warn('Warning: Using insecure HTTP in production. Use HTTPS instead.');
}

const validateInput = (input, maxLength = 100) => {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  const trimmed = input.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Input cannot be empty');
  }
  
  if (trimmed.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} characters)`);
  }
  
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|SHOW|GRANT|REVOKE)\b)/i,
    /(\b(OR|AND|NOT)\b.*\b(\d+|\'|\"|=|>|<))/i,
    /(;|\-\-|\/\*|\*\/|\\\*|\\\-)/,
    /(\|\||&&|>>|<<|\.\.)/,
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
  if (normalized !== trimmed) {
    console.warn('Unicode normalization applied to input');
  }
  
  return normalized;
};

const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors',
      referrerPolicy: 'strict-origin-when-cross-origin',
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
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
      
      if (i === retries) {
        throw error;
      }
      
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retrying request (attempt ${i + 2}/${retries + 1})...`);
    }
  }
};

const sanitizeError = (error) => {
  const errorMap = {
    'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
    'NetworkError': 'Network error. Please check your connection.',
    'timeout': 'Request timed out. Please try again.',
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
    if (message.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return 'Unable to fetch weather data. Please try again.';
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
    throw new Error(`Server error (${response.status})`);
  }
  
  if (data && typeof data === 'object') {
    if (data.success === false || data.error) {
      throw new Error('Request failed');
    }
  }
  
  return data.data || data;
};

export const weatherAPI = {
  getCurrentWeather: async (city) => {
    try {
      const validCity = validateInput(city);
      const encodedCity = encodeURIComponent(validCity);
      const url = `${API_BASE_URL}/current/${encodedCity}`;
      
      console.log('Making secure request to:', url.replace(encodedCity, '[REDACTED]'));
      
      const response = await fetchWithRetry(url);
      return await handleResponse(response);
      
    } catch (error) {
      console.error('Weather fetch error type:', error.name);
      throw new Error(sanitizeError(error));
    }
  },

  getForecast: async (city) => {
    try {
      const validCity = validateInput(city);
      const encodedCity = encodeURIComponent(validCity);
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/forecast/${encodedCity}`
      );
      
      return await handleResponse(response);
      
    } catch (error) {
      console.error('Forecast fetch error type:', error.name);
      throw new Error(sanitizeError(error));
    }
  },

  searchCities: async (query) => {
    try {
      const validQuery = validateInput(query, 50);
      const encodedQuery = encodeURIComponent(validQuery);
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/search/${encodedQuery}`
      );
      
      return await handleResponse(response);
      
    } catch (error) {
      console.error('Search error type:', error.name);
      throw new Error(sanitizeError(error));
    }
  },
  
  healthCheck: async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetchWithTimeout(
        `${baseUrl}/api/health`,
        {},
        5000
      );
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }
};

export { validateInput, sanitizeError };
