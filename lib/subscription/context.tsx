'use client'

import type { SubscriptionTier } from '@/lib/db/types'

interface SubscriptionContextValue {
  tier: SubscriptionTier
}

/**
 * useSubscription - Previously provided subscription tier context.
 * Now always returns 'captain' since all users are on a single paid tier.
 * Kept for backward compatibility with components that still reference it.
 */
export function useSubscription(): SubscriptionContextValue {
  return { tier: 'captain' }
}
