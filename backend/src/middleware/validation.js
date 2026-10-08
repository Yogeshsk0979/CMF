import { validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate value', detail: err.detail });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Invalid reference', detail: err.detail });
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Constraint violation', detail: err.detail });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}