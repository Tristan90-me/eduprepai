import { Router } from 'express'
import {
  joinClass,
  getMyClasses,
  listMyAssignments,
  getPendingCount,
  getSubmission,
  saveAnswer,
  submitSubmission,
  extractAnswerFromPhoto,
} from '../controllers/assignment.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(restrictTo('student'))

router.post('/join',           joinClass)
router.get('/classes',         getMyClasses)
router.post('/extract-photo',  extractAnswerFromPhoto)

router.get('/',                listMyAssignments)
router.get('/pending-count',   getPendingCount)
router.get('/:submissionId',   getSubmission)
router.patch('/:submissionId/answer', saveAnswer)
router.post('/:submissionId/submit',  submitSubmission)

export default router
