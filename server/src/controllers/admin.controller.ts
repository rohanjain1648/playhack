import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../utils/errors';
import { emitSlotUpdate } from '../sockets/availabilitySocket';
import { minutesToTimeString } from '../utils/date';

// ── Admin: List all bookings ──────────────────────────────────
export const adminListBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facilityId, date, status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (facilityId || date) {
      where.slot = {};
      if (facilityId) where.slot.facilityId = facilityId;
      if (date) where.slot.date = new Date(date as string);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          slot: { include: { facility: true } },
          user: { select: { id: true, name: true, email: true, rollNo: true } },
        },
        orderBy: { bookedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ success: true, data: bookings, total });
  } catch (e) {
    next(e);
  }
};

// ── Admin: Create maintenance window ─────────────────────────
export const createMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facilityId, startDt, endDt, reason } = req.body;
    if (!facilityId || !startDt || !endDt) {
      throw AppError.validation('facilityId, startDt, endDt are required');
    }

    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility) throw AppError.notFound('Facility not found');

    const start = new Date(startDt);
    const end = new Date(endDt);
    if (start >= end) throw AppError.validation('startDt must be before endDt');

    const maintenance = await prisma.maintenanceWindow.create({
      data: {
        facilityId,
        startDt: start,
        endDt: end,
        reason,
        createdBy: req.user!.userId,
      },
    });

    // Mark affected slots as maintenance
    const affectedSlots = await prisma.slot.findMany({
      where: {
        facilityId,
        status: 'available',
        date: { gte: start, lte: end },
      },
    });

    if (affectedSlots.length) {
      await prisma.slot.updateMany({
        where: { id: { in: affectedSlots.map((s) => s.id) } },
        data: { status: 'maintenance' },
      });

      // Emit updates for each unique date
      const dates = [...new Set(affectedSlots.map((s) => s.date.toISOString().split('T')[0]))];
      for (const date of dates) {
        const slotsOnDate = affectedSlots.filter(
          (s) => s.date.toISOString().split('T')[0] === date
        );
        for (const slot of slotsOnDate) {
          emitSlotUpdate(facilityId, date, { slotId: slot.id, status: 'maintenance' });
        }
      }
    }

    res.status(201).json({ success: true, data: maintenance, affectedSlots: affectedSlots.length });
  } catch (e) {
    next(e);
  }
};

// ── Admin: Override slot status ───────────────────────────────
export const overrideSlotStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['available', 'closed', 'maintenance'];
    if (!validStatuses.includes(status)) {
      throw AppError.validation(`status must be one of: ${validStatuses.join(', ')}`);
    }

    const slot = await prisma.slot.update({
      where: { id },
      data: { status },
      include: { facility: true },
    });

    emitSlotUpdate(
      slot.facilityId,
      slot.date.toISOString().split('T')[0],
      { slotId: slot.id, status }
    );

    res.json({ success: true, data: slot });
  } catch (e) {
    next(e);
  }
};

// ── Admin: List maintenance windows ──────────────────────────
export const listMaintenanceWindows = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const windows = await prisma.maintenanceWindow.findMany({
      include: {
        facility: { select: { name: true, type: true } },
        creator: { select: { name: true } },
      },
      orderBy: { startDt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: windows });
  } catch (e) {
    next(e);
  }
};

// ── Admin: Manage facilities ──────────────────────────────────
export const createFacility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, capacity, description, location, imageUrl } = req.body;
    if (!name || !type || !capacity) {
      throw AppError.validation('name, type, capacity are required');
    }
    const facility = await prisma.facility.create({
      data: { name, type, capacity: parseInt(capacity), description, location, imageUrl },
    });
    res.status(201).json({ success: true, data: facility });
  } catch (e) {
    next(e);
  }
};

export const toggleFacility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const facility = await prisma.facility.findUnique({ where: { id } });
    if (!facility) throw AppError.notFound('Facility not found');
    const updated = await prisma.facility.update({
      where: { id },
      data: { isActive: !facility.isActive },
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

// ── Admin: Set user priority ──────────────────────────────────
export const setUserPriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { priority } = req.body;
    if (typeof priority !== 'number') throw AppError.validation('priority must be a number');
    const user = await prisma.user.update({
      where: { id: userId },
      data: { priority },
      select: { id: true, name: true, priority: true },
    });
    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, rollNo: true, role: true, priority: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (e) {
    next(e);
  }
};
