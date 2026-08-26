import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { executeBooking, BookingResult } from '../services/booking.service';
import { emitSlotUpdate } from '../sockets/availabilitySocket';
import { createNotification } from '../services/notification.service';

let bookingQueue: Queue & { events: QueueEvents };
let bookingWorker: Worker;
let redisConnection: IORedis;

export function initBookingQueue() {
  redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  bookingQueue = new Queue('bookings', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 1, // No retry — booking is idempotent within one request
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 3600 },
    },
  }) as Queue & { events: QueueEvents };

  // QueueEvents for waitUntilFinished
  bookingQueue.events = new QueueEvents('bookings', { connection: redisConnection.duplicate() });

  // Worker processes ONE job per slot at a time
  // Each unique slotId gets its own concurrency=1 effectively through job naming
  bookingWorker = new Worker(
    'bookings',
    async (job) => {
      const { slotId, userId } = job.data;
      const result: BookingResult = await executeBooking(slotId, userId);

      // Post-booking side effects (non-blocking for the transaction)
      if (result.success && result.booking && result.slot) {
        // Real-time availability update to all clients watching this facility/date
        emitSlotUpdate(
          result.slot.facilityId,
          result.slot.date instanceof Date
            ? result.slot.date.toISOString().split('T')[0]
            : String(result.slot.date).split('T')[0],
          { slotId, status: 'booked' }
        );

        // Create in-app notification for the user
        await createNotification(userId, 'booking_confirmed', {
          bookingId: result.booking.id,
          slotId,
          facilityName: result.facility?.name,
          date: result.slot.date,
          startTime: result.slot.startTime,
          endTime: result.slot.endTime,
        });
      }

      return result;
    },
    {
      connection: redisConnection.duplicate(),
      concurrency: 50, // 50 concurrent workers but each slot is queued individually
    }
  );

  bookingWorker.on('failed', (job, err) => {
    console.error(`[BookingQueue] Job ${job?.id} failed:`, err.message);
  });

  console.log('[BookingQueue] Initialized');
  return bookingQueue;
}

export function getBookingQueue(): Queue & { events: QueueEvents } {
  if (!bookingQueue) {
    return initBookingQueue();
  }
  return bookingQueue;
}

export async function closeBookingQueue() {
  await bookingWorker?.close();
  await bookingQueue?.close();
  await redisConnection?.quit();
}
