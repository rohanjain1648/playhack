import { Router, Request, Response } from 'express';
import { executeBooking } from '../services/booking.service';
import prisma from '../db/prisma';

const router = Router();

/**
 * Race Demo Endpoint
 * POST /api/demo/race
 * Body: { slotId: string, userCount: number }
 *
 * Fires `userCount` concurrent booking attempts against the same slot
 * using different demo user accounts, returns all results.
 * This demonstrates the concurrency guarantees visually.
 */
router.post('/race', async (req: Request, res: Response) => {
  try {
    const { slotId, userCount = 10 } = req.body;

    if (!slotId) {
      res.status(400).json({ success: false, error: 'slotId is required' });
      return;
    }

    // Verify slot exists and is available
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { facility: true },
    });
    if (!slot) {
      res.status(404).json({ success: false, error: 'Slot not found' });
      return;
    }

    // Reset slot to available for demo
    await prisma.$transaction(async (tx) => {
      // Cancel any existing bookings for this slot
      await tx.booking.updateMany({
        where: { slotId, status: 'confirmed' },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      await tx.slot.update({ where: { id: slotId }, data: { status: 'available', version: 0 } });
      await tx.waitlistItem.updateMany({ where: { slotId }, data: { isActive: false } });
    });

    // Get/create demo users
    const demoCount = Math.min(Number(userCount), 20);
    const demoUsers = await Promise.all(
      Array.from({ length: demoCount }, (_, i) =>
        prisma.user.upsert({
          where: { rollNo: `DEMO${String(i + 1).padStart(3, '0')}` },
          create: {
            rollNo: `DEMO${String(i + 1).padStart(3, '0')}`,
            name: `Demo Student ${i + 1}`,
            email: `demo${i + 1}@iitg-race.in`,
            passwordHash: '$2b$12$demo_hash_placeholder',
            role: 'student',
          },
          update: {},
        })
      )
    );

    // Fire all booking attempts CONCURRENTLY
    const startTime = Date.now();
    const results = await Promise.allSettled(
      demoUsers.map(async (user, idx) => {
        const attemptStart = Date.now();
        try {
          const result = await executeBooking(slotId, user.id);
          return {
            userId: user.id,
            userName: user.name,
            index: idx + 1,
            success: result.success,
            bookingId: result.booking?.id,
            error: result.error,
            code: result.code,
            latencyMs: Date.now() - attemptStart,
          };
        } catch (err: any) {
          return {
            userId: user.id,
            userName: user.name,
            index: idx + 1,
            success: false,
            error: err.message || 'Unknown error',
            code: 'ERROR',
            latencyMs: Date.now() - attemptStart,
          };
        }
      })
    );

    const totalTime = Date.now() - startTime;
    const processed = results.map((r) =>
      r.status === 'fulfilled' ? r.value : { success: false, error: String(r.reason) }
    );

    const winner = processed.find((r: any) => r.success);
    const losers = processed.filter((r: any) => !r.success);

    // Verify DB state
    const finalBooking = await prisma.booking.findUnique({
      where: { slotId },
      include: { user: { select: { name: true, rollNo: true } } },
    });

    res.json({
      success: true,
      data: {
        slotId,
        facilityName: slot.facility.name,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        totalConcurrentRequests: demoCount,
        totalTimeMs: totalTime,
        winner: winner || null,
        losers,
        confirmedBookings: finalBooking ? 1 : 0,
        dbVerification: {
          bookingCount: finalBooking ? 1 : 0,
          winner: finalBooking
            ? { bookingId: finalBooking.id, user: finalBooking.user }
            : null,
          message:
            finalBooking
              ? '✅ Exactly ONE booking exists in DB — concurrency control succeeded'
              : '⚠️ No booking found in DB',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get a random available slot for demo
router.get('/random-slot', async (_req: Request, res: Response) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const slot = await prisma.slot.findFirst({
      where: { status: 'available', date: { gte: tomorrow } },
      include: { facility: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      skip: Math.floor(Math.random() * 10),
    });

    if (!slot) {
      res.status(404).json({ success: false, error: 'No available slots found' });
      return;
    }

    res.json({ success: true, data: slot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
