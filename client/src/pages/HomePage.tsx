import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { Facility } from '../types';
import { FACILITY_ICONS, FACILITY_COLORS } from '../types';
import './HomePage.css';

function FacilityCard({ facility }: { facility: Facility }) {
  const icon = FACILITY_ICONS[facility.type] || '🏟️';
  const color = FACILITY_COLORS[facility.type] || '#3b82f6';

  return (
    <Link to={`/facility/${facility.id}`} className="facility-card animate-fade-in-up">
      <div className="facility-card-header" style={{ '--accent-color': color } as any}>
        <div className="facility-icon">{icon}</div>
        <div className="facility-type-badge" style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}>
          {facility.type.replace('_', ' ')}
        </div>
      </div>
      <div className="facility-card-body">
        <h3 className="facility-name">{facility.name}</h3>
        <p className="facility-desc">{facility.description || 'Sports facility at IIT Guwahati'}</p>
        {facility.location && (
          <div className="facility-location">
            <span>📍</span>
            <span>{facility.location}</span>
          </div>
        )}
        <div className="facility-meta">
          <div className="facility-capacity">
            <span>👥</span>
            <span>Up to {facility.capacity} players</span>
          </div>
          <div className="facility-cta">
            Book Now →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['facilities', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const res = await api.get(`/facilities${params}`);
      return res.data.data as Facility[];
    },
  });

  const types = ['all', 'gym', 'tennis', 'badminton', 'football', 'cricket', 'swimming', 'table_tennis'];

  return (
    <div className="page-content home-page">
      <div className="container">
        {/* Hero */}
        <div className="home-hero animate-fade-in-up">
          <div className="home-hero-eyebrow">IIT Guwahati Sports</div>
          <h1 className="home-hero-title">
            Book Your <span className="home-hero-highlight">Game</span>
          </h1>
          <p className="home-hero-desc">
            Discover available sports facilities, choose your time slot, and get an instant confirmed booking.
            Zero clashes. Zero uncertainty.
          </p>
          <div className="home-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">10+</span>
              <span className="hero-stat-label">Facilities</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">0</span>
              <span className="hero-stat-label">Double Bookings</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">Real-Time</span>
              <span className="hero-stat-label">Availability</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="facility-filters">
          {types.map((t) => (
            <button
              key={t}
              className={`filter-tab ${filter === t ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t === 'all' ? '🏟️ All' : `${FACILITY_ICONS[t] || ''} ${t.replace('_', ' ')}`}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 280 }} />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="empty-state">
            <div className="empty-icon">🏟️</div>
            <h3>No facilities found</h3>
            <p>Try a different filter</p>
          </div>
        ) : (
          <div className="grid-auto">
            {data.map((f, i) => (
              <div key={f.id} style={{ animationDelay: `${i * 0.06}s` }}>
                <FacilityCard facility={f} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
