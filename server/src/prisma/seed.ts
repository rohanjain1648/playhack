import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, format } from '../utils/date';

const prisma = new PrismaClient();

// ── Facility definitions ──────────────────────────────────────
const FACILITIES = [
  {
    name: 'SAC Gymnasium',
    type: 'gym',
    capacity: 30,
    description: 'State-of-the-art gymnasium with cardio and weight training equipment at the Student Activity Center.',
    location: 'Student Activity Center (SAC), IIT Guwahati',
    slotDuration: 60, // minutes
    openHour: 6,
    closeHour: 22,
  },
  {
    name: 'Tennis Court A',
    type: 'tennis',
    capacity: 4,
    description: 'Full-size synthetic tennis court with floodlights for evening sessions.',
    location: 'Sports Complex, IIT Guwahati',
    slotDuration: 60,
    openHour: 6,
    closeHour: 22,
  },
  {
    name: 'Tennis Court B',
    type: 'tennis',
    capacity: 4,
    description: 'Full-size synthetic tennis court with floodlights for evening sessions.',
    location: 'Sports Complex, IIT Guwahati',
    slotDuration: 60,
    openHour: 6,
    closeHour: 22,
  },
  {
    name: 'Badminton Court 1',
    type: 'badminton',
    capacity: 4,
    description: 'Indoor badminton court with wooden flooring and proper lighting.',
    location: 'Indoor Sports Hall, IIT Guwahati',
    slotDuration: 60,
    openHour: 6,
    closeHour: 22,
  },
  {
    name: 'Badminton Court 2',
    type: 'badminton',
    capacity: 4,
    description: 'Indoor badminton court with wooden flooring and proper lighting.',
    location: 'Indoor Sports Hall, IIT Guwahati',
    slotDuration: 60,
    openHour: 6,
    closeHour: 22,
  },
  {
    name: 'Badminton Court 3',
    type: 'badminton',
    capacity: 4,
    description: 'Indoor badminton court with wooden flooring and proper lighting.',
    location: 'Indoor Sports Hall, IIT Guwahati',
    slotDuration: 60,
    openHour: 6,
    closeHour: 22,
  },
  {
    name: 'Football Ground',
    type: 'football',
    capacity: 22,
    description: 'FIFA-standard natural grass football ground with goal posts and boundary markings.',
    location: 'Main Sports Ground, IIT Guwahati',
    slotDuration: 90,
    openHour: 6,
    closeHour: 20,
  },
  {
    name: 'Cricket Ground',
    type: 'cricket',
    capacity: 22,
    description: 'Full-size cricket ground with practice nets and pavilion.',
    location: 'Main Sports Ground, IIT Guwahati',
    slotDuration: 120,
    openHour: 6,
    closeHour: 18,
  },
  {
    name: 'Swimming Pool',
    type: 'swimming',
    capacity: 20,
    description: '50-meter Olympic-size swimming pool with lane dividers.',
    location: 'Aquatic Center, IIT Guwahati',
    slotDuration: 60,
    openHour: 6,
    closeHour: 20,
  },
  {
    name: 'Table Tennis Hall',
    type: 'table_tennis',
    capacity: 8,
    description: 'Indoor hall with 4 regulation table tennis tables.',
    location: 'Indoor Sports Hall, IIT Guwahati',
    slotDuration: 60,
    openHour: 8,
    closeHour: 22,
  },
];

// ── Helper: generate time slots for a facility on a given date ─
function generateSlotsForDate(
  facilityId: string,
  date: Date,
  openHour: number,
  closeHour: number,
  slotDurationMinutes: number
): { facilityId: string; date: Date; startTime: string; endTime: string }[] {
  const slots = [];
  let current = openHour * 60; // minutes from midnight
  const close = closeHour * 60;

  while (current + slotDurationMinutes <= close) {
    const startH = Math.floor(current / 60).toString().padStart(2, '0');
    const startM = (current % 60).toString().padStart(2, '0');
    const endTotal = current + slotDurationMinutes;
    const endH = Math.floor(endTotal / 60).toString().padStart(2, '0');
    const endM = (endTotal % 60).toString().padStart(2, '0');

    slots.push({
      facilityId,
      date,
      startTime: `${startH}:${startM}`,
      endTime: `${endH}:${endM}`,
    });

    current += slotDurationMinutes;
  }
  return slots;
}

async function main() {
  console.log('🌱 Starting seed...');

  // ── Clean existing data ──
  await prisma.notification.deleteMany();
  await prisma.waitlistItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.maintenanceWindow.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.user.deleteMany();

  // ── Create admin user ──
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.create({
    data: {
      rollNo: 'ADMIN001',
      name: 'Sports Admin',
      email: 'admin@iitg.ac.in',
      passwordHash: adminHash,
      role: 'admin',
      priority: 100,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ── Create demo student users ──
  const studentHash = await bcrypt.hash('Student@123', 12);
  const students = await Promise.all(
    [
      { rollNo: '2201001', name: 'Arjun Sharma', email: 'arjun@iitg.ac.in' },
      { rollNo: '2201002', name: 'Priya Nair', email: 'priya@iitg.ac.in' },
      { rollNo: '2201003', name: 'Rahul Gupta', email: 'rahul@iitg.ac.in' },
      { rollNo: '2201004', name: 'Sneha Reddy', email: 'sneha@iitg.ac.in' },
      { rollNo: '2201005', name: 'Vikram Singh', email: 'vikram@iitg.ac.in' },
    ].map((s) =>
      prisma.user.create({
        data: { ...s, passwordHash: studentHash, role: 'student', priority: 0 },
      })
    )
  );
  console.log(`✅ ${students.length} student users created`);

  // ── Create facilities ──
  const createdFacilities = [];
  for (const f of FACILITIES) {
    const { slotDuration, openHour, closeHour, ...facilityData } = f;
    const facility = await prisma.facility.create({
      data: {
        ...facilityData,
        imageUrl: null,
      },
    });
    createdFacilities.push({ ...facility, slotDuration, openHour, closeHour });
  }
  console.log(`✅ ${createdFacilities.length} facilities created`);

  // ── Generate slots for next 14 days ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalSlots = 0;
  for (const facility of createdFacilities) {
    const slotData = [];
    for (let d = 0; d < 14; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);

      const daySlots = generateSlotsForDate(
        facility.id,
        date,
        facility.openHour,
        facility.closeHour,
        facility.slotDuration
      );
      slotData.push(...daySlots);
    }

    await prisma.slot.createMany({ data: slotData, skipDuplicates: true });
    totalSlots += slotData.length;
  }
  console.log(`✅ ${totalSlots} slots generated for next 14 days`);

  // ── Create some demo bookings (realistic scenario) ──
  const firstFacility = createdFacilities[0];
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(today.getDate() + 1);

  const tomorrowSlots = await prisma.slot.findMany({
    where: {
      facilityId: firstFacility.id,
      date: tomorrowDate,
    },
    take: 3,
    orderBy: { startTime: 'asc' },
  });

  for (let i = 0; i < Math.min(tomorrowSlots.length, students.length, 2); i++) {
    await prisma.booking.create({
      data: {
        slotId: tomorrowSlots[i].id,
        userId: students[i].id,
        status: 'confirmed',
      },
    });
    await prisma.slot.update({
      where: { id: tomorrowSlots[i].id },
      data: { status: 'booked' },
    });
  }
  console.log('✅ Demo bookings created');

  // ── Add a maintenance window ──
  const maintenanceDate = new Date(today);
  maintenanceDate.setDate(today.getDate() + 3);

  await prisma.maintenanceWindow.create({
    data: {
      facilityId: createdFacilities[0].id,
      startDt: new Date(maintenanceDate.setHours(8, 0, 0, 0)),
      endDt: new Date(maintenanceDate.setHours(12, 0, 0, 0)),
      reason: 'Routine equipment maintenance and floor polishing',
      createdBy: admin.id,
    },
  });
  console.log('✅ Demo maintenance window created');

  console.log('\n🎉 Seed complete!');
  console.log('─'.repeat(50));
  console.log('Admin credentials:  admin@iitg.ac.in  /  Admin@123');
  console.log('Student credentials: arjun@iitg.ac.in /  Student@123');
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
