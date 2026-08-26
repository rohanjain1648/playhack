import { Router } from 'express';
import {
  createBookingHandler,
  cancelBookingHandler,
  myBookingsHandler,
} from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/', createBookingHandler);
router.get('/mine', myBookingsHandler);
router.delete('/:id', cancelBookingHandler);
export default router;
