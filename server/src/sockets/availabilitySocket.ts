import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || 'fallback_access'
        ) as { userId: string; role: string };
        (socket as any).userId = payload.userId;
        (socket as any).role = payload.role;
      } catch {
        // Anonymous connection OK for availability watching
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    if (userId) {
      // Join personal room for targeted notifications
      socket.join(`user:${userId}`);
      console.log(`[Socket] User ${userId} connected`);
    }

    // Client subscribes to a facility+date room for live availability
    socket.on('subscribe:facility', ({ facilityId, date }: { facilityId: string; date: string }) => {
      const room = `facility:${facilityId}:${date}`;
      socket.join(room);
    });

    socket.on('unsubscribe:facility', ({ facilityId, date }: { facilityId: string; date: string }) => {
      const room = `facility:${facilityId}:${date}`;
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      if (userId) console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  console.log('[Socket.IO] Initialized');
  return io;
}

/**
 * Emit slot status update to everyone watching this facility+date.
 * Called after a booking is created or cancelled.
 */
export function emitSlotUpdate(
  facilityId: string,
  date: string,
  payload: { slotId: string; status: string }
): void {
  if (!io) return;
  const room = `facility:${facilityId}:${date}`;
  io.to(room).emit('slot:updated', { ...payload, facilityId, date, timestamp: new Date() });
}

/**
 * Emit a targeted event to a specific user (notifications, waitlist promotion).
 */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function getIO(): SocketIOServer {
  return io;
}
