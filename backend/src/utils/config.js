import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  
  // Weather APIs
  openWeatherApiKey: process.env.WEATHER_API_KEY || '',
  openWeatherBaseUrl: 'https://api.openweathermap.org/data/2.5',
  
  weatherApiKey: process.env.WEATHER_API_KEY || '',
  weatherApiBaseUrl: 'https://api.weatherapi.com/v1',
  
  openMeteoBaseUrl: 'https://api.open-meteo.com/v1',
  
  // CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

// Validate required config
const requiredConfig = ['databaseUrl', 'jwtSecret', 'openWeatherApiKey'];
const missing = requiredConfig.filter(key => !config[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required configuration: ${missing.join(', ')}`);
  console.error('Please check your .env file');
}

// Log configuration (without secrets)
if (config.nodeEnv === 'development') {
  console.log('📋 Configuration loaded:');
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Database: ${config.databaseUrl ? '✓ configured' : '✗ missing'}`);
  console.log(`   JWT Secret: ${config.jwtSecret ? '✓ configured' : '✗ missing'}`);
  console.log(`   Weather API Key: ${config.openWeatherApiKey ? '✓ configured' : '✗ missing'}`);
  console.log(`   Client URL: ${config.clientUrl}`);
}

export default config;