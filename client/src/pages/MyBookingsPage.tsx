import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/ToastProvider';
import type { Booking, WaitlistItem } from '../types';
import { FACILITY_ICONS } from '../types';
import './MyBookingsPage.css';

export default function MyBookingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'bookings' | 'waitlist'>('bookings');

  // Fetch My Bookings
  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings/mine');
      return res.data.data as Booking[];
    },
  });

  // Fetch My Waitlist
  const { data: waitlist, isLoading: isWaitlistLoading } = useQuery({
    queryKey: ['my-waitlist'],
    queryFn: async () => {
      const res = await api.get('/waitlist/mine');
      return res.data.data as WaitlistItem[];
    },
  });

  // Cancel Booking Mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/bookings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully. Slot freed up.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel booking');
    },
  });

  // Leave Waitlist Mutation
  const leaveWaitlistMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/waitlist/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.info('Removed from waitlist');
      queryClient.invalidateQueries({ queryKey: ['my-waitlist'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to leave waitlist');
    },
  });

  const activeBookings = bookings?.filter((b) => b.status === 'confirmed') || [];
  const pastBookings = bookings?.filter((b) => b.status !== 'confirmed') || [];

  return (
    <div className="my-bookings-page page-content">
      <div className="container">
        <div className="page-header mb-4">
          <h1 className="text-3xl font-bold">My Sports Activity</h1>
          <p className="text-secondary text-sm">Manage your upcoming games and queue positions</p>
        </div>

        {/* Tab switcher */}
        <div className="tab-switcher mb-4">
          <button
            className={`tab-btn ${activeTab === 'bookings' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Confirmed Bookings ({activeBookings.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'waitlist' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('waitlist')}
          >
            Waitlist Positions ({waitlist?.length || 0})
          </button>
        </div>

        {activeTab === 'bookings' ? (
          <div>
            <h3 className="section-title">Upcoming Reservations</h3>
            {isBookingsLoading ? (
              <div className="grid-2">
                <div className="skeleton" style={{ height: 160 }} />
                <div className="skeleton" style={{ height: 160 }} />
              </div>
            ) : activeBookings.length === 0 ? (
              <div className="empty-box card">
                <div className="text-3xl mb-2">🏟️</div>
                <div className="font-semibold">No active bookings</div>
                <p className="text-secondary text-sm mt-1">Ready to play? Explore available facilities.</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {activeBookings.map((b) => {
                  const facility = b.slot?.facility;
                  const icon = facility ? FACILITY_ICONS[facility.type] || '🏟️' : '🏟️';

                  return (
                    <div key={b.id} className="booking-card card animate-fade-in-up">
                      <div className="booking-card-top">
                        <div className="flex items-center gap-3">
                          <span className="booking-icon">{icon}</span>
                          <div>
                            <h4 className="font-bold text-lg">{facility?.name}</h4>
                            <span className="text-muted text-xs">
                              {b.slot && new Date(b.slot.date).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-confirmed">Confirmed</span>
                      </div>

                      <div className="booking-card-mid">
                        <div className="booking-time-display">
                          ⏰ {b.slot?.startTime} - {b.slot?.endTime}
                        </div>
                        <div className="text-muted text-xs">
                          Booked on {new Date(b.bookedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="booking-card-bottom">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this booking?')) {
                              cancelBookingMutation.mutate(b.id);
                            }
                          }}
                          disabled={cancelBookingMutation.isPending}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pastBookings.length > 0 && (
              <div className="mt-8">
                <h3 className="section-title text-secondary">Past / Cancelled Activity</h3>
                <div className="past-list">
                  {pastBookings.map((b) => (
                    <div key={b.id} className="past-item">
                      <div>
                        <span className="font-semibold">{b.slot?.facility?.name}</span>
                        <span className="text-muted text-xs ml-2">
                          {b.slot && new Date(b.slot.date).toLocaleDateString()} ({b.slot?.startTime} - {b.slot?.endTime})
                        </span>
                      </div>
                      <span className={`badge badge-${b.status}`}>{b.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="section-title">My Active Waitlists</h3>
            {isWaitlistLoading ? (
              <div className="skeleton" style={{ height: 160 }} />
            ) : !waitlist?.length ? (
              <div className="empty-box card">
                <div className="text-3xl mb-2">⏳</div>
                <div className="font-semibold">No waitlist entries</div>
                <p className="text-secondary text-sm mt-1">When full slots free up, waitlists will alert you first.</p>
              </div>
            ) : (
              <div className="waitlist-grid">
                {waitlist.map((w) => (
                  <div key={w.id} className="waitlist-card card animate-fade-in-up">
                    <div className="flex-between">
                      <h4 className="font-bold">{w.slot?.facility?.name}</h4>
                      <span className="badge badge-waitlist">Position #{w.position}</span>
                    </div>
                    <div className="my-2 text-sm text-secondary">
                      📅 {w.slot && new Date(w.slot.date).toLocaleDateString()} • {w.slot?.startTime} - {w.slot?.endTime}
                    </div>
                    <div className="flex-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted">Joined {new Date(w.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => leaveWaitlistMutation.mutate(w.id)}
                      >
                        Leave Queue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
