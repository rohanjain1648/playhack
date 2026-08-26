import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../utils/errors';

export const getSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facilityId, date } = req.query;

    if (!facilityId || !date) {
      throw AppError.validation('facilityId and date are required');
    }

    const parsedDate = new Date(date as string);
    if (isNaN(parsedDate.getTime())) {
      throw AppError.validation('Invalid date format. Use YYYY-MM-DD');
    }
    parsedDate.setHours(0, 0, 0, 0);

    const slots = await prisma.slot.findMany({
      where: {
        facilityId: facilityId as string,
        date: parsedDate,
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            user: { select: { name: true } },
          },
        },
        _count: { select: { waitlistItems: { where: { isActive: true } } } },
      },
      orderBy: { startTime: 'asc' },
    });

    // If requesting user is authenticated, check their waitlist status per slot
    const userId = (req as any).user?.userId;
    let userWaitlistMap: Record<string, boolean> = {};
    if (userId) {
      const userWaitlists = await prisma.waitlistItem.findMany({
        where: {
          userId,
          slot: { facilityId: facilityId as string, date: parsedDate },
          isActive: true,
        },
        select: { slotId: true, position: true },
      });
      userWaitlistMap = Object.fromEntries(userWaitlists.map((w) => [w.slotId, true]));
    }

    const enriched = slots.map((slot) => ({
      ...slot,
      waitlistCount: slot._count.waitlistItems,
      userOnWaitlist: !!userWaitlistMap[slot.id],
    }));

    res.json({ success: true, data: enriched });
  } catch (e) {
    next(e);
  }
};

export const getSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const slot = await prisma.slot.findUnique({
      where: { id },
      include: {
        facility: true,
        booking: {
          select: { id: true, status: true, bookedAt: true },
        },
        _count: { select: { waitlistItems: { where: { isActive: true } } } },
      },
    });
    if (!slot) throw AppError.notFound('Slot not found');
    res.json({ success: true, data: slot });
  } catch (e) {
    next(e);
  }
};

export const getAvailableDates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facilityId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeks = new Date(today);
    twoWeeks.setDate(today.getDate() + 14);

    const dates = await prisma.slot.findMany({
      where: {
        facilityId,
        date: { gte: today, lte: twoWeeks },
        status: 'available',
      },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, data: dates.map((d) => d.date) });
  } catch (e) {
    next(e);
  }
};
