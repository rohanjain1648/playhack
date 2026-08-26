import prisma from '../db/prisma';
import { NotificationType } from '@prisma/client';
import { emitToUser } from '../sockets/availabilitySocket';

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, payload },
    });

    // Push real-time notification to user's socket room
    emitToUser(userId, 'notification:new', {
      id: notification.id,
      type,
      payload,
      createdAt: notification.createdAt,
    });
  } catch (e) {
    // Notifications are non-critical — don't fail booking for them
    console.error('[NotificationService] Failed to create notification:', e);
  }
}

export async function getUserNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { items, total, unreadCount, page, limit };
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
