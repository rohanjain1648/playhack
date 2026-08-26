import 'dotenv/config';
import http from 'http';
import cron from 'node-cron';
import { createApp } from './app';
import { initSocket } from './sockets/availabilitySocket';
import { initBookingQueue, closeBookingQueue } from './jobs/bookingQueue';
import { expireStaleWaitlistClaims } from './services/waitlist.service';
import prisma from './db/prisma';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function bootstrap() {
  // Verify DB connection
  await prisma.$connect();
  console.log('[DB] Connected to PostgreSQL');

  const app = createApp();
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  initSocket(httpServer);

  // Initialize BullMQ booking queue
  initBookingQueue();

  // Cron: expire stale waitlist claims every minute
  cron.schedule('* * * * *', async () => {
    await expireStaleWaitlistClaims();
  });

  // Cron: generate slots for upcoming days (runs at midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('[SlotGenerator] Generating slots for upcoming days...');
    // Slot generation logic runs via seed-like process
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] ${signal} received — shutting down gracefully`);
    await closeBookingQueue();
    await prisma.$disconnect();
    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 IIT-G Sports API running on http://localhost:${PORT}`);
    console.log(`   Socket.IO: ws://localhost:${PORT}`);
    console.log(`   Health:    http://localhost:${PORT}/health`);
    console.log(`   Env:       ${process.env.NODE_ENV || 'development'}\n`);
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal error:', err);
  process.exit(1);
});
