import mongoose from 'mongoose';

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively strips MongoDB query operator keys (starting with "$" or containing ".")
 * and prototype pollution keys from plain objects/arrays without altering legitimate string values.
 */
export function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = sanitizeValue(val);
    }
    return clean;
  }
  return value;
}

/**
 * Express middleware that defends against NoSQL operator injection and prototype pollution
 * across req.body, req.query, and req.params.
 */
export function sanitizeMongoInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

/**
 * Validates that specified route parameters are valid 24-hex MongoDB ObjectIds.
 */
export function validateObjectIdParam(...paramNames) {
  return (req, res, next) => {
    for (const name of paramNames) {
      const val = req.params[name];
      if (val !== undefined && !mongoose.Types.ObjectId.isValid(val)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid identifier format for parameter "${name}".`,
            statusCode: 400,
          },
        });
      }
    }
    next();
  };
}

/**
 * Safe helper to assert a request field is a non-empty string within bounds.
 */
export function isSafeString(val, { min = 1, max = 10000 } = {}) {
  return typeof val === 'string' && val.trim().length >= min && val.trim().length <= max;
}
