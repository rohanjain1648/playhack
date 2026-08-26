import { useState } from 'react';
import type { Slot, Facility, SlotRecommendation } from '../../types';
import './ConfirmModal.css';

interface ConfirmModalProps {
  slot: Slot;
  facility: Facility;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  recommendations?: SlotRecommendation[];
  onSelectRecommendation?: (slotId: string) => void;
}

export default function ConfirmModal({
  slot,
  facility,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  recommendations,
  onSelectRecommendation,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Confirm Your Booking</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="booking-summary-card">
            <div className="summary-facility-name">{facility.name}</div>
            <div className="summary-details">
              <div className="summary-detail-item">
                <span className="summary-label">Date</span>
                <span className="summary-value">
                  {new Date(slot.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="summary-detail-item">
                <span className="summary-label">Time</span>
                <span className="summary-value highlight-time">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
              <div className="summary-detail-item">
                <span className="summary-label">Location</span>
                <span className="summary-value">{facility.location || 'IIT Guwahati'}</span>
              </div>
            </div>
          </div>

          <div className="concurrency-badge-note">
            <span>🔒</span>
            <span>Protected by PostgreSQL Advisory Locks & Row-Level Concurrency</span>
          </div>

          {recommendations && recommendations.length > 0 && (
            <div className="recommendations-section">
              <h4 className="rec-title">⚡ Alternative Slots Available:</h4>
              <div className="rec-list">
                {recommendations.map((rec) => (
                  <div
                    key={rec.slotId}
                    className="rec-item"
                    onClick={() => onSelectRecommendation?.(rec.slotId)}
                  >
                    <div>
                      <div className="rec-name">{rec.facilityName}</div>
                      <div className="rec-time">{rec.startTime} - {rec.endTime}</div>
                    </div>
                    <button className="btn btn-sm btn-primary">Select</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-sm" />
                <span>Reserving with Lock...</span>
              </>
            ) : (
              'Confirm Reservation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
