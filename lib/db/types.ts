/**
 * DockSlot Database Types
 * These types match the Supabase schema exactly
 */

// ============================================================================
// Enum Types (match Supabase enum values exactly)
// ============================================================================

export type BookingStatus =
  | 'pending_deposit'
  | 'confirmed'
  | 'weather_hold'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'fully_paid'
  | 'partially_refunded'
  | 'fully_refunded';

export type LogEntryType =
  | 'booking_created'
  | 'status_changed'
  | 'payment_received'
  | 'payment_refunded'
  | 'waiver_signed'
  | 'passenger_added'
  | 'passenger_updated'
  | 'rescheduled'
  | 'weather_hold_set'
  | 'note_added'
  | 'guest_communication';

export type PaymentType = 'deposit' | 'balance' | 'refund' | 'tip';

export type PaymentRecordStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

// ============================================================================
// Table Interfaces
// ============================================================================

export interface Profile {
  id: string;
  business_name: string | null;
  full_name: string | null;
  timezone: string;
  stripe_account_id: string | null;
  created_at: string;
  meeting_spot_name: string | null;
  meeting_spot_address: string | null;
  meeting_spot_instructions: string | null;
  phone: string | null;
  email: string | null;
  is_hibernating: boolean;
  hibernation_message: string | null;
  booking_buffer_minutes: number;
  advance_booking_days: number;
  cancellation_policy: string | null;
  calendar_token: string | null;
  updated_at: string;
}

export interface Vessel {
  id: string;
  owner_id: string;
  name: string;
  capacity: number;
  description: string | null;
  created_at: string;
}

export interface TripType {
  id: string;
  owner_id: string;
  title: string;
  duration_hours: number;
  price_total: number;
  deposit_amount: number;
  description: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  captain_id: string;
  trip_type_id: string | null;
  vessel_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  party_size: number;
  scheduled_start: string;
  scheduled_end: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  weather_hold_reason: string | null;
  original_date_if_rescheduled: string | null;
  internal_notes: string | null;
  tags: string[];
  created_at: string;
  balance_due_cents: number;
  deposit_paid_cents: number;
  total_price_cents: number;
  guest_count_confirmed: number | null;
  special_requests: string | null;
  captain_instructions: string | null;
  updated_at: string;
}

export interface AvailabilityWindow {
  id: string;
  owner_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  is_active: boolean;
  created_at: string;
}

export interface BlackoutDate {
  id: string;
  owner_id: string;
  blackout_date: string; // YYYY-MM-DD format
  reason: string | null;
  created_at: string;
}

export interface RescheduleOffer {
  id: string;
  booking_id: string;
  proposed_start: string;
  proposed_end: string;
  is_selected: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface BookingLog {
  id: string;
  booking_id: string;
  entry_type: LogEntryType;
  description: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  actor_type: string;
  actor_id: string | null;
  created_at: string;
}

export interface Passenger {
  id: string;
  booking_id: string;
  full_name: string;
  is_primary_contact: boolean;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount_cents: number;
  payment_type: PaymentType;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  status: PaymentRecordStatus;
  notes: string | null;
  created_at: string;
}

export interface GuestToken {
  id: string;
  booking_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface WaiverTemplate {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface WaiverSignature {
  id: string;
  booking_id: string;
  passenger_id: string | null;
  waiver_template_id: string;
  signer_name: string;
  signer_email: string | null;
  signed_at: string;
  ip_address: string | null;
  signature_data: string | null;
  template_version: number;
}

// ============================================================================
// Joined Types for Queries
// ============================================================================

export interface BookingWithDetails extends Booking {
  vessel: Pick<Vessel, 'id' | 'name' | 'capacity'> | null;
  trip_type: Pick<TripType, 'id' | 'title' | 'duration_hours' | 'price_total' | 'deposit_amount'> | null;
}

export interface BookingWithPassengers extends BookingWithDetails {
  passengers: Passenger[];
}

export interface BookingWithLogs extends BookingWithDetails {
  logs: BookingLog[];
}

// ============================================================================
// State Machine
// ============================================================================

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending_deposit: ['confirmed', 'cancelled'],
  confirmed: ['weather_hold', 'completed', 'cancelled', 'no_show'],
  weather_hold: ['confirmed', 'rescheduled', 'cancelled'],
  rescheduled: ['confirmed', 'weather_hold', 'completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// ============================================================================
// Constants
// ============================================================================

export const MAX_PARTY_SIZE = 6; // USCG 6-pack license limit

export const BOOKING_STATUSES: BookingStatus[] = [
  'pending_deposit',
  'confirmed',
  'weather_hold',
  'rescheduled',
  'completed',
  'cancelled',
  'no_show',
];

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'pending_deposit',
  'confirmed',
  'weather_hold',
  'rescheduled',
];

export const TERMINAL_BOOKING_STATUSES: BookingStatus[] = [
  'completed',
  'cancelled',
  'no_show',
];
