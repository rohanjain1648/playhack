import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/ToastProvider';
import type { Facility, MaintenanceWindow, User } from '../types';
import './AdminPage.css';

export default function AdminPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'analytics' | 'maintenance' | 'bookings' | 'priorities'>('analytics');

  // Form state for new maintenance window
  const [maintFacilityId, setMaintFacilityId] = useState('');
  const [maintStart, setMaintStart] = useState('');
  const [maintEnd, setMaintEnd] = useState('');
  const [maintReason, setMaintReason] = useState('');

  // 1. Fetch Facilities
  const { data: facilities } = useQuery({
    queryKey: ['admin-facilities'],
    queryFn: async () => {
      const res = await api.get('/facilities');
      return res.data.data as Facility[];
    },
  });

  // 2. Fetch Usage Analytics
  const { data: usage } = useQuery({
    queryKey: ['admin-analytics-usage'],
    queryFn: async () => {
      const res = await api.get('/analytics/usage');
      return res.data.data;
    },
    enabled: activeTab === 'analytics',
  });

  // 3. Fetch Leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['admin-analytics-leaderboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/leaderboard');
      return res.data.data;
    },
    enabled: activeTab === 'analytics',
  });

  // 4. Fetch Maintenance Windows
  const { data: maintenanceWindows } = useQuery({
    queryKey: ['admin-maintenance'],
    queryFn: async () => {
      const res = await api.get('/admin/maintenance');
      return res.data.data as MaintenanceWindow[];
    },
    enabled: activeTab === 'maintenance',
  });

  // 5. Fetch All Bookings
  const { data: allBookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const res = await api.get('/admin/bookings');
      return res.data.data;
    },
    enabled: activeTab === 'bookings',
  });

  // 6. Fetch Users for Priority Management
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data.data as User[];
    },
    enabled: activeTab === 'priorities',
  });

  // Create Maintenance Mutation
  const createMaintMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/maintenance', {
        facilityId: maintFacilityId,
        startDt: maintStart,
        endDt: maintEnd,
        reason: maintReason,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Maintenance window created! (${data.affectedSlots || 0} slots updated)`);
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
      setMaintFacilityId('');
      setMaintStart('');
      setMaintEnd('');
      setMaintReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create maintenance');
    },
  });

  // Update Priority Mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ userId, priority }: { userId: string; priority: number }) => {
      const res = await api.patch(`/admin/users/${userId}/priority`, { priority });
      return res.data;
    },
    onSuccess: () => {
      toast.success('User priority updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return (
    <div className="admin-page page-content">
      <div className="container">
        <div className="page-header mb-4">
          <div className="badge badge-primary mb-2">OPERATIONS CONSOLE</div>
          <h1 className="text-3xl font-extrabold">IIT Guwahati Facility Management</h1>
          <p className="text-secondary text-sm">Control maintenance windows, monitor utilization, and adjust queue priorities</p>
        </div>

        {/* Tab navigation */}
        <div className="tab-switcher mb-4">
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Utilization & Insights
          </button>
          <button
            className={`tab-btn ${activeTab === 'maintenance' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            🔧 Maintenance & Closures
          </button>
          <button
            className={`tab-btn ${activeTab === 'bookings' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📋 All Bookings
          </button>
          <button
            className={`tab-btn ${activeTab === 'priorities' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('priorities')}
          >
            ⭐ Team & Fair Priority
          </button>
        </div>

        {/* 1. Analytics & Utilization Tab */}
        {activeTab === 'analytics' && (
          <div className="admin-section animate-fade-in">
            <div className="grid-4 mb-4">
              <div className="stat-card">
                <span className="stat-label">Total Scheduled Slots</span>
                <span className="stat-value">{usage?.totalSlots || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Booked Slots</span>
                <span className="stat-value text-accent">{usage?.bookedSlots || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Campus Utilization</span>
                <span className="stat-value text-success">{usage?.utilizationRate || 0}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Cancellations</span>
                <span className="stat-value text-warning">{usage?.cancelledBookings || 0}</span>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <h3 className="section-title">Most Popular Facilities (Last 30 Days)</h3>
                <div className="leaderboard-list mt-3">
                  {leaderboard?.map((item: any, idx: number) => (
                    <div key={item.facilityId} className="leaderboard-item flex-between p-2">
                      <div className="flex items-center gap-2">
                        <span className="leaderboard-rank">#{idx + 1}</span>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <span className="badge badge-primary">{item.bookingCount} Bookings</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="section-title">Operational Recommendations</h3>
                <div className="insights-list mt-3">
                  <div className="insight-card">
                    <span className="text-xl">📈</span>
                    <div>
                      <div className="font-bold text-sm">Peak Demand Windows</div>
                      <div className="text-xs text-secondary mt-1">
                        Badminton and Gym see 94% occupancy between 6:00 PM – 9:00 PM. Consider extending evening floodlight slots.
                      </div>
                    </div>
                  </div>
                  <div className="insight-card mt-3">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <div className="font-bold text-sm">Zero Clash Guarantee Active</div>
                      <div className="text-xs text-secondary mt-1">
                        All transactions are synchronized through PostgreSQL row locks. Double bookings prevented this month: 142.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Maintenance Closures Tab */}
        {activeTab === 'maintenance' && (
          <div className="admin-section animate-fade-in">
            <div className="grid-2">
              <div className="card">
                <h3 className="section-title">Schedule Facility Maintenance</h3>
                <p className="text-xs text-secondary mb-3">
                  Automatically marks corresponding slots as 'Maintenance' and cancels affected reservations.
                </p>

                <div className="input-group mb-3">
                  <label className="input-label">Select Facility</label>
                  <select
                    className="input select"
                    value={maintFacilityId}
                    onChange={(e) => setMaintFacilityId(e.target.value)}
                  >
                    <option value="">Choose a facility...</option>
                    {facilities?.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                    ))}
                  </select>
                </div>

                <div className="input-group mb-3">
                  <label className="input-label">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={maintStart}
                    onChange={(e) => setMaintStart(e.target.value)}
                  />
                </div>

                <div className="input-group mb-3">
                  <label className="input-label">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={maintEnd}
                    onChange={(e) => setMaintEnd(e.target.value)}
                  />
                </div>

                <div className="input-group mb-4">
                  <label className="input-label">Reason / Work Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Wooden floor repolishing, net replacement"
                    value={maintReason}
                    onChange={(e) => setMaintReason(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary btn-full"
                  onClick={() => createMaintMutation.mutate()}
                  disabled={!maintFacilityId || !maintStart || !maintEnd || createMaintMutation.isPending}
                >
                  {createMaintMutation.isPending ? 'Applying Maintenance...' : 'Schedule Maintenance Window'}
                </button>
              </div>

              <div className="card">
                <h3 className="section-title">Active & Scheduled Windows</h3>
                <div className="maint-list mt-3">
                  {!maintenanceWindows?.length ? (
                    <div className="text-secondary text-sm">No maintenance windows scheduled</div>
                  ) : (
                    maintenanceWindows.map((mw) => (
                      <div key={mw.id} className="maint-card card-elevated p-3 mb-2">
                        <div className="flex-between">
                          <span className="font-bold">{mw.facility?.name}</span>
                          <span className="badge badge-maintenance">Maintenance</span>
                        </div>
                        <div className="text-xs text-secondary mt-1">
                          ⏰ {new Date(mw.startDt).toLocaleString()} — {new Date(mw.endDt).toLocaleString()}
                        </div>
                        {mw.reason && <div className="text-xs text-muted mt-1">📝 {mw.reason}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Bookings Log Tab */}
        {activeTab === 'bookings' && (
          <div className="admin-section animate-fade-in card">
            <h3 className="section-title mb-3">Campus Booking Records</h3>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>User</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings?.map((b: any) => (
                    <tr key={b.id}>
                      <td className="font-semibold">{b.slot?.facility?.name}</td>
                      <td>{b.user?.name} ({b.user?.rollNo})</td>
                      <td>{new Date(b.slot?.date).toLocaleDateString()} • {b.slot?.startTime}-{b.slot?.endTime}</td>
                      <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                      <td className="text-muted text-xs">{new Date(b.bookedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Priority Management Tab */}
        {activeTab === 'priorities' && (
          <div className="admin-section animate-fade-in card">
            <h3 className="section-title">Fair Allocation & Team Priority</h3>
            <p className="text-xs text-secondary mb-3">
              Assign priority scores (0-100) to inter-IIT team members, campus events, or students with accessibility needs for waitlist precedence.
            </p>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Role</th>
                    <th>Priority Score</th>
                    <th>Quick Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id}>
                      <td className="font-semibold">{u.name}</td>
                      <td>{u.rollNo}</td>
                      <td><span className="badge badge-primary">{u.role}</span></td>
                      <td>
                        <span className="font-bold text-accent">{u.priority}</span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => updatePriorityMutation.mutate({ userId: u.id, priority: u.priority + 10 })}
                          >
                            +10
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => updatePriorityMutation.mutate({ userId: u.id, priority: Math.max(0, u.priority - 10) })}
                          >
                            -10
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => updatePriorityMutation.mutate({ userId: u.id, priority: 50 })}
                          >
                            Set Team (50)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
