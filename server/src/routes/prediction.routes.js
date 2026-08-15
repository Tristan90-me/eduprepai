import { Router } from 'express'
import {
  getPredictions,
  logAccuracy,
  getAccuracyHistory,
} from '../controllers/prediction.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

// All prediction routes require login
router.use(protect)

// ── Student routes ─────────────────────────────────────────────
// Get predictions for a subject — hits cache if available
router.get('/:subject', getPredictions)

// ── Admin routes ───────────────────────────────────────────────
// Log real exam results to measure engine accuracy
router.post('/accuracy', restrictTo('admin'), logAccuracy)

// View accuracy history for a subject
router.get('/history/:subject', restrictTo('admin'), getAccuracyHistory)

export default router