import { useState } from 'react';
import type { Slot } from '../../types';
import './SlotGrid.css';

interface SlotGridProps {
  slots: Slot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: Slot) => void;
  onJoinWaitlist: (slot: Slot) => void;
  isLoading: boolean;
}

export default function SlotGrid({
  slots,
  selectedSlotId,
  onSelectSlot,
  onJoinWaitlist,
  isLoading,
}: SlotGridProps) {
  if (isLoading) {
    return (
      <div className="slot-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="slot-card skeleton" style={{ height: 110 }} />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="slot-grid-empty">
        <div className="text-2xl mb-2">📅</div>
        <div className="font-semibold">No slots scheduled for this date</div>
        <div className="text-sm text-secondary">Check another date or contact the facility manager</div>
      </div>
    );
  }

  return (
    <div className="slot-grid">
      {slots.map((slot) => {
        const isAvailable = slot.status === 'available';
        const isBooked = slot.status === 'booked';
        const isMaintenance = slot.status === 'maintenance';
        const isClosed = slot.status === 'closed';
        const isSelected = selectedSlotId === slot.id;

        return (
          <div
            key={slot.id}
            className={`slot-card ${
              isAvailable ? 'slot-card-available' : ''
            } ${isBooked ? 'slot-card-booked' : ''} ${
              isMaintenance ? 'slot-card-maintenance' : ''
            } ${isClosed ? 'slot-card-closed' : ''} ${
              isSelected ? 'slot-card-selected' : ''
            } ${slot.userOnWaitlist ? 'slot-card-waitlisted' : ''}`}
            onClick={() => {
              if (isAvailable) onSelectSlot(slot);
            }}
          >
            <div className="slot-time-range">
              <span className="slot-start-time">{slot.startTime}</span>
              <span className="slot-time-sep">-</span>
              <span className="slot-end-time">{slot.endTime}</span>
            </div>

            <div className="slot-status-container">
              {isAvailable && (
                <span className="badge badge-available">
                  <span className="status-dot-green" /> Available
                </span>
              )}
              {isBooked && (
                <span className="badge badge-booked">
                  Booked
                </span>
              )}
              {isMaintenance && (
                <span className="badge badge-maintenance">
                  🔧 Maintenance
                </span>
              )}
              {isClosed && (
                <span className="badge badge-cancelled">
                  Closed
                </span>
              )}
            </div>

            {isBooked && (
              <div className="slot-waitlist-actions">
                {slot.userOnWaitlist ? (
                  <span className="waitlist-joined-tag">✓ On Waitlist</span>
                ) : (
                  <button
                    className="btn-join-waitlist"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinWaitlist(slot);
                    }}
                  >
                    Join Waitlist {slot.waitlistCount ? `(${slot.waitlistCount})` : ''}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
