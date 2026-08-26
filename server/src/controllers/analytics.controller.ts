import { Request, Response, NextFunction } from 'express';
import {
  getFacilityUsage,
  getPeakHoursData,
  getBookingTrends,
  getNoShowStats,
  getFacilityLeaderboard,
} from '../services/analytics.service';

export const usageStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facilityId } = req.query;
    const data = await getFacilityUsage(facilityId as string | undefined);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const peakHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facilityId } = req.query;
    const data = await getPeakHoursData(facilityId as string | undefined);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const bookingTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getBookingTrends();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const noShowStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getNoShowStats();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const leaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getFacilityLeaderboard();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
