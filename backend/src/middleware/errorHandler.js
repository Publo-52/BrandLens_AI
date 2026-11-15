import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      statusCode: 404,
    },
  });
}

export function errorHandler(err, req, res, next) {
  logger.error(`Unhandled error on ${req.method} ${req.url}:`, err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' && statusCode === 500 
        ? 'Internal Server Error' 
        : err.message,
      statusCode,
    },
  });
}
