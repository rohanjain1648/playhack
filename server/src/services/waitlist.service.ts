import prisma from '../db/prisma';
import { AppError } from '../utils/errors';
import { createNotification } from './notification.service';
import { emitSlotUpdate, emitToUser } from '../sockets/availabilitySocket';

const WAITLIST_WINDOW_MINUTES = 15;

export async function joinWaitlist(slotId: string, userId: string) {
  // Check slot exists and is booked
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { facility: true },
  });
  if (!slot) throw AppError.notFound('Slot not found');
  if (slot.status === 'available') {
    throw AppError.conflict('Slot is available — book it directly!');
  }

  // Check user isn't already on waitlist
  const existing = await prisma.waitlistItem.findUnique({
    where: { slotId_userId: { slotId, userId } },
  });
  if (existing && existing.isActive) {
    throw AppError.conflict('Already on waitlist for this slot');
  }

  // Get current max position
  const maxPos = await prisma.waitlistItem.aggregate({
    where: { slotId, isActive: true },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? 0) + 1;

  const item = await prisma.waitlistItem.upsert({
    where: { slotId_userId: { slotId, userId } },
    create: { slotId, userId, position, isActive: true },
    update: { position, isActive: true, notifiedAt: null, expiresAt: null },
  });

  // Notify user they joined waitlist
  await createNotification(userId, 'waitlist_joined', {
    slotId,
    position,
    facilityName: slot.facility.name,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
  });

  return { ...item, facilityName: slot.facility.name };
}

export async function leaveWaitlist(waitlistItemId: string, userId: string) {
  const item = await prisma.waitlistItem.findUnique({ where: { id: waitlistItemId } });
  if (!item) throw AppError.notFound('Waitlist entry not found');
  if (item.userId !== userId) throw AppError.forbidden('Not your waitlist entry');

  await prisma.waitlistItem.update({
    where: { id: waitlistItemId },
    data: { isActive: false },
  });

  // Reorder remaining waitlist positions
  await reorderWaitlist(item.slotId);
  return { success: true };
}

export async function getUserWaitlist(userId: string) {
  return prisma.waitlistItem.findMany({
    where: { userId, isActive: true },
    include: { slot: { include: { facility: true } } },
    orderBy: { joinedAt: 'asc' },
  });
}

/**
 * Called when a booking is cancelled.
 * Promotes the next eligible waitlist user with a 15-minute claim window.
 */
export async function promoteWaitlist(slotId: string): Promise<void> {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { facility: true },
  });
  if (!slot) return;

  // Get top waitlist entry (sorted by priority DESC then joinedAt ASC)
  const nextInLine = await prisma.$queryRaw<
    Array<{ id: string; user_id: string; position: number }>
  >`
    SELECT w.id, w.user_id, w.position
    FROM waitlist_items w
    JOIN users u ON u.id = w.user_id
    WHERE w.slot_id = ${slotId} AND w.is_active = true
    ORDER BY u.priority DESC, w.joined_at ASC
    LIMIT 1
  `;

  if (!nextInLine.length) return;

  const entry = nextInLine[0];
  const expiresAt = new Date(Date.now() + WAITLIST_WINDOW_MINUTES * 60 * 1000);

  await prisma.waitlistItem.update({
    where: { id: entry.id },
    data: { notifiedAt: new Date(), expiresAt },
  });

  // Notify the promoted user
  await createNotification(entry.user_id, 'waitlist_promoted', {
    slotId,
    facilityName: slot.facility.name,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    expiresAt,
    windowMinutes: WAITLIST_WINDOW_MINUTES,
  });

  // Real-time push to the user
  emitToUser(entry.user_id, 'waitlist:promoted', {
    slotId,
    facilityName: slot.facility.name,
    expiresAt,
  });
}

async function reorderWaitlist(slotId: string): Promise<void> {
  const items = await prisma.waitlistItem.findMany({
    where: { slotId, isActive: true },
    orderBy: { position: 'asc' },
  });
  await Promise.all(
    items.map((item, idx) =>
      prisma.waitlistItem.update({
        where: { id: item.id },
        data: { position: idx + 1 },
      })
    )
  );
}

// Cron: expire stale waitlist claims
export async function expireStaleWaitlistClaims(): Promise<void> {
  const expired = await prisma.waitlistItem.findMany({
    where: {
      isActive: true,
      notifiedAt: { not: null },
      expiresAt: { lt: new Date() },
    },
  });

  for (const item of expired) {
    await prisma.waitlistItem.update({
      where: { id: item.id },
      data: { isActive: false },
    });

    await createNotification(item.userId, 'waitlist_expired', {
      slotId: item.slotId,
    });

    // Try next in line
    await promoteWaitlist(item.slotId);
  }
}
