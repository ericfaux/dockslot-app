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
  | 'no_show'
  | 'expired';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'fully_paid'
  | 'partially_refunded'
  | 'fully_refunded'
  | 'pending_verification';

export type PaymentMethod = 'stripe' | 'venmo' | 'zelle';

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

export type SubscriptionTier = 'starter' | 'pro';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

// ============================================================================
// Table Interfaces
// ============================================================================

export interface Profile {
  id: string;
  business_name: string | null;
  full_name: string | null;
  timezone: string;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_current_period_end: string | null;
  created_at: string;
  meeting_spot_name: string | null;
  meeting_spot_address: string | null;
  meeting_spot_instructions: string | null;
  meeting_spot_latitude: number | null;
  meeting_spot_longitude: number | null;
  phone: string | null;
  email: string | null;
  is_hibernating: boolean;
  hibernation_message: string | null;
  hibernation_end_date: string | null; // YYYY-MM-DD format
  hibernation_resume_time: string | null; // HH:MM format (24-hour)
  hibernation_show_return_date: boolean;
  hibernation_allow_notifications: boolean;
  hibernation_show_contact_info: boolean;
  booking_buffer_minutes: number;
  advance_booking_days: number;
  cancellation_policy: string | null;
  calendar_token: string | null;
  dock_mode_enabled: boolean;
  season_revenue_goal_cents: number;
  venmo_username: string | null;
  zelle_contact: string | null;
  venmo_enabled: boolean;
  zelle_enabled: boolean;
  auto_confirm_manual_payments: boolean;
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
  is_active: boolean;
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
  payment_method: PaymentMethod;
  payment_reminder_count: number;
  payment_reminder_last_sent: string | null;
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
  device_info: WaiverDeviceInfo | null;
}

export interface WaiverDeviceInfo {
  user_agent: string;
  platform: string;
  language: string;
  screen_width: number;
  screen_height: number;
  timezone: string;
}

export interface WaiverReminder {
  id: string;
  booking_id: string;
  passenger_id: string;
  sent_at: string;
  sent_by: string | null;
  email_sent_to: string | null;
  created_at: string;
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
// Referral Types
// ============================================================================

export type ReferralRewardType = 'percentage' | 'fixed' | 'free_trip';
export type ReferralStatus = 'pending' | 'qualified' | 'rewarded' | 'expired';

export interface ReferralSettings {
  captain_id: string;
  is_enabled: boolean;
  referrer_reward_type: ReferralRewardType;
  referrer_reward_value: number; // percentage (1-100) or cents
  referee_reward_type: ReferralRewardType;
  referee_reward_value: number; // percentage (1-100) or cents
  min_booking_value_cents: number;
  reward_expiry_days: number;
  terms_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralCode {
  id: string;
  captain_id: string;
  code: string;
  guest_email: string;
  guest_name: string;
  times_used: number;
  total_bookings_value_cents: number;
  total_rewards_earned_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  captain_id: string;
  referral_code_id: string;
  referrer_email: string;
  referrer_name: string;
  referee_email: string;
  referee_name: string;
  booking_id: string | null;
  booking_value_cents: number;
  referrer_reward_cents: number;
  referee_reward_cents: number;
  referrer_reward_applied: boolean;
  referee_reward_applied: boolean;
  referrer_reward_expires_at: string | null;
  referee_reward_expires_at: string | null;
  status: ReferralStatus;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  qualified_referrals: number;
  total_bookings_value_cents: number;
  total_rewards_given_cents: number;
  active_codes: number;
  top_referrers: Array<{
    code: string;
    guest_name: string;
    times_used: number;
    total_bookings_value_cents: number;
    total_rewards_earned_cents: number;
  }>;
}

// ============================================================================
// Promo Code Types
// ============================================================================

export type PromoDiscountType = 'percentage' | 'fixed';

export interface PromoCode {
  id: string;
  captain_id: string;
  code: string;
  discount_type: PromoDiscountType;
  discount_value: number; // percentage (1-100) or cents
  valid_from: string | null; // YYYY-MM-DD
  valid_to: string | null; // YYYY-MM-DD
  max_uses: number | null; // null = unlimited
  current_uses: number;
  trip_type_ids: string[]; // empty = all trip types
  is_active: boolean;
  total_discount_cents: number;
  total_booking_revenue_cents: number;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeStats {
  total_codes: number;
  active_codes: number;
  total_uses: number;
  total_discount_given_cents: number;
  total_revenue_from_promos_cents: number;
  top_codes: Array<{
    id: string;
    code: string;
    discount_type: PromoDiscountType;
    discount_value: number;
    current_uses: number;
    max_uses: number | null;
    total_discount_cents: number;
    total_booking_revenue_cents: number;
    is_active: boolean;
    valid_from: string | null;
    valid_to: string | null;
  }>;
}

export interface PromoValidationResult {
  is_valid: boolean;
  promo_code_id: string | null;
  discount_type: PromoDiscountType | null;
  discount_value: number | null;
  discount_cents: number;
  error_message: string | null;
}

// ============================================================================
// Waitlist Types
// ============================================================================

export type WaitlistStatus = 'active' | 'notified' | 'converted' | 'cancelled' | 'expired';

export interface WaitlistEntry {
  id: string;
  captain_id: string;
  trip_type_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  party_size: number;
  preferred_date: string; // YYYY-MM-DD
  preferred_time_start: string | null; // HH:MM:SS
  preferred_time_end: string | null; // HH:MM:SS
  flexible_dates: boolean;
  special_requests: string | null;
  status: WaitlistStatus;
  notified_at: string | null;
  notified_for_booking_id: string | null;
  converted_to_booking_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface WaitlistStats {
  total_active: number;
  total_notified: number;
  total_converted: number;
  total_expired: number;
  conversion_rate: number;
  avg_wait_time_hours: number;
}

// ============================================================================
// Email Preferences Types
// ============================================================================

export interface EmailPreferences {
  captain_id: string;
  booking_confirmation_enabled: boolean;
  deposit_reminder_enabled: boolean;
  trip_reminder_enabled: boolean;
  trip_reminder_timing: ('24h' | '48h')[];
  weather_alert_enabled: boolean;
  review_request_enabled: boolean;
  cancellation_notification_enabled: boolean;
  sms_booking_confirmation: boolean;
  sms_day_of_reminder: boolean;
  sms_weather_hold: boolean;
  custom_what_to_bring: string | null;
  business_name_override: string | null;
  business_phone_override: string | null;
  logo_url: string | null;
  email_signature: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Hibernation Subscriber Types
// ============================================================================

export interface HibernationSubscriber {
  id: string;
  captain_id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  notified_at: string | null;
  unsubscribed_at: string | null;
}

// ============================================================================
// State Machine
// ============================================================================

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending_deposit: ['confirmed', 'cancelled', 'expired'],
  confirmed: ['weather_hold', 'completed', 'cancelled', 'no_show'],
  weather_hold: ['confirmed', 'rescheduled', 'cancelled'],
  rescheduled: ['confirmed', 'weather_hold', 'completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
  expired: [],
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
  'expired',
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
  'expired',
];
