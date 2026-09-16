import { Router } from 'express'
import {
  createClass,
  listClasses,
  createAssignment,
  listAssignments,
  listPendingReviews,
  getSubmissionForReview,
  publishSubmission,
} from '../controllers/teacher.controller.js'
import { generateQuestions, extractFromPDF } from '../controllers/aiQuestions.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(restrictTo('teacher'))

// ── Classes ──────────────────────────────────────────────────────
router.post('/classes', createClass)
router.get('/classes',  listClasses)

// ── Question tools — same side-effect-free preview generators the
// admin PDF Extractor / AI Generator already use, reused unmodified ──
router.post('/generate-questions', generateQuestions)
router.post('/extract-pdf',        extractFromPDF)

// ── Assignments ──────────────────────────────────────────────────
router.post('/assignments', createAssignment)
router.get('/assignments',  listAssignments)

// ── Submission review (Phase 2 — scanned answers) ────────────────
router.get('/submissions',              listPendingReviews)
router.get('/submissions/:id',          getSubmissionForReview)
router.post('/submissions/:id/publish', publishSubmission)

export default router
