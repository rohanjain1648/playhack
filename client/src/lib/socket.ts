import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      auth: token ? { token } : {},
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket!.id);
    });
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function updateSocketAuth(token: string) {
  if (socket) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToFacility(facilityId: string, date: string) {
  getSocket().emit('subscribe:facility', { facilityId, date });
}

export function unsubscribeFromFacility(facilityId: string, date: string) {
  getSocket().emit('unsubscribe:facility', { facilityId, date });
}
