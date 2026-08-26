import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import facilityRoutes from './routes/facility.routes';
import slotRoutes from './routes/slot.routes';
import bookingRoutes from './routes/booking.routes';
import waitlistRoutes from './routes/waitlist.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import demoRoutes from './routes/demo.routes';
import { errorHandler } from './middleware/error.middleware';

export function createApp(): Application {
  const app = express();

  // ── Security & Parsing ────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── Rate Limiting ─────────────────────────────────────────
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  });

  const bookingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many booking requests' } },
  });

  app.use(generalLimiter);
  app.use('/api/bookings', bookingLimiter);

  // ── Health Check ──────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'iitg-sports-api' });
  });

  // ── API Routes ────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/facilities', facilityRoutes);
  app.use('/api/slots', slotRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/waitlist', waitlistRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/demo', demoRoutes);

  // ── 404 Handler ───────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // ── Error Handler ─────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
