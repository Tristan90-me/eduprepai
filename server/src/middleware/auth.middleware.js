import { verifyToken } from '../utils/jwt.js'
import User from '../models/User.model.js'
import { AppError, asyncHandler } from './error.middleware.js'

// ── Protect route: must be logged in ──────────────────────────
export const protect = asyncHandler(async (req, res, next) => {
  // 1. Check the Authorization header exists
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Not authenticated. Please log in.', 401)
  }

  // 2. Extract the token (header looks like: "Bearer eyJ...")
  const token = authHeader.split(' ')[1]

  // 3. Verify it hasn't been tampered with or expired
  const decoded = verifyToken(token)  // throws if invalid

  // 4. Check the user still exists in the database
  const user = await User.findById(decoded.id)
  if (!user) throw new AppError('User no longer exists.', 401)

  // 5. Attach user to request — available in all route handlers
  req.user = user
  next()
})

// ── Restrict to specific roles ─────────────────────────────────
// Usage: router.delete('/question/:id', protect, restrictTo('admin'), ...)
export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('You do not have permission to perform this action.', 403)
  }
  next()
}