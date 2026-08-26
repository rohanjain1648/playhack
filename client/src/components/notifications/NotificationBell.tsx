import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../store/authStore';
import type { Notification } from '../../types';
import './Notification.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data as { items: Notification[]; unreadCount: number };
    },
    enabled: !!token,
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markSingleRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    const handleNewNotif = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification:new', handleNewNotif);
    socket.on('waitlist:promoted', handleNewNotif);

    return () => {
      socket.off('notification:new', handleNewNotif);
      socket.off('waitlist:promoted', handleNewNotif);
    };
  }, [token, queryClient]);

  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="notif-container">
      <button
        className="notif-bell-btn"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown animate-fade-in-down">
          <div className="notif-header">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <button
                className="notif-mark-read-btn"
                onClick={() => markAllReadMutation.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {!data?.items?.length ? (
              <div className="notif-empty">No notifications yet</div>
            ) : (
              data.items.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'notif-item-unread' : ''}`}
                  onClick={() => markSingleRead(n.id)}
                >
                  <div className="notif-icon">
                    {n.type === 'booking_confirmed' && '🎉'}
                    {n.type === 'waitlist_promoted' && '⚡'}
                    {n.type === 'waitlist_joined' && '⏳'}
                    {n.type === 'booking_cancelled' && '🚫'}
                    {n.type === 'waitlist_expired' && '⌛'}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">
                      {n.type === 'booking_confirmed' && 'Booking Confirmed'}
                      {n.type === 'waitlist_promoted' && 'Spot Opened for You!'}
                      {n.type === 'waitlist_joined' && 'Joined Waitlist'}
                      {n.type === 'booking_cancelled' && 'Booking Cancelled'}
                      {n.type === 'waitlist_expired' && 'Waitlist Claim Expired'}
                    </div>
                    <div className="notif-desc">
                      {(n.payload as any)?.facilityName} • {(n.payload as any)?.startTime} - {(n.payload as any)?.endTime}
                    </div>
                    <div className="notif-time">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
