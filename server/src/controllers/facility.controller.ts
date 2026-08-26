import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../utils/errors';

export const listFacilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    const facilities = await prisma.facility.findMany({
      where: {
        isActive: true,
        ...(type ? { type: type as string } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: facilities });
  } catch (e) {
    next(e);
  }
};

export const getFacility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const facility = await prisma.facility.findUnique({ where: { id } });
    if (!facility) throw AppError.notFound('Facility not found');

    // Get upcoming availability summary (next 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const slotStats = await prisma.slot.groupBy({
      by: ['date', 'status'],
      where: {
        facilityId: id,
        date: { gte: today, lte: nextWeek },
      },
      _count: { id: true },
    });

    res.json({ success: true, data: { facility, slotStats } });
  } catch (e) {
    next(e);
  }
};
