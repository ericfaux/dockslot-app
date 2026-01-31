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
  initialDate?: Date;
  initialView?: CalendarView;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  onBlockClick?: (booking: CalendarBooking) => void;
  onQuickBlockClick?: () => void;
  onBlackoutClick?: (blackout: BlackoutDate) => void;
  blackoutDates?: BlackoutDate[];
  refreshKey?: number;
}

export interface DayColumnProps {
  date: Date;
  bookings: CalendarBooking[];
  startHour: number;
  endHour: number;
  pixelsPerHour: number;
  isToday: boolean;
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
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-300',
    dot: 'bg-amber-500',
  },
  confirmed: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    text: 'text-emerald-300',
    dot: 'bg-emerald-500',
  },
  weather_hold: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-300',
    dot: 'bg-amber-500',
  },
  rescheduled: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-300',
    dot: 'bg-blue-500',
  },
  completed: {
    bg: 'bg-slate-500/20',
    border: 'border-slate-500',
    text: 'text-slate-400',
    dot: 'bg-slate-500',
  },
  cancelled: {
    bg: 'bg-rose-500/20',
    border: 'border-rose-500',
    text: 'text-rose-300',
    dot: 'bg-rose-500',
  },
  no_show: {
    bg: 'bg-rose-500/20',
    border: 'border-rose-500',
    text: 'text-rose-300',
    dot: 'bg-rose-500',
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
};
