/**
 * Calendar Component Types
 */

import { BookingStatus } from '@/lib/db/types';

export type CalendarView = 'day' | 'week' | 'month';

export interface BlackoutDate {
  id: string;
  owner_id: string;
  blackout_date: string;
  reason: string | null;
  created_at: string;
}

export interface CalendarBooking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  party_size: number;
  scheduled_start: string;
  scheduled_end: string;
  status: BookingStatus;
  payment_status: string;
  weather_hold_reason?: string | null;
  original_date_if_rescheduled?: string | null;
  captain_notes?: string | null;
  internal_notes?: string | null;
  tags?: string[];
  vessel?: {
    id: string;
    name: string;
  } | null;
  trip_type?: {
    id: string;
    title: string;
  } | null;
}

export interface CalendarProps {
  captainId: string;
  timezone?: string;
  initialDate?: Date;
  initialView?: CalendarView;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  onBlockClick?: (booking: CalendarBooking) => void;
  onQuickBlockClick?: () => void;
  onBlackoutClick?: (blackout: BlackoutDate) => void;
  blackoutDates?: BlackoutDate[];
  refreshKey?: number;
  availabilityStartHour?: number;
  availabilityEndHour?: number;
  /** When true, the Day view option is locked behind a paywall */
  dayViewLocked?: boolean;
}

export interface DayColumnProps {
  date: Date;
  bookings: CalendarBooking[];
  startHour: number;
  endHour: number;
  pixelsPerHour: number;
  isToday: boolean;
  timezone?: string;
  onBlockClick?: (booking: CalendarBooking) => void;
  blackoutDate?: BlackoutDate;
  onBlackoutClick?: (blackout: BlackoutDate) => void;
}

export interface CalendarBlockProps {
  booking: CalendarBooking;
  top: number;
  height: number;
  onClick?: () => void;
}

// Status colors matching the maritime theme
export const STATUS_COLORS: Record<BookingStatus, {
  bg: string;
  border: string;
  text: string;
  dot: string;
}> = {
  pending_deposit: {
    bg: 'bg-amber-950/80',
    border: 'border-amber-500',
    text: 'text-amber-100',
    dot: 'bg-amber-500',
  },
  confirmed: {
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-500',
    text: 'text-emerald-100',
    dot: 'bg-emerald-500',
  },
  weather_hold: {
    bg: 'bg-blue-950/80',
    border: 'border-blue-500',
    text: 'text-blue-100',
    dot: 'bg-blue-500',
  },
  rescheduled: {
    bg: 'bg-purple-950/80',
    border: 'border-purple-500',
    text: 'text-purple-100',
    dot: 'bg-purple-500',
  },
  completed: {
    bg: 'bg-slate-800/80',
    border: 'border-slate-500',
    text: 'text-slate-200',
    dot: 'bg-slate-500',
  },
  cancelled: {
    bg: 'bg-rose-950/80',
    border: 'border-rose-500',
    text: 'text-rose-100',
    dot: 'bg-rose-500',
  },
  no_show: {
    bg: 'bg-rose-950/80',
    border: 'border-rose-500',
    text: 'text-rose-100',
    dot: 'bg-rose-500',
  },
  expired: {
    bg: 'bg-slate-800/80',
    border: 'border-slate-400',
    text: 'text-slate-200',
    dot: 'bg-slate-400',
  },
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_deposit: 'Awaiting Deposit',
  confirmed: 'Confirmed',
  weather_hold: 'Weather Hold',
  rescheduled: 'Rescheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  expired: 'Expired',
};
