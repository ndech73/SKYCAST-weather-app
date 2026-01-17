import { rateLimit } from 'express-rate-limit';

// Rate limiter for weather API
const weatherRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for certain paths or in development
    return process.env.NODE_ENV === 'development' || req.path === '/health';
  }
});

export default weatherRateLimiter;
