import type { SubscriptionTier } from '@/lib/db/types';

/**
 * DockSlot 3-Tier Feature Gating
 *
 * Deckhand (Free) — limited features, no Stripe
 * Captain ($29/mo or $249/yr) — full features for working captains
 * Fleet ($79/mo or $699/yr) — multi-boat/team features (Coming Soon items)
 */

// ============================================================================
// Limits
// ============================================================================

/** Monthly booking limit for Deckhand plan */
export const DECKHAND_BOOKING_LIMIT = 10;

/** Trip type limit for Deckhand plan */
export const DECKHAND_TRIP_TYPE_LIMIT = 1;

/** Vessel limit for Deckhand plan */
export const DECKHAND_VESSEL_LIMIT = 1;

/** Staff account limit for Fleet plan */
export const FLEET_STAFF_LIMIT = 5;

// ============================================================================
// Gated Features
// ============================================================================

/** Features gated behind paid tiers */
export type GatedFeature =
  // Captain+ features
  | 'deposit_collection'
  | 'stripe_payments'
  | 'unlimited_bookings'
  | 'sms_reminders'
  | 'custom_branding'
  | 'custom_booking_branding'
  | 'full_analytics'
  | 'full_dashboard_stats'
  | 'promo_codes'
  | 'csv_export'
  | 'priority_email_support'
  | 'waitlist'
  | 'reviews_ratings'
  | 'weather_alerts'
  | 'day_calendar_view'
  | 'quick_block'
  | 'booking_modifications'
  | 'print_booking'
  | 'captains_logbook'
  | 'advanced_filters'
  | 'bulk_actions'
  | 'filter_presets'
  | 'keyboard_shortcuts'
  | 'quick_note'
  | 'helm_dashboard'
  | 'float_plan'
  | 'guest_portal'
  | 'full_email_suite'
  | 'email_branding'
  | 'website_embed'
  | 'remove_dockslot_branding'
  | 'guest_crm'
  | 'reports'
  | 'passenger_manifest'
  | 'trip_reports'
  | 'hibernation_mode'
  // Fleet-only features (Coming Soon)
  | 'staff_accounts'
  | 'api_access'
  | 'white_label'
  | 'advanced_analytics'
  | 'priority_phone_support'
  | 'multi_vessel_management';

/** Features unlocked at the Captain tier (and above) */
const CAPTAIN_FEATURES: GatedFeature[] = [
  'deposit_collection',
  'stripe_payments',
  'unlimited_bookings',
  'sms_reminders',
  'custom_branding',
  'custom_booking_branding',
  'full_analytics',
  'full_dashboard_stats',
  'promo_codes',
  'csv_export',
  'priority_email_support',
  'waitlist',
  'reviews_ratings',
  'weather_alerts',
  'day_calendar_view',
  'quick_block',
  'booking_modifications',
  'print_booking',
  'captains_logbook',
  'advanced_filters',
  'bulk_actions',
  'filter_presets',
  'keyboard_shortcuts',
  'quick_note',
  'helm_dashboard',
  'float_plan',
  'guest_portal',
  'full_email_suite',
  'email_branding',
  'website_embed',
  'remove_dockslot_branding',
  'guest_crm',
  'reports',
  'passenger_manifest',
  'trip_reports',
  'hibernation_mode',
];

/** Features exclusive to the Fleet tier */
const FLEET_ONLY_FEATURES: GatedFeature[] = [
  'staff_accounts',
  'api_access',
  'white_label',
  'advanced_analytics',
  'priority_phone_support',
  'multi_vessel_management',
];

// ============================================================================
// Feature Metadata (for upgrade prompts)
// ============================================================================

interface FeatureMeta {
  displayName: string;
  description: string;
}

export const FEATURE_METADATA: Partial<Record<GatedFeature, FeatureMeta>> = {
  helm_dashboard: { displayName: 'DockSlot Helm', description: 'Live tide, wind, and sunset data from NOAA for your meeting spot.' },
  weather_alerts: { displayName: 'Weather Alerts', description: 'NOAA weather alerts and monitoring for your area.' },
  float_plan: { displayName: 'Float Plan', description: 'Daily schedule with weather conditions for each trip.' },
  full_dashboard_stats: { displayName: 'Full Dashboard Stats', description: 'Revenue, deposit, and average booking analytics.' },
  full_email_suite: { displayName: 'Full Email Suite', description: 'Deposit reminders, trip reminders, weather alerts, and review request emails.' },
  email_branding: { displayName: 'Email Branding', description: 'Custom logo, business name, and email signature.' },
  sms_reminders: { displayName: 'SMS Notifications', description: 'Text message confirmations, reminders, and weather hold alerts.' },
  custom_booking_branding: { displayName: 'Custom Booking Branding', description: 'Hero image, tagline, accent color, and custom URL slug.' },
  website_embed: { displayName: 'Website Embed', description: 'Embed your booking widget on your own website.' },
  remove_dockslot_branding: { displayName: 'Remove DockSlot Branding', description: 'Remove the "Powered by DockSlot" badge from your booking page.' },
  guest_crm: { displayName: 'Guest CRM', description: 'Track guest history, lifetime value, and trip statistics.' },
  reports: { displayName: 'Reports & Analytics', description: 'Revenue reports, booking analytics, and business insights.' },
  passenger_manifest: { displayName: 'Passenger Manifest', description: 'USCG-compliant passenger manifest for each trip.' },
  reviews_ratings: { displayName: 'Reviews & Ratings', description: 'Collect and display guest reviews and ratings.' },
  waitlist: { displayName: 'Waitlist', description: 'Let guests join a waitlist when trips are fully booked.' },
  booking_modifications: { displayName: 'Booking Modifications', description: 'Reschedule and modify existing bookings.' },
  captains_logbook: { displayName: "Captain's Logbook", description: 'Add notes, tags, and internal comments to bookings.' },
  guest_portal: { displayName: 'Guest Portal', description: 'Self-service portal for guests to view and manage bookings.' },
  deposit_collection: { displayName: 'Stripe Deposits', description: 'Collect deposits and payments online via Stripe.' },
  stripe_payments: { displayName: 'Stripe Payments', description: 'Accept credit card payments through Stripe Connect.' },
  promo_codes: { displayName: 'Promo Codes', description: 'Create discount codes for your booking page.' },
  csv_export: { displayName: 'CSV Export', description: 'Export your bookings to a CSV file.' },
  day_calendar_view: { displayName: 'Day Calendar View', description: 'Detailed day-by-day view with hourly time slots.' },
  quick_block: { displayName: 'Quick Block', description: 'Quickly block off dates and time ranges.' },
  print_booking: { displayName: 'Print Booking', description: 'Print booking confirmations and trip details.' },
  advanced_filters: { displayName: 'Advanced Filters', description: 'Filter bookings by status, payment, date range, and tags.' },
  bulk_actions: { displayName: 'Bulk Actions', description: 'Select multiple bookings for bulk operations.' },
  filter_presets: { displayName: 'Filter Presets', description: 'Save and apply your most-used filter combinations.' },
  keyboard_shortcuts: { displayName: 'Keyboard Shortcuts', description: 'Quick keyboard shortcuts for common actions.' },
  quick_note: { displayName: 'Quick Note', description: 'Add quick notes from the dashboard.' },
  trip_reports: { displayName: 'Trip Reports', description: 'Post-trip reports with conditions and catch data.' },
  hibernation_mode: { displayName: 'Hibernation Mode', description: 'Pause bookings during off-season with a custom message.' },
};

// ============================================================================
// Feature Checks
// ============================================================================

/** Check if a feature is available on the given tier */
export function canUseFeature(tier: SubscriptionTier, feature: GatedFeature): boolean {
  // Paywalls disabled — all features unlocked for all tiers
  return true;
}

/** Get the minimum tier required for a feature (for upgrade prompts) */
export function getMinimumTier(feature: GatedFeature): SubscriptionTier {
  if (FLEET_ONLY_FEATURES.includes(feature)) return 'fleet';
  if (CAPTAIN_FEATURES.includes(feature)) return 'captain';
  return 'deckhand';
}

// ============================================================================
// Limit Checks
// ============================================================================

/** Check if a captain has hit their monthly booking limit */
export function isAtBookingLimit(
  tier: SubscriptionTier,
  currentMonthBookings: number
): boolean {
  // Paywalls disabled — no booking limits
  return false;
}

/** Check if a captain has hit their trip type limit */
export function isAtTripTypeLimit(
  tier: SubscriptionTier,
  currentTripTypeCount: number
): boolean {
  // Paywalls disabled — no trip type limits
  return false;
}

/** Check if a captain has hit their vessel limit */
export function isAtVesselLimit(
  tier: SubscriptionTier,
  currentVesselCount: number
): boolean {
  // Paywalls disabled — no vessel limits
  return false;
}

/** Get the booking limit for a tier (null = unlimited) */
export function getBookingLimit(tier: SubscriptionTier): number | null {
  // Paywalls disabled — unlimited for all
  return null;
}

/** Get the trip type limit for a tier (null = unlimited) */
export function getTripTypeLimit(tier: SubscriptionTier): number | null {
  // Paywalls disabled — unlimited for all
  return null;
}

/** Get the vessel limit for a tier (null = unlimited) */
export function getVesselLimit(tier: SubscriptionTier): number | null {
  // Paywalls disabled — unlimited for all
  return null;
}

// ============================================================================
// Display Helpers
// ============================================================================

/** Get the display name for a tier */
export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'fleet':
      return 'Fleet';
    case 'captain':
      return 'Captain';
    case 'deckhand':
    default:
      return 'Deckhand';
  }
}

/** Ordered tier levels for comparison */
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  deckhand: 0,
  captain: 1,
  fleet: 2,
};

/** Check if a tier is higher than another */
export function isHigherTier(tier: SubscriptionTier, than: SubscriptionTier): boolean {
  return TIER_LEVELS[tier] > TIER_LEVELS[than];
}

/** Check if upgrading from one tier to another is valid */
export function isUpgrade(from: SubscriptionTier, to: SubscriptionTier): boolean {
  return TIER_LEVELS[to] > TIER_LEVELS[from];
}
