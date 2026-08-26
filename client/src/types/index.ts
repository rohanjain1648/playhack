// ── Enums ─────────────────────────────────────────────────────
export type Role = 'student' | 'admin';
export type BookingStatus = 'confirmed' | 'cancelled' | 'no_show';
export type SlotStatus = 'available' | 'booked' | 'maintenance' | 'closed';
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'waitlist_joined'
  | 'waitlist_promoted'
  | 'waitlist_expired'
  | 'slot_maintenance'
  | 'reminder';

// ── Models ────────────────────────────────────────────────────
export interface User {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  role: Role;
  priority: number;
  createdAt: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  description?: string;
  imageUrl?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Slot {
  id: string;
  facilityId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  version: number;
  facility?: Facility;
  booking?: {
    id: string;
    status: BookingStatus;
    user?: { name: string };
  };
  waitlistCount?: number;
  userOnWaitlist?: boolean;
  _count?: { waitlistItems: number };
}

export interface Booking {
  id: string;
  slotId: string;
  userId: string;
  status: BookingStatus;
  bookedAt: string;
  cancelledAt?: string;
  slot?: Slot & { facility: Facility };
  user?: Pick<User, 'id' | 'name' | 'email' | 'rollNo'>;
}

export interface WaitlistItem {
  id: string;
  slotId: string;
  userId: string;
  position: number;
  joinedAt: string;
  notifiedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  slot?: Slot & { facility: Facility };
  facilityName?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface MaintenanceWindow {
  id: string;
  facilityId: string;
  startDt: string;
  endDt: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
  facility?: Pick<Facility, 'name' | 'type'>;
  creator?: Pick<User, 'name'>;
}

// ── API Response Wrappers ─────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  data?: { recommendations?: SlotRecommendation[] };
}

// ── Recommendation ─────────────────────────────────────────────
export interface SlotRecommendation {
  slotId: string;
  facilityId: string;
  facilityName: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

// ── Analytics ─────────────────────────────────────────────────
export interface UsageStats {
  totalSlots: number;
  bookedSlots: number;
  cancelledBookings: number;
  utilizationRate: number;
  facilities: Pick<Facility, 'id' | 'name' | 'type'>[];
}

export interface PeakHoursData {
  heatmap: Record<string, number>; // "day:hour" → count
}

// ── Race Demo ─────────────────────────────────────────────────
export interface RaceAttempt {
  userId: string;
  userName: string;
  index: number;
  success: boolean;
  bookingId?: string;
  error?: string;
  code?: string;
  latencyMs: number;
}

export interface RaceDemoResult {
  slotId: string;
  facilityName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalConcurrentRequests: number;
  totalTimeMs: number;
  winner: RaceAttempt | null;
  losers: RaceAttempt[];
  confirmedBookings: number;
  dbVerification: {
    bookingCount: number;
    winner: { bookingId: string; user: { name: string; rollNo: string } } | null;
    message: string;
  };
}

// ── Facility Icon Map ──────────────────────────────────────────
export const FACILITY_ICONS: Record<string, string> = {
  gym:          '🏋️',
  tennis:       '🎾',
  badminton:    '🏸',
  football:     '⚽',
  cricket:      '🏏',
  swimming:     '🏊',
  table_tennis: '🏓',
  basketball:   '🏀',
};

export const FACILITY_COLORS: Record<string, string> = {
  gym:          '#8b5cf6',
  tennis:       '#10b981',
  badminton:    '#3b82f6',
  football:     '#f59e0b',
  cricket:      '#ef4444',
  swimming:     '#06b6d4',
  table_tennis: '#ec4899',
  basketball:   '#f97316',
};
