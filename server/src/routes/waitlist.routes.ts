import { Router } from 'express';
import { joinWaitlistHandler, leaveWaitlistHandler, myWaitlistHandler } from '../controllers/waitlist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/', joinWaitlistHandler);
router.get('/mine', myWaitlistHandler);
router.delete('/:id', leaveWaitlistHandler);
export default router;
