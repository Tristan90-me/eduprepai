import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  changePassword,
  getBadges,
  triggerBadgeCheck,
  refreshStreak,
} from '../controllers/settings.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.get('/profile',          getProfile)
router.put('/profile',          updateProfile)
router.put('/password',         changePassword)
router.get('/badges',           getBadges)
router.post('/badges/check',    triggerBadgeCheck)
router.post('/streak/update',   refreshStreak)

export default router