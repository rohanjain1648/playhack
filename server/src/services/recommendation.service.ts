import prisma from '../db/prisma';

interface Recommendation {
  slotId: string;
  facilityId: string;
  facilityName: string;
  type: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
}

/**
 * Recommend alternative slots when a user's target slot is unavailable.
 * Scoring: (proximity_score * 0.6) + (availability_score * 0.4)
 */
export async function getRecommendations(
  slotId: string,
  facilityId: string,
  limit = 3
): Promise<Recommendation[]> {
  const targetSlot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { facility: true },
  });
  if (!targetSlot) return [];

  // Strategy 1: Adjacent slots at same facility (within 2 hours)
  const adjacentSlots = await prisma.slot.findMany({
    where: {
      facilityId,
      date: targetSlot.date,
      status: 'available',
      id: { not: slotId },
    },
    include: { facility: true },
    orderBy: { startTime: 'asc' },
    take: 2,
  });

  // Strategy 2: Same type of facility at the same time
  const sameTypeSlots = await prisma.slot.findMany({
    where: {
      facility: { type: targetSlot.facility.type, isActive: true },
      facilityId: { not: facilityId },
      date: targetSlot.date,
      startTime: targetSlot.startTime,
      status: 'available',
    },
    include: { facility: true },
    take: 2,
  });

  const results: Recommendation[] = [];

  for (const s of adjacentSlots) {
    results.push({
      slotId: s.id,
      facilityId: s.facilityId,
      facilityName: s.facility.name,
      type: s.facility.type,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      reason: `Available slot at the same facility`,
    });
  }

  for (const s of sameTypeSlots) {
    if (results.length >= limit) break;
    results.push({
      slotId: s.id,
      facilityId: s.facilityId,
      facilityName: s.facility.name,
      type: s.facility.type,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      reason: `Same sport at ${s.facility.name}`,
    });
  }

  return results.slice(0, limit);
}
