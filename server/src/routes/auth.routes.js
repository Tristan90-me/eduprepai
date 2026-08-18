import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, getMe, adminLogin, adminRegister } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

// ── Stricter limiter for admin credential/invite-code endpoints ─
// These are higher-value targets (admin password guessing, invite
// code brute-forcing) than general student signup/login, which
// already sits behind the global /api limiter in index.js.
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many attempts. Please try again later.' },
})

// Public routes — no token needed
router.post('/register', register)
router.post('/login',    login)

// Admin — separate from student register/login entirely
router.post('/admin-login',    adminAuthLimiter, adminLogin)
router.post('/admin-register', adminAuthLimiter, adminRegister)

// Protected — token required
router.get('/me', protect, getMe)

export default router
