import type { SubscriptionTier } from '@/lib/db/types';

/**
 * DockSlot Subscription Gates
 *
 * Previously implemented a 3-tier feature gating system (Deckhand/Captain/Fleet).
 * Now simplified to a single paid tier — all features are available to all users.
 * These functions are kept as no-ops for backward compatibility with components
 * that still reference them.
 */

/** Features that were previously gated (kept for type compatibility) */
export type GatedFeature = string;

/** All features are available — always returns true */
export function canUseFeature(_tier: SubscriptionTier, _feature: GatedFeature): boolean {
  return true;
}

/** No limits enforced — always returns false */
export function isAtBookingLimit(_tier: SubscriptionTier, _currentMonthBookings: number): boolean {
  return false;
}

/** No limits enforced — always returns false */
export function isAtTripTypeLimit(_tier: SubscriptionTier, _currentTripTypeCount: number): boolean {
  return false;
}

/** No limits enforced — always returns false */
export function isAtVesselLimit(_tier: SubscriptionTier, _currentVesselCount: number): boolean {
  return false;
}

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

/** Check if upgrading from one tier to another is valid */
export function isUpgrade(from: SubscriptionTier, to: SubscriptionTier): boolean {
  const levels: Record<SubscriptionTier, number> = { deckhand: 0, captain: 1, fleet: 2 };
  return levels[to] > levels[from];
}

/** Get the minimum tier required for a feature (always returns deckhand now) */
export function getMinimumTier(_feature: GatedFeature): SubscriptionTier {
  return 'deckhand';
}
