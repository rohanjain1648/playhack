import { Router } from 'express';
import { usageStats, peakHours, bookingTrends, noShowStats, leaderboard } from '../controllers/analytics.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/usage', usageStats);
router.get('/peak-hours', peakHours);
router.get('/trends', bookingTrends);
router.get('/no-shows', noShowStats);
router.get('/leaderboard', leaderboard);
export default router;
