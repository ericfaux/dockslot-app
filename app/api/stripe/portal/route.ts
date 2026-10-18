import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { getStripe } from '@/lib/stripe/config';

/** True when Stripe rejected the request because the customer ID doesn't exist in this Stripe account. */
function isMissingCustomerError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === 'resource_missing' &&
    error.param === 'customer'
  );
}

/**
 * Look for this captain's customer in the Stripe account the app is using,
 * for when the ID saved on the profile no longer exists there.
 * Checks the saved subscription first, then the dockslot_user_id metadata
 * the subscribe route puts on every customer it creates.
 */
async function findCustomerForUser(
  stripe: Stripe,
  userId: string,
  subscriptionId: string | null
): Promise<string | null> {
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customer = subscription.customer;
      return typeof customer === 'string' ? customer : customer.id;
    } catch (error) {
      console.warn('Saved subscription not found while recovering Stripe customer:', error);
    }
  }

  try {
    const result = await stripe.customers.search({
      query: `metadata['dockslot_user_id']:'${userId}'`,
      limit: 10,
    });
    const newest = [...result.data].sort((a, b) => b.created - a.created)[0];
    return newest?.id ?? null;
  } catch (error) {
    console.warn('Stripe customer search failed while recovering Stripe customer:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabase = await createClient();

  // Authenticate captain
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch captain's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Subscribe first.' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const returnUrl = `${appUrl}/dashboard/billing`;

    // Create Stripe Customer Portal session
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: returnUrl,
      });
      return NextResponse.json({ url: portalSession.url });
    } catch (error) {
      if (!isMissingCustomerError(error)) {
        throw error;
      }
    }

    // The saved customer doesn't exist in this Stripe account (for example
    // after STRIPE_SECRET_KEY was switched to a different account or mode).
    console.error('Saved Stripe customer not found in the current Stripe account', {
      userId: user.id,
      stripeCustomerId: profile.stripe_customer_id,
    });

    const recoveredCustomerId = await findCustomerForUser(
      stripe,
      user.id,
      profile.stripe_subscription_id
    );

    if (!recoveredCustomerId || recoveredCustomerId === profile.stripe_customer_id) {
      return NextResponse.json({ code: 'stripe_customer_missing' }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: recoveredCustomerId })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to save recovered Stripe customer ID:', updateError);
    } else {
      console.log('Recovered Stripe customer for user', {
        userId: user.id,
        previousCustomerId: profile.stripe_customer_id,
        stripeCustomerId: recoveredCustomerId,
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: recoveredCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Failed to access billing portal' },
      { status: 500 }
    );
  }
}
