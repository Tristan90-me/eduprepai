// ── Centralised error handler ──────────────────────────────────
// All errors thrown in route handlers or passed via next(err)
// are caught here and returned in a consistent JSON format.

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message    = err.message    || 'Internal server error'

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    const fields = Object.values(err.errors).map(e => e.message)
    message = fields.join(', ')
  }

  // Mongoose duplicate key error (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue)[0]
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; message = 'Invalid token' }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; message = 'Token has expired' }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  // Never expose stack traces in production
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  }

  console.error(`[ERROR] ${statusCode} - ${message}`)
  res.status(statusCode).json(response)
}

// ── Async wrapper ──────────────────────────────────────────────
// Wraps async route handlers so you don't need try/catch in every controller.
// Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// ── Custom error class ─────────────────────────────────────────
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}
