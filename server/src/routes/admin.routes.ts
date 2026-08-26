import { Router } from 'express';
import {
  adminListBookings,
  createMaintenance,
  overrideSlotStatus,
  listMaintenanceWindows,
  createFacility,
  toggleFacility,
  setUserPriority,
  listUsers,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/bookings', adminListBookings);
router.get('/users', listUsers);
router.patch('/users/:userId/priority', setUserPriority);

router.post('/maintenance', createMaintenance);
router.get('/maintenance', listMaintenanceWindows);

router.patch('/slots/:id/status', overrideSlotStatus);

router.post('/facilities', createFacility);
router.patch('/facilities/:id/toggle', toggleFacility);

export default router;
