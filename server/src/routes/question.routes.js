import { Router } from 'express'
import {
  createQuestion,
  bulkCreateQuestions,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getTopicsBySubject,
  getQuestionBankStats,
} from '../controllers/question.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

// All question routes require login
router.use(protect)

// ── Student & admin ────────────────────────────────────────────
router.get('/',         getQuestions)
router.get('/topics',   getTopicsBySubject)
router.get('/stats',    getQuestionBankStats)
router.get('/:id',      getQuestionById)

// ── Admin only ─────────────────────────────────────────────────
router.post('/',        restrictTo('admin'), createQuestion)
router.post('/bulk',    restrictTo('admin'), bulkCreateQuestions)
router.put('/:id',      restrictTo('admin'), updateQuestion)
router.delete('/:id',   restrictTo('admin'), deleteQuestion)

export default router