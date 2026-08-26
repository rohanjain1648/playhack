import { Router } from 'express';
import { getSlots, getSlot, getAvailableDates } from '../controllers/slot.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();
router.get('/', optionalAuth, getSlots);
router.get('/available-dates/:facilityId', getAvailableDates);
router.get('/:id', getSlot);
export default router;
