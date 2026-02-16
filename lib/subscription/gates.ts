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
export const DECKHAND_BOOKING_LIMIT = 30;

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
  | 'full_analytics'
  | 'promo_codes'
  | 'csv_export'
  | 'priority_email_support'
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
  'full_analytics',
  'promo_codes',
  'csv_export',
  'priority_email_support',
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
// Feature Checks
// ============================================================================

/** Check if a feature is available on the given tier */
export function canUseFeature(tier: SubscriptionTier, feature: GatedFeature): boolean {
  // Fleet gets everything
  if (tier === 'fleet') return true;
  // Captain gets Captain-level features
  if (tier === 'captain') return CAPTAIN_FEATURES.includes(feature);
  // Deckhand gets none of the gated features
  return false;
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
  if (tier === 'captain' || tier === 'fleet') return false;
  return currentMonthBookings >= DECKHAND_BOOKING_LIMIT;
}

/** Check if a captain has hit their trip type limit */
export function isAtTripTypeLimit(
  tier: SubscriptionTier,
  currentTripTypeCount: number
): boolean {
  if (tier === 'captain' || tier === 'fleet') return false;
  return currentTripTypeCount >= DECKHAND_TRIP_TYPE_LIMIT;
}

/** Check if a captain has hit their vessel limit */
export function isAtVesselLimit(
  tier: SubscriptionTier,
  currentVesselCount: number
): boolean {
  if (tier === 'captain' || tier === 'fleet') return false;
  return currentVesselCount >= DECKHAND_VESSEL_LIMIT;
}

/** Get the booking limit for a tier (null = unlimited) */
export function getBookingLimit(tier: SubscriptionTier): number | null {
  if (tier === 'deckhand') return DECKHAND_BOOKING_LIMIT;
  return null;
}

/** Get the trip type limit for a tier (null = unlimited) */
export function getTripTypeLimit(tier: SubscriptionTier): number | null {
  if (tier === 'deckhand') return DECKHAND_TRIP_TYPE_LIMIT;
  return null;
}

/** Get the vessel limit for a tier (null = unlimited) */
export function getVesselLimit(tier: SubscriptionTier): number | null {
  if (tier === 'deckhand') return DECKHAND_VESSEL_LIMIT;
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
