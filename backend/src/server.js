import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import { connectDB } from './config/db.js';

import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// ES module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Initialize Express app FIRST
const app = express();
app.set('trust proxy', 1);

// CORS setup (before Helmet)
const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // In dev, allow all; restrict this in prod! 
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "http://localhost:5173",
        "ws://localhost:5173",
        "http://localhost:3001",
        "https://api.openweathermap.org",
        "https://api.open-meteo.com"
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Parsing
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Compression
app.use(compression());

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Response logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`📤 ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Database connection
connectDB()
  .then(() => logger.info('Database connected successfully'))
  .catch(err => {
    logger.error('Database connection failed', { error: err.message });
    if (process.env.NODE_ENV === 'production') process.exit(1);
  });

// Test endpoints
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin || 'none',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/test-login', (req, res) => {
  console.log('🔐 Test login attempt:', req.body);
  res.json({
    success: true,
    message: 'Test login successful!',
    user: {
      id: 999,
      username: 'testuser',
      email: req.body.email || 'test@example.com',
      name: 'Test User'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'SkyCast Weather API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// Main application routes - ORDER MATTERS!
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'SkyCast Weather API Documentation',
    version: '2.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'GET /api/cors-test': 'CORS test endpoint',
      'POST /api/test-login': 'Test login endpoint',
      'POST /api/auth/login': 'User login',
      'POST /api/auth/register': 'User registration',
      'GET /api/weather?lat=...&lon=...': 'Weather and air quality by coordinates (NEW)',
      'GET /api/weather/current/:city': 'Current weather by city',
      'GET /api/weather/forecast/:city': 'Weather forecast',
      'GET /api/weather/grid': 'Global weather grid',
      'GET /api/weather/by-ip': 'Weather by IP location',
      'GET /api/weather/historical/:city': 'Historical weather data'
    }
  });
});

// 404 handler - MUST be AFTER all routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler - MUST be LAST
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

// REMOVED THE EXTRA app.listen() CALL THAT WAS ON LINE 31
// The correct server start is here at the end:

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log('========================================');
  console.log('🚀 SkyCast Backend Server');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Frontend: http://localhost:5173`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🌐 Listening on: 0.0.0.0:${PORT}`);
  console.log('========================================');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', err => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', err => {
  logger.error('Unhandled Rejection', { error: err.message, stack: err.stack });
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;