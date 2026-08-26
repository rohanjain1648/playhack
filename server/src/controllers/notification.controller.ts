import { Request, Response, NextFunction } from 'express';
import {
  getUserNotifications,
  markNotificationRead,
  markAllRead,
} from '../services/notification.service';

export const listNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const result = await getUserNotifications(userId, page);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

export const readNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await markNotificationRead(id, req.user!.userId);
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const readAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await markAllRead(req.user!.userId);
    res.json({ success: true });
  } catch (e) { next(e); }
};
