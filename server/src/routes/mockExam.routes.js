import { Router } from 'express'
import {
  generateMockExam,
  startExam,
  saveAnswer,
  submitExam,
  getExam,
  getMyExams,
  getAllResults,
  explainQuestion,
} from '../controllers/mockExam.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

// ── Student routes ─────────────────────────────────────────────
router.get('/',              getMyExams)
router.post('/generate',     generateMockExam)
router.get('/:id',           getExam)
router.post('/:id/start',    startExam)
router.patch('/:id/answer',  saveAnswer)
router.post('/:id/submit',   submitExam)
router.post('/:id/explain',  explainQuestion)

// ── Admin routes ───────────────────────────────────────────────
router.get('/admin/all-results', restrictTo('admin'), getAllResults)

export default router