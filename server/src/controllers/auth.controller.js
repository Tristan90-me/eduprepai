import User from '../models/User.model.js'
import { generateToken } from '../utils/jwt.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'

// ── POST /api/auth/register ────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, school, examType, subjects } = req.body

  // 1. Check if email already registered
  const existing = await User.findOne({ email })
  if (existing) throw new AppError('Email already registered.', 409)

  // 2. Create the user (password is hashed automatically by the model)
  const user = await User.create({
    fullName,
    email,
    password,
    school,
    examType,
    subjects,
  })

  // 3. Generate JWT
  const token = generateToken(user._id, user.role)

  // 4. Send response
  res.status(201).json({
    success: true,
    message: 'Account created successfully!',
    token,
    user: user.toSafeObject(),
  })
})

// ── POST /api/auth/login ───────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // 1. Validate inputs
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400)
  }

  // 2. Find user — we need password so we explicitly select it back
  const user = await User.findOne({ email }).select('+password')
  if (!user) throw new AppError('Invalid email or password.', 401)

  // 3. Check password
  const isMatch = await user.comparePassword(password)
  if (!isMatch) throw new AppError('Invalid email or password.', 401)

  // 4. Update last active
  user.lastActive = new Date()
  await user.save({ validateBeforeSave: false })

  // 5. Generate JWT and respond
  const token = generateToken(user._id, user.role)

  res.json({
    success: true,
    message: 'Login successful!',
    token,
    user: user.toSafeObject(),
  })
})

// ── GET /api/auth/me ───────────────────────────────────────────
// Returns the currently logged-in user's profile.
// Protected — requires valid JWT.
export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user._id)
  res.json({
    success: true,
    user: user.toSafeObject(),
  })
})