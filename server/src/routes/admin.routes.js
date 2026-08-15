import { Router } from 'express'
import {
  generateQuestions,
  approveQuestions,
  extractFromPDF,
} from '../controllers/aiQuestions.controller.js'
import {
  getStudentList,
  getStudentExams,
  submitPhysicalExam,
  extractFromPhoto,
} from '../controllers/physicalExam.controller.js'
import { getOverview, getLeaderboard } from '../controllers/analytics.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(restrictTo('admin'))

// ── AI question tools ──────────────────────────────────────────
router.post('/generate-questions', generateQuestions)
router.post('/approve-questions',  approveQuestions)
router.post('/extract-pdf',        extractFromPDF)

// ── Physical exam grading (Option 5) ──────────────────────────
router.get('/physical/students',          getStudentList)
router.get('/physical/exams/:studentId',  getStudentExams)
router.post('/physical/submit',           submitPhysicalExam)
router.post('/physical/extract-photo',    extractFromPhoto)

// ── Admin analytics ────────────────────────────────────────────
router.get('/analytics', getOverview)

export default router