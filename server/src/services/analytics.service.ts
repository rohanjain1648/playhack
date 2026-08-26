import prisma from '../db/prisma';

export async function getFacilityUsage(facilityId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const where = facilityId ? { facilityId } : {};

  const [totalSlots, bookedSlots, cancelledBookings, facilities] = await Promise.all([
    prisma.slot.count({ where: { ...where, date: { gte: thirtyDaysAgo, lte: today } } }),
    prisma.slot.count({ where: { ...where, status: 'booked', date: { gte: thirtyDaysAgo, lte: today } } }),
    prisma.booking.count({
      where: {
        status: 'cancelled',
        slot: { ...where, date: { gte: thirtyDaysAgo, lte: today } },
      },
    }),
    prisma.facility.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true } }),
  ]);

  const utilizationRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  return { totalSlots, bookedSlots, cancelledBookings, utilizationRate, facilities };
}

export async function getPeakHoursData(facilityId?: string) {
  // Group bookings by day of week and hour
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      slot: facilityId ? { facilityId } : {},
    },
    include: { slot: { select: { startTime: true, date: true, facilityId: true } } },
    take: 5000,
  });

  // Build heatmap: hour (0-23) × dayOfWeek (0-6) → count
  const heatmap: Record<string, number> = {};
  for (const booking of bookings) {
    const hour = parseInt(booking.slot.startTime.split(':')[0]);
    const day = new Date(booking.slot.date).getDay();
    const key = `${day}:${hour}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  }

  return { heatmap };
}

export async function getBookingTrends() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const daily = await prisma.booking.groupBy({
    by: ['bookedAt'],
    where: { bookedAt: { gte: sevenDaysAgo }, status: 'confirmed' },
    _count: { id: true },
    orderBy: { bookedAt: 'asc' },
  });

  // Group by date string
  const byDate: Record<string, number> = {};
  for (const row of daily) {
    const d = new Date(row.bookedAt).toISOString().split('T')[0];
    byDate[d] = (byDate[d] || 0) + row._count.id;
  }

  return { daily: byDate };
}

export async function getNoShowStats() {
  const noShows = await prisma.booking.count({ where: { status: 'no_show' } });
  const total = await prisma.booking.count({ where: { status: { in: ['confirmed', 'no_show'] } } });
  return { noShows, total, rate: total > 0 ? Math.round((noShows / total) * 100) : 0 };
}

export async function getFacilityLeaderboard() {
  const results = await prisma.slot.groupBy({
    by: ['facilityId'],
    where: { status: 'booked' },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const withNames = await Promise.all(
    results.map(async (r) => {
      const f = await prisma.facility.findUnique({
        where: { id: r.facilityId },
        select: { name: true, type: true },
      });
      return { facilityId: r.facilityId, name: f?.name, type: f?.type, bookingCount: r._count.id };
    })
  );
  return withNames;
}
