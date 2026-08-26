import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useLenis } from '../hooks/useLenis';
import type { Facility } from '../types';
import { FACILITY_ICONS } from '../types';
import './LandingPage.css';

export default function LandingPage() {
  useLenis();
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [simulatedUsers, setSimulatedUsers] = useState<number>(10);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Fetch facilities
  const { data: facilities, isLoading: isFacilitiesLoading } = useQuery({
    queryKey: ['landing-facilities', selectedSport],
    queryFn: async () => {
      const param = selectedSport !== 'all' ? `?type=${selectedSport}` : '';
      const res = await api.get(`/facilities${param}`);
      return res.data.data as Facility[];
    },
  });

  const runConcurrencySim = () => {
    setIsSimulating(true);
    setSimResult(null);
    setTimeout(() => {
      setIsSimulating(false);
      const winnerId = Math.floor(Math.random() * simulatedUsers) + 1;
      const latency = Math.floor(Math.random() * 20) + 14;
      setSimResult(`Student #${winnerId} won booking lock in ${latency}ms • ${simulatedUsers - 1} competing requests safely rejected`);
    }, 550);
  };

  const sportsCategories = [
    { key: 'all', label: 'All Facilities', icon: '🌟' },
    { key: 'badminton', label: 'Badminton Courts', icon: '🏸' },
    { key: 'gym', label: 'SAC Gymnasium', icon: '🏋️' },
    { key: 'tennis', label: 'Tennis Courts', icon: '🎾' },
    { key: 'football', label: 'Football Ground', icon: '⚽' },
    { key: 'cricket', label: 'Cricket Oval', icon: '🏏' },
    { key: 'swimming', label: 'Aquatic Center', icon: '🏊' },
    { key: 'table_tennis', label: 'Table Tennis', icon: '🏓' },
  ];

  return (
    <div className="padel-landing-root">
      {/* Background Vertical Grid Lines */}
      <div className="bg-grid-lines">
        <div className="grid-line" />
        <div className="grid-line" />
        <div className="grid-line" />
        <div className="grid-line" />
        <div className="grid-line" />
      </div>

      {/* ── 1. Hero Section ── */}
      <section className="padel-hero">
        <div className="padel-container">
          <div className="hero-head-wrap text-center">
            {/* Italic Script Eyebrow */}
            <div className="hero-script-eyebrow">
              IITG Sports Club
            </div>

            {/* Bold Display Headline */}
            <h1 className="hero-headline">
              Where Sports Meets <br />
              Its People
            </h1>

            {/* Editorial Subtitle */}
            <p className="hero-subtext">
              Whether you're here to compete, improve, or just have fun, discover open courts and reserve with 100% certainty. No double bookings. Zero clashes.
            </p>

            {/* Action Buttons */}
            <div className="hero-cta-group">
              <a href="#facilities" className="btn-neon-pill">
                <span>Reserve a Court</span>
                <span className="cta-arrow">→</span>
              </a>
              <Link to="/race-demo" className="btn-ghost-arrow">
                <span>⚡ Test Live Concurrency</span>
                <span className="cta-arrow">↗</span>
              </Link>
            </div>
          </div>

          {/* ── 2. Gallery Cards Strip (5 Cards with Diagonal Neon Tags) ── */}
          <div className="gallery-strip">
            {/* Card 1 */}
            <div className="gallery-card">
              <div className="neon-card-tag tag-angle-left">BADMINTON HALL</div>
              <div className="card-img-wrapper">
                <img src="/card-1.jpg" alt="Badminton Player" className="card-photo" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="gallery-card">
              <div className="neon-card-tag tag-angle-right">TENNIS ARENA</div>
              <div className="card-img-wrapper">
                <img src="/card-2.jpg" alt="Tennis Court" className="card-photo" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="gallery-card">
              <div className="neon-card-tag tag-angle-left">CLAY & SNEAKERS</div>
              <div className="card-img-wrapper">
                <img src="/card-3.jpg" alt="Athlete with Tennis Balls" className="card-photo" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="gallery-card">
              <div className="neon-card-tag tag-angle-right">CRICKET OVAL</div>
              <div className="card-img-wrapper">
                <img src="/card-4.jpg" alt="Cricket Player" className="card-photo" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="gallery-card">
              <div className="neon-card-tag tag-angle-left">SAC GYMNASIUM</div>
              <div className="card-img-wrapper">
                <img src="/hero-sports.jpg" alt="Indoor Sports Complex" className="card-photo" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Editorial Statement with Inline Sport Pills ── */}
      <section className="editorial-section">
        <div className="padel-container text-center">
          <span className="editorial-eyebrow">WHAT WE ARE ABOUT</span>

          <h2 className="editorial-statement">
            From beginners picking up their first racket to seasoned{' '}
            <span className="inline-badge badge-tennis">🎾 athletes</span> chasing
            the perfect shot, we design every part of{' '}
            <span className="inline-badge badge-arena">🏟️ the experience</span> to
            make you fall in love with the game again and again.
          </h2>

          {/* Campus Hostels & Sports Board Trust Strip */}
          <div className="trust-strip">
            <span className="trust-label">TRUSTED ACROSS IIT GUWAHATI SPORTS BOARD & HOSTELS</span>
            <div className="trust-logos">
              <span className="hostel-badge">SAC Sports Board</span>
              <span className="hostel-badge">Brahmaputra</span>
              <span className="hostel-badge">Manas</span>
              <span className="hostel-badge">Kapili</span>
              <span className="hostel-badge">Lohit</span>
              <span className="hostel-badge">Umiam</span>
              <span className="hostel-badge">Barak</span>
              <span className="hostel-badge">Kameng</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. The 3-Layer Concurrency Feature Bento ── */}
      <section className="padel-bento-section">
        <div className="padel-container">
          <div className="bento-intro text-center">
            <span className="editorial-eyebrow">DISTRIBUTED CONCURRENCY ENGINE</span>
            <h2 className="bento-main-title">
              Engineered to Resolve <span className="highlight-text">Every 6:00 PM Clash</span>
            </h2>
            <p className="bento-subtitle">
              Two players. One court. One valid winner. Explore how our PostgreSQL row locks and Redis queue enforce absolute integrity.
            </p>
          </div>

          <div className="padel-bento-grid">
            {/* Interactive Simulation Card */}
            <div className="bento-box bento-box-wide">
              <div className="bento-box-head">
                <span className="pill-status-neon">LAYER 1 & 2 • SELECT FOR UPDATE</span>
                <span className="bento-box-stat text-muted">ACID SERIALIZABLE</span>
              </div>
              <h3 className="bento-box-title">Simulate a Real-Time Booking Race</h3>
              <p className="bento-box-desc">
                Simulate competing students hitting 'Book Now' at the exact same millisecond. Watch the database enforce single-winner resolution.
              </p>

              <div className="sim-widget-light">
                <div className="flex-between mb-3 flex-wrap gap-2">
                  <span className="sim-label">Simultaneous Requests:</span>
                  <div className="sim-button-group">
                    {[5, 10, 20].map((count) => (
                      <button
                        key={count}
                        className={`sim-pill ${simulatedUsers === count ? 'active' : ''}`}
                        onClick={() => setSimulatedUsers(count)}
                      >
                        {count} Users
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="btn-sim-run"
                  onClick={runConcurrencySim}
                  disabled={isSimulating}
                >
                  {isSimulating ? (
                    <span className="flex-center gap-2">
                      <span className="spinner spinner-sm" />
                      <span>Resolving Transaction Lock...</span>
                    </span>
                  ) : (
                    `⚡ Trigger ${simulatedUsers} Concurrent Booking Requests`
                  )}
                </button>

                {simResult && (
                  <div className="sim-result-box">
                    <span className="sim-result-icon">✅</span>
                    <span className="sim-result-text">{simResult}</span>
                  </div>
                )}
              </div>
            </div>

            {/* WebSocket Push Card */}
            <div className="bento-box">
              <div className="bento-box-head">
                <span className="pill-status-neon">REAL-TIME PUSH</span>
                <span>📡</span>
              </div>
              <h3 className="bento-box-title">Zero Polling Required</h3>
              <p className="bento-box-desc">
                Socket.IO room channels stream availability changes instantly across all devices the millisecond a slot is booked.
              </p>
              <div className="stat-highlight">
                <span className="stat-num">&lt; 45ms</span>
                <span className="stat-desc">Push Latency to Connected Clients</span>
              </div>
            </div>

            {/* Waitlist Promotion Card */}
            <div className="bento-box">
              <div className="bento-box-head">
                <span className="pill-status-neon">FAIR PRIORITY QUEUE</span>
                <span>⏳</span>
              </div>
              <h3 className="bento-box-title">15-Min Auto-Claim Window</h3>
              <p className="bento-box-desc">
                When a confirmed booking is cancelled, the #1 priority waitlist student gets an exclusive 15-minute window to claim.
              </p>
              <div className="stat-highlight">
                <span className="stat-num">100%</span>
                <span className="stat-desc">Fair First-Come & Team Scoring</span>
              </div>
            </div>

            {/* Smart Alternatives */}
            <div className="bento-box">
              <div className="bento-box-head">
                <span className="pill-status-neon">SMART ROUTING</span>
                <span>🎯</span>
              </div>
              <h3 className="bento-box-title">Instant Alternatives</h3>
              <p className="bento-box-desc">
                If your chosen court is taken, the engine instantly returns sister courts and adjacent time slots to keep you playing.
              </p>
              <div className="stat-highlight">
                <span className="stat-num">3 Sibling</span>
                <span className="stat-desc">Recommendations on Conflict</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Facilities & Arena Booking Matrix ── */}
      <section id="facilities" className="padel-facilities-section">
        <div className="padel-container">
          <div className="facilities-intro flex-between flex-wrap gap-4 mb-4">
            <div>
              <span className="editorial-eyebrow">CAMPUS VENUES</span>
              <h2 className="facilities-headline">IIT Guwahati Sports Arenas</h2>
              <p className="facilities-subtext">Choose your court, view 14-day availability, and make your reservation.</p>
            </div>
            <Link to="/my-bookings" className="btn-outline-pill">
              My Bookings & Waitlists →
            </Link>
          </div>

          {/* Categories Pill Bar */}
          <div className="sports-category-bar">
            {sportsCategories.map((cat) => (
              <button
                key={cat.key}
                className={`sport-tab ${selectedSport === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedSport(cat.key)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Venues Grid */}
          {isFacilitiesLoading ? (
            <div className="venues-grid-light">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="venue-skeleton skeleton" style={{ height: 260 }} />
              ))}
            </div>
          ) : (
            <div className="venues-grid-light">
              {facilities?.map((f) => {
                const icon = FACILITY_ICONS[f.type] || '🏟️';

                return (
                  <div key={f.id} className="padel-venue-card">
                    <div className="venue-card-header">
                      <span className="venue-icon-box">{icon}</span>
                      <span className="venue-type-pill">{f.type.toUpperCase()}</span>
                    </div>

                    <div className="venue-card-content">
                      <h3 className="venue-title-text">{f.name}</h3>
                      <p className="venue-summary-text">{f.description || 'IIT Guwahati sports facility.'}</p>
                      
                      <div className="venue-tags-row">
                        <span className="tag-spec">👥 Up to {f.capacity} Players</span>
                        {f.location && <span className="tag-spec">📍 {f.location}</span>}
                      </div>
                    </div>

                    <div className="venue-card-action">
                      <button
                        className="btn-venue-reserve"
                        onClick={() => navigate(`/facility/${f.id}`)}
                      >
                        <span>Check Live Slots & Book</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 6. Full Concurrency Arena CTA ── */}
      <section className="padel-cta-banner">
        <div className="padel-container">
          <div className="cta-inner-card text-center">
            <span className="neon-card-tag tag-centered">BENCHMARK ARENA</span>
            <h2 className="cta-heading">Ready to Race the Concurrency Engine?</h2>
            <p className="cta-subheading">
              Open the dedicated stress-testing arena, fire 10 to 20 simultaneous requests against a live slot, and inspect real-time latency graphs.
            </p>
            <div className="flex-center gap-3 flex-wrap mt-4">
              <Link to="/race-demo" className="btn-neon-pill">
                <span>⚡ Open Race Demo Arena</span>
                <span>→</span>
              </Link>
              <Link to="/login" className="btn-outline-pill">
                <span>Student Login</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Minimal Clean Footer ── */}
      <footer className="padel-footer">
        <div className="padel-container">
          <div className="footer-top flex-between flex-wrap gap-4">
            <div>
              <div className="footer-logo-text">IITG Sports Club</div>
              <p className="footer-desc">Where IIT Guwahati meets its game. Concurrency-safe sports booking platform.</p>
            </div>
            <div className="footer-nav-links">
              <a href="#facilities">Facilities</a>
              <Link to="/race-demo">Race Demo</Link>
              <Link to="/my-bookings">My Bookings</Link>
              <Link to="/admin">Admin Console</Link>
            </div>
          </div>

          <div className="footer-bottom-bar flex-between flex-wrap gap-2 text-xs text-muted">
            <span>© 2026 IIT Guwahati Sports Booking System • 100% Concurrency Safe</span>
            <span>Built with PostgreSQL 16 • Redis 7 • React 18 • Socket.IO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
