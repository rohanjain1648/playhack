import { Router } from 'express';
import { listNotifications, readNotification, readAll } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', listNotifications);
router.patch('/read-all', readAll);
router.patch('/:id/read', readNotification);
export default router;
