import type { SubscriptionTier } from '@/lib/db/types';

/**
 * Features gated behind Captain Pro ($29/month).
 * Starter captains can still use the platform but with limits.
 */

/** Monthly booking limit for Starter plan */
export const STARTER_BOOKING_LIMIT = 30;

/** Check if a feature is available on the given tier */
export function canUseFeature(
  tier: SubscriptionTier,
  feature: 'deposit_collection' | 'unlimited_bookings' | 'sms_reminders' | 'custom_branding' | 'priority_support'
): boolean {
  if (tier === 'pro') return true;

  // Starter-accessible features (everything not in the list above)
  // Deposit collection, SMS, custom branding, priority support require Pro
  return false;
}

/** Check if a captain has hit their booking limit */
export function isAtBookingLimit(
  tier: SubscriptionTier,
  currentMonthBookings: number
): boolean {
  if (tier === 'pro') return false;
  return currentMonthBookings >= STARTER_BOOKING_LIMIT;
}

/** Get the display name for a tier */
export function getTierDisplayName(tier: SubscriptionTier): string {
  return tier === 'pro' ? 'Captain Pro' : 'Starter';
}
