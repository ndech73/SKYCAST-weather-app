// middleware/errorHandler.js
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  // Log the error with metadata
  logger.error(`Error: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const errorResponse = {
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Error',
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : message
  };

  // Add validation errors if they exist
  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;