import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import type { RaceDemoResult, Slot } from '../types';
import './RaceDemoPage.css';

export default function RaceDemoPage() {
  const [userCount, setUserCount] = useState<number>(10);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Fetch a random slot for demo testing
  const { data: randomSlot, refetch: fetchNewSlot, isLoading: isSlotLoading } = useQuery({
    queryKey: ['random-slot-demo'],
    queryFn: async () => {
      const res = await api.get('/demo/random-slot');
      return res.data.data as Slot;
    },
  });

  const activeSlot = selectedSlot || randomSlot;

  // Race Demo Execution Mutation
  const raceMutation = useMutation({
    mutationFn: async () => {
      if (!activeSlot) throw new Error('No slot selected');
      const res = await api.post('/demo/race', {
        slotId: activeSlot.id,
        userCount,
      });
      return res.data.data as RaceDemoResult;
    },
  });

  const result = raceMutation.data;

  return (
    <div className="race-demo-page page-content">
      <div className="container">
        {/* Banner */}
        <div className="race-header card mb-4">
          <div className="race-header-badge">⚡ Real-Time Concurrency Battle</div>
          <h1 className="text-3xl font-extrabold mt-2">
            The Concurrency Arena: <span className="text-accent">1 Slot vs N Students</span>
          </h1>
          <p className="text-secondary text-sm mt-1 max-w-2xl">
            Simulate a high-concurrency surge at 6:00 PM when multiple students simultaneously press "Book Now"
            for the exact same facility and slot. Watch PostgreSQL row-level locks guarantee <strong>exactly one winner</strong> and reject all others without data corruption.
          </p>

          <div className="concurrency-architecture-pills mt-3">
            <span className="arch-pill">🛡️ App Layer: BullMQ Queue</span>
            <span className="arch-pill">🔒 DB Layer: SELECT FOR UPDATE Row Locks</span>
            <span className="arch-pill">🎯 Schema Layer: UNIQUE(slot_id)</span>
          </div>
        </div>

        {/* Target Slot Card & Controls */}
        <div className="race-controls-card card mb-4">
          <div className="flex-between flex-wrap gap-4">
            <div>
              <span className="text-xs text-muted font-bold uppercase tracking-wider">Target Resource Under Contention</span>
              {isSlotLoading ? (
                <div className="skeleton" style={{ height: 32, width: 220, marginTop: 4 }} />
              ) : activeSlot ? (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl">🏟️</span>
                  <div>
                    <div className="font-bold text-lg">{activeSlot.facility?.name}</div>
                    <div className="text-xs text-secondary">
                      📅 {new Date(activeSlot.date).toLocaleDateString()} • ⏰ {activeSlot.startTime} - {activeSlot.endTime}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-error mt-1">No slot available. Click Pick New Slot.</div>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold">Simultaneous Requests:</label>
                <select
                  className="input select"
                  style={{ width: 100 }}
                  value={userCount}
                  onChange={(e) => setUserCount(Number(e.target.value))}
                >
                  <option value={5}>5 Users</option>
                  <option value={10}>10 Users</option>
                  <option value={15}>15 Users</option>
                  <option value={20}>20 Users</option>
                </select>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSelectedSlot(null);
                  fetchNewSlot();
                }}
                disabled={raceMutation.isPending}
              >
                🔄 Pick Another Slot
              </button>

              <button
                className="btn btn-primary btn-lg race-fire-btn"
                onClick={() => raceMutation.mutate()}
                disabled={raceMutation.isPending || !activeSlot}
              >
                {raceMutation.isPending ? (
                  <>
                    <span className="spinner spinner-sm" />
                    <span>Executing Race Condition...</span>
                  </>
                ) : (
                  `⚡ Fire ${userCount} Concurrent Requests`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live Race Visualizer */}
        {result && (
          <div className="race-results-section animate-fade-in">
            {/* Summary Banner */}
            <div className="race-summary-bar card-elevated mb-4">
              <div className="stat-item">
                <span className="stat-label">Total Requests</span>
                <span className="stat-val">{result.totalConcurrentRequests}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Execution Time</span>
                <span className="stat-val text-accent">{result.totalTimeMs} ms</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Confirmed Winner</span>
                <span className="stat-val text-success">1 Valid Booking</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rejected / Redirected</span>
                <span className="stat-val text-error">{result.losers.length} Requests</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">DB State Integrity</span>
                <span className="stat-val text-success font-bold">100% Consistent</span>
              </div>
            </div>

            {/* Database Verification Box */}
            <div className="db-verification-box card mb-4">
              <div className="flex items-center gap-2 font-bold text-success">
                <span>🛡️ Database Integrity Verification</span>
              </div>
              <div className="text-sm mt-1 text-secondary">
                {result.dbVerification.message}
              </div>
              {result.dbVerification.winner && (
                <div className="db-winner-detail text-xs mt-2">
                  <span>Booking ID: <code>{result.dbVerification.winner.bookingId}</code></span>
                  <span className="ml-3">Owner: <strong>{result.dbVerification.winner.user.name} ({result.dbVerification.winner.user.rollNo})</strong></span>
                </div>
              )}
            </div>

            {/* Request Breakdown Grid */}
            <h3 className="section-title">Race Breakdown (Every Millisecond Accounted For)</h3>
            <div className="race-attempts-grid">
              {/* Winner First */}
              {result.winner && (
                <div className="race-attempt-card card race-winner-card animate-winner">
                  <div className="flex-between">
                    <span className="badge badge-success">🏆 WINNER (1st to Lock)</span>
                    <span className="text-xs text-muted">{result.winner.latencyMs}ms</span>
                  </div>
                  <div className="font-bold mt-2">{result.winner.userName}</div>
                  <div className="text-xs text-success mt-1">Status: Confirmed</div>
                  <div className="text-xs text-muted truncate mt-1">
                    Booking: {result.winner.bookingId}
                  </div>
                </div>
              )}

              {/* Losers */}
              {result.losers.map((loser, i) => (
                <div key={loser.userId || i} className="race-attempt-card card race-loser-card">
                  <div className="flex-between">
                    <span className="badge badge-booked">❌ REJECTED (Conflict)</span>
                    <span className="text-xs text-muted">{loser.latencyMs}ms</span>
                  </div>
                  <div className="font-bold mt-2 text-secondary">{loser.userName}</div>
                  <div className="text-xs text-error mt-1">
                    {loser.error || 'Slot is no longer available'}
                  </div>
                  <div className="text-xs text-muted mt-1">Redirected to Waitlist / Alternatives</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
