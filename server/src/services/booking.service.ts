import prisma from '../db/prisma';
import { AppError } from '../utils/errors';
import { getBookingQueue } from '../jobs/bookingQueue';
import { emitSlotUpdate } from '../sockets/availabilitySocket';
import { createNotification } from './notification.service';
import { promoteWaitlist } from './waitlist.service';
import { getRecommendations } from './recommendation.service';

export interface BookingResult {
  success: boolean;
  booking?: {
    id: string;
    slotId: string;
    userId: string;
    status: string;
    bookedAt: Date;
  };
  slot?: {
    id: string;
    facilityId: string;
    date: Date;
    startTime: string;
    endTime: string;
  };
  facility?: { id: string; name: string; type: string };
  recommendations?: Array<{ slotId: string; facilityId: string; reason: string }>;
  error?: string;
  code?: string;
}

/**
 * Core booking function with three-layer concurrency protection:
 *
 * Layer 1: BullMQ per-slot queue (application layer) — serializes all booking
 *          attempts for the same slot at the queue level.
 *
 * Layer 2: PostgreSQL SELECT FOR UPDATE (transaction layer) — row-level lock
 *          on the slot row prevents any race between concurrent DB transactions.
 *
 * Layer 3: UNIQUE constraint on bookings.slot_id (schema layer) — absolute
 *          guarantee at the DB level, even if the above layers are bypassed.
 */
export async function createBooking(
  slotId: string,
  userId: string
): Promise<BookingResult> {
  const queue = getBookingQueue();

  // Enqueue this booking request — the queue processes one job per slot at a time
  const result = await queue.add<BookingResult>(
    'create-booking',
    { slotId, userId },
    {
      jobId: `booking_${slotId}_${userId}_${Date.now()}`,
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 3600 },
    }
  );

  // Wait for the job result (queue worker processes it)
  const completed = await result.waitUntilFinished(queue.events as any, 15000);
  return completed as BookingResult;
}

/**
 * The actual booking logic executed inside the BullMQ worker.
 * This is called serially per-slot, never concurrently.
 */
export async function executeBooking(
  slotId: string,
  userId: string
): Promise<BookingResult> {
  // Use a Prisma interactive transaction with a raw SQL lock
  return await prisma.$transaction(
    async (tx) => {
      // ── Layer 2: SELECT FOR UPDATE ────────────────────────────────────
      // Acquires a row-level lock on this specific slot row.
      // Any other transaction attempting to lock this same row will block
      // until this transaction commits or rolls back.
      const lockedSlots = await tx.$queryRaw<
        Array<{ id: string; status: string; facility_id: string; date: Date; start_time: string; end_time: string; version: number }>
      >`
        SELECT s.id, s.status, s.facility_id, s.date, s.start_time, s.end_time, s.version
        FROM slots s
        WHERE s.id = ${slotId}
        FOR UPDATE
      `;

      if (!lockedSlots.length) {
        return { success: false, error: 'Slot not found', code: 'NOT_FOUND' };
      }

      const slot = lockedSlots[0];

      // Check status INSIDE the lock — we now own this row
      if (slot.status !== 'available') {
        // Get recommendations for alternatives
        const recommendations = await getRecommendations(slotId, slot.facility_id);
        return {
          success: false,
          error: 'Slot is no longer available',
          code: 'SLOT_UNAVAILABLE',
          recommendations,
        };
      }

      // Check user doesn't already have this slot booked
      const existingBooking = await tx.booking.findFirst({
        where: { userId, slot: { facilityId: slot.facility_id, date: slot.date } },
      });
      if (existingBooking) {
        return {
          success: false,
          error: 'You already have a booking for this facility on this date',
          code: 'ALREADY_BOOKED',
        };
      }

      // ── Layer 3: INSERT (protected by UNIQUE constraint on slot_id) ───
      // Even if two transactions somehow passed the FOR UPDATE simultaneously
      // (which shouldn't happen), this INSERT would fail for the second one.
      const booking = await tx.booking.create({
        data: { slotId, userId, status: 'confirmed' },
        select: { id: true, slotId: true, userId: true, status: true, bookedAt: true },
      });

      // Update slot status to 'booked' with optimistic version increment
      await tx.$executeRaw`
        UPDATE slots SET status = 'booked', version = version + 1
        WHERE id = ${slotId}
      `;

      const facilityData = await tx.facility.findUnique({
        where: { id: slot.facility_id },
        select: { id: true, name: true, type: true },
      });

      return {
        success: true,
        booking,
        slot: {
          id: slot.id,
          facilityId: slot.facility_id,
          date: slot.date,
          startTime: slot.start_time,
          endTime: slot.end_time,
        },
        facility: facilityData || undefined,
      };
    },
    {
      // Serializable isolation prevents phantom reads
      isolationLevel: 'Serializable',
      timeout: 10000,
    }
  );
}

export async function cancelBooking(
  bookingId: string,
  userId: string
): Promise<{ success: boolean }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { slot: { include: { facility: true } } },
  });

  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.userId !== userId) throw AppError.forbidden('Not your booking');
  if (booking.status !== 'confirmed') throw AppError.conflict('Booking is not active');

  // Check slot is in future
  const slotDate = new Date(booking.slot.date);
  slotDate.setHours(
    parseInt(booking.slot.startTime.split(':')[0]),
    parseInt(booking.slot.startTime.split(':')[1])
  );
  if (slotDate <= new Date()) {
    throw AppError.conflict('Cannot cancel a past booking');
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    await tx.slot.update({
      where: { id: booking.slotId },
      data: { status: 'available', version: { increment: 1 } },
    });
  });

  // Emit real-time update
  emitSlotUpdate(booking.slot.facilityId, booking.slot.date.toISOString().split('T')[0], {
    slotId: booking.slotId,
    status: 'available',
  });

  // Trigger waitlist promotion
  await promoteWaitlist(booking.slotId);

  return { success: true };
}

export async function getUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      slot: { include: { facility: true } },
    },
    orderBy: { bookedAt: 'desc' },
  });
}
