import { Router } from 'express'
import { getOverview, getLeaderboard } from '../controllers/analytics.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.get('/overview',     getOverview)
router.get('/leaderboard',  getLeaderboard)

export default router