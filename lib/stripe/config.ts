import Stripe from 'stripe';
import type { SubscriptionTier, BillingInterval } from '@/lib/db/types';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return stripeInstance;
}

// ============================================================================
// Price ID Helpers
// ============================================================================

/** Get the Stripe Price ID for a given tier and billing interval */
export function getPriceId(tier: 'captain' | 'fleet', interval: BillingInterval): string {
  const envKey = `STRIPE_${tier.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID`;
  const priceId = process.env[envKey];

  if (!priceId) {
    throw new Error(
      `${envKey} not configured. Create the corresponding product/price in Stripe Dashboard and add the Price ID to environment variables.`
    );
  }

  return priceId;
}

/**
 * Map a Stripe Price ID back to a subscription tier.
 * Used by the webhook handler to determine which tier to set on the profile.
 * Includes backward compatibility with the legacy STRIPE_PRO_PRICE_ID.
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  const captainMonthly = process.env.STRIPE_CAPTAIN_MONTHLY_PRICE_ID;
  const captainAnnual = process.env.STRIPE_CAPTAIN_ANNUAL_PRICE_ID;
  const fleetMonthly = process.env.STRIPE_FLEET_MONTHLY_PRICE_ID;
  const fleetAnnual = process.env.STRIPE_FLEET_ANNUAL_PRICE_ID;

  // Legacy backward compatibility
  const legacyPro = process.env.STRIPE_PRO_PRICE_ID;

  if (priceId === captainMonthly || priceId === captainAnnual || priceId === legacyPro) {
    return 'captain';
  }
  if (priceId === fleetMonthly || priceId === fleetAnnual) {
    return 'fleet';
  }

  console.warn(`Unknown Stripe price ID: ${priceId}, defaulting to deckhand`);
  return 'deckhand';
}

// ============================================================================
// Pricing Constants (for UI display)
// ============================================================================

/** Pricing in cents for display purposes */
export const PRICING = {
  captain: {
    monthly: 29_00,
    annual: 249_00,
    /** Effective monthly price when billed annually */
    annualMonthly: Math.round(249_00 / 12),
    annualSavings: 29_00 * 12 - 249_00,
  },
  fleet: {
    monthly: 79_00,
    annual: 699_00,
    /** Effective monthly price when billed annually */
    annualMonthly: Math.round(699_00 / 12),
    annualSavings: 79_00 * 12 - 699_00,
  },
} as const;
