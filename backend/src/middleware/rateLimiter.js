/**
 * Zero-dependency production-ready fixed-window rate limiter middleware
 * with automatic expired-bucket cleanup and standard RateLimit-* headers.
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  keyPrefix = 'global',
  message = 'Too many requests from this IP, please try again later.',
  skipInTest = true,
} = {}) {
  const hits = new Map();

  // Periodic cleanup to prevent unbounded memory growth; unref() so Node/tests exit cleanly
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (entry.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, Math.min(windowMs, 5 * 60 * 1000));

  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  return function rateLimitMiddleware(req, res, next) {
    // Allow normal test suites to run freely unless explicitly testing rate limiting
    const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.NODE_TEST_CONTEXT);
    const forceRateLimitInTest = req.headers['x-enforce-rate-limit'] === 'true';
    if (skipInTest && isTestEnv && !forceRateLimitInTest) {
      return next();
    }

    const clientIp =
      req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(resetSeconds));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(resetSeconds));
      return res.status(429).json({
        success: false,
        error: {
          message,
          statusCode: 429,
          retryAfterSeconds: resetSeconds,
        },
      });
    }

    next();
  };
}

// Strict limiter for authentication & login/signup endpoints (brute-force defense)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please wait before trying again.',
});

// Moderate limiter for file uploads and AI review runs
export const uploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyPrefix: 'upload',
  message: 'Upload rate limit exceeded. Please wait before submitting more files.',
});

// General API limiter across all /api routes
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyPrefix: 'api',
  message: 'API rate limit exceeded. Please slow down your requests.',
});
