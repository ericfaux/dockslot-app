import Stripe from 'stripe';

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

/**
 * Stripe Price ID for Captain Pro ($29/month).
 *
 * You must create a Product + Price in Stripe Dashboard:
 * 1. Go to https://dashboard.stripe.com/products
 * 2. Click "Add product"
 * 3. Name: "Captain Pro", Price: $29/month (recurring)
 * 4. Copy the Price ID (starts with price_) and set it below or as env var
 */
export function getProPriceId(): string {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    throw new Error(
      'STRIPE_PRO_PRICE_ID not configured. Create a $29/month product in Stripe Dashboard and add the Price ID to environment variables.'
    );
  }
  return priceId;
}
