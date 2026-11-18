import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: 'Requested endpoint not found.',
      statusCode: 404,
    },
  });
}

export function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  // Log internally with minimal surface (never echo stack traces to clients)
  logger.error(
    `Unhandled error on ${req.method} ${req.path}:`,
    isProd ? err.message : (err.stack || err.message)
  );

  // 1. Multer file upload errors
  if (err.name === 'MulterError') {
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file exceeds the 10MB maximum size limit.'
        : 'Invalid file upload request.';
    return res.status(statusCode).json({
      success: false,
      error: { message, statusCode },
    });
  }

  // 2. Mongoose invalid ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid resource identifier format.', statusCode: 400 },
    });
  }

  // 3. Mongoose validation errors (safe field messages, no internal schema traces)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {})
      .map((e) => e.message)
      .filter(Boolean);
    return res.status(400).json({
      success: false,
      error: {
        message: messages.length > 0 ? messages.join('; ') : 'Request validation failed.',
        statusCode: 400,
      },
    });
  }

  // 4. MongoDB duplicate key error (never expose index/collection details)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: { message: 'A record with this unique value already exists.', statusCode: 409 },
    });
  }

  // 5. JWT signature / expiry errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired authentication token.', statusCode: 401 },
    });
  }

  // 6. Malformed JSON body errors from express.json()
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Malformed JSON request payload.', statusCode: 400 },
    });
  }

  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  const safeMessage =
    statusCode >= 500 && isProd
      ? 'Internal Server Error'
      : statusCode >= 500
      ? 'Internal Server Error'
      : err.message || 'Request failed';

  res.status(statusCode).json({
    success: false,
    error: {
      message: safeMessage,
      statusCode,
    },
  });
}
