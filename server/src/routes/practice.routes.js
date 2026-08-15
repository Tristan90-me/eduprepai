import { Router } from 'express'
import {
  getPracticeQuestions,
  getTopicsWithMastery,
  submitAnswer,
  getExplanation,
  saveSession,
  getMasteryProfile,
  getRecentSessions,
} from '../controllers/practice.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

// All practice routes require login
router.use(protect)

// ── Question fetching ──────────────────────────────────────────
router.get('/questions', getPracticeQuestions)
router.get('/topics',    getTopicsWithMastery)
router.get('/mastery',   getMasteryProfile)
router.get('/sessions',  getRecentSessions)

// ── Answer submission ──────────────────────────────────────────
// These are POST because they write data and trigger AI calls
router.post('/submit',  submitAnswer)
router.post('/explain', getExplanation)
router.post('/session', saveSession)

export default router