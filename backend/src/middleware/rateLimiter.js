import { rateLimit } from 'express-rate-limit';

const isTest = () =>
  process.env.NODE_ENV === 'test' || Boolean(process.env.NODE_TEST_CONTEXT);

// 1. General API limiter across all /api routes (100 req/min)
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest() && req.headers['x-enforce-rate-limit'] !== 'true',
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      statusCode: 429,
    },
  },
});

// 2. Strict limiter on review and file upload endpoints (20 req/min)
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // 20 requests per minute on review / upload endpoints
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest() && req.headers['x-enforce-rate-limit'] !== 'true',
  message: {
    success: false,
    error: {
      message: 'Upload / review rate limit exceeded (20 requests per minute). Please wait before submitting more content.',
      statusCode: 429,
    },
  },
});

// 3. Auth brute-force defense limiter (25 req / 15 min)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest() && req.headers['x-enforce-rate-limit'] !== 'true',
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please wait before trying again.',
      statusCode: 429,
    },
  },
});
