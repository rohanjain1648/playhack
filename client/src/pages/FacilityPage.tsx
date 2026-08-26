import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { getSocket, subscribeToFacility, unsubscribeFromFacility } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/ToastProvider';
import SlotGrid from '../components/booking/SlotGrid';
import ConfirmModal from '../components/booking/ConfirmModal';
import type { Facility, Slot, SlotRecommendation } from '../types';
import { FACILITY_ICONS, FACILITY_COLORS } from '../types';
import './FacilityPage.css';

export default function FacilityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<SlotRecommendation[]>([]);

  // Fetch Facility Details
  const { data: facilityData, isLoading: isFacilityLoading } = useQuery({
    queryKey: ['facility', id],
    queryFn: async () => {
      const res = await api.get(`/facilities/${id}`);
      return res.data.data.facility as Facility;
    },
    enabled: !!id,
  });

  // Fetch Available Slots for Date
  const { data: slots, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['slots', id, selectedDate],
    queryFn: async () => {
      const res = await api.get(`/slots?facilityId=${id}&date=${selectedDate}`);
      return res.data.data as Slot[];
    },
    enabled: !!id && !!selectedDate,
  });

  // Real-time Socket Updates for facility & date
  useEffect(() => {
    if (!id || !selectedDate) return;

    subscribeToFacility(id, selectedDate);
    const socket = getSocket(accessToken || undefined);

    const handleSlotUpdate = (data: { slotId: string; status: string; facilityId: string; date: string }) => {
      if (data.facilityId === id) {
        queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] });
      }
    };

    socket.on('slot:updated', handleSlotUpdate);

    return () => {
      unsubscribeFromFacility(id, selectedDate);
      socket.off('slot:updated', handleSlotUpdate);
    };
  }, [id, selectedDate, queryClient, accessToken]);

  // Booking Mutation
  const bookingMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const res = await api.post('/bookings', { slotId });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('🎉 Booking confirmed successfully!');
      setIsModalOpen(false);
      setSelectedSlot(null);
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err: any) => {
      const errorData = err.response?.data;
      if (errorData?.data?.recommendations?.length) {
        setRecommendations(errorData.data.recommendations);
        toast.warning(errorData.error?.message || 'Slot just taken! Check recommendations below.');
      } else {
        toast.error(errorData?.error?.message || 'Failed to book slot. Please try again.');
        setIsModalOpen(false);
      }
    },
  });

  // Waitlist Mutation
  const waitlistMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const res = await api.post('/waitlist', { slotId });
      return res.data;
    },
    onSuccess: (data) => {
      toast.info(`⏳ Added to waitlist! Position: #${data.data.position}`);
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to join waitlist');
    },
  });

  const handleSelectSlot = (slot: Slot) => {
    if (!isAuthenticated) {
      toast.info('Please log in to reserve a slot');
      navigate('/login');
      return;
    }
    setSelectedSlot(slot);
    setRecommendations([]);
    setIsModalOpen(true);
  };

  const handleJoinWaitlist = (slot: Slot) => {
    if (!isAuthenticated) {
      toast.info('Please log in to join waitlist');
      navigate('/login');
      return;
    }
    waitlistMutation.mutate(slot.id);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    bookingMutation.mutate(selectedSlot.id);
  };

  // Generate 14-day date strip
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
    };
  });

  if (isFacilityLoading || !facilityData) {
    return (
      <div className="container page-content">
        <div className="skeleton" style={{ height: 180, marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  const icon = FACILITY_ICONS[facilityData.type] || '🏟️';
  const color = FACILITY_COLORS[facilityData.type] || '#3b82f6';

  return (
    <div className="facility-page page-content">
      <div className="container">
        {/* Facility Header */}
        <div className="facility-hero card animate-fade-in">
          <div className="facility-hero-left">
            <div className="facility-big-icon" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
              {icon}
            </div>
            <div>
              <div className="badge badge-primary mb-2">
                {facilityData.type.toUpperCase()}
              </div>
              <h1 className="text-3xl font-bold">{facilityData.name}</h1>
              <p className="text-secondary text-sm mt-1">{facilityData.description}</p>
              {facilityData.location && (
                <div className="text-muted text-xs mt-2 flex items-center gap-1">
                  <span>📍 {facilityData.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="facility-hero-right">
            <div className="stat-pill">
              <span className="stat-pill-label">Capacity</span>
              <span className="stat-pill-value">{facilityData.capacity} Players</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-label">Live Sync</span>
              <span className="stat-pill-value text-success">● Active</span>
            </div>
          </div>
        </div>

        {/* Date Selector Strip */}
        <div className="date-strip-section">
          <h3 className="section-title">Select Date</h3>
          <div className="date-strip">
            {dates.map((d) => (
              <button
                key={d.dateStr}
                className={`date-pill ${selectedDate === d.dateStr ? 'date-pill-active' : ''}`}
                onClick={() => setSelectedDate(d.dateStr)}
              >
                <span className="date-pill-day">{d.isToday ? 'Today' : d.dayName}</span>
                <span className="date-pill-num">{d.dayNum}</span>
                <span className="date-pill-month">{d.month}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Slots Availability Section */}
        <div className="slots-section">
          <div className="flex-between mb-4">
            <h3 className="section-title">Available Slots</h3>
            <div className="legend-pills">
              <span className="legend-item"><span className="legend-dot bg-success" /> Available</span>
              <span className="legend-item"><span className="legend-dot bg-error" /> Booked</span>
              <span className="legend-item"><span className="legend-dot bg-info" /> Maintenance</span>
            </div>
          </div>

          <SlotGrid
            slots={slots || []}
            selectedSlotId={selectedSlot?.id || null}
            onSelectSlot={handleSelectSlot}
            onJoinWaitlist={handleJoinWaitlist}
            isLoading={isSlotsLoading}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedSlot && (
        <ConfirmModal
          slot={selectedSlot}
          facility={facilityData}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlot(null);
            setRecommendations([]);
          }}
          onConfirm={handleConfirmBooking}
          isLoading={bookingMutation.isPending}
          recommendations={recommendations}
          onSelectRecommendation={(recSlotId) => {
            const found = slots?.find((s) => s.id === recSlotId);
            if (found) {
              setSelectedSlot(found);
              setRecommendations([]);
            }
          }}
        />
      )}
    </div>
  );
}
