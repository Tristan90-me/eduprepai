import { Router } from 'express'
import {
  downloadMockReport,
  getReportPreview,
} from '../controllers/report.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

// Download PDF report for a completed mock exam
router.get('/mock/:examId',         getReportPreview)
router.get('/mock/:examId/download', downloadMockReport)

export default router