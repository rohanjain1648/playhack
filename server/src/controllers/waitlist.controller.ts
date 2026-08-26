import { Request, Response, NextFunction } from 'express';
import { joinWaitlist, leaveWaitlist, getUserWaitlist } from '../services/waitlist.service';

export const joinWaitlistHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slotId } = req.body;
    const userId = req.user!.userId;
    const result = await joinWaitlist(slotId, userId);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
};

export const leaveWaitlistHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await leaveWaitlist(id, userId);
    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (e) { next(e); }
};

export const myWaitlistHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const items = await getUserWaitlist(userId);
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};
