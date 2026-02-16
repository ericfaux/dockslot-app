import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStripe, getPriceId } from '@/lib/stripe/config';
import { isUpgrade } from '@/lib/subscription/gates';
import type { SubscriptionTier, BillingInterval } from '@/lib/db/types';

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
    // Parse request body for tier and interval
    const body = await request.json().catch(() => ({}));
    const tier = (body.tier || 'captain') as 'captain' | 'fleet';
    const interval = (body.interval || 'monthly') as BillingInterval;

    // Validate tier — only captain is available for purchase right now
    if (tier !== 'captain') {
      if (tier === 'fleet') {
        return NextResponse.json(
          { error: 'Fleet plan is coming soon. Stay tuned!' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid tier.' },
        { status: 400 }
      );
    }

    // Validate interval
    if (interval !== 'monthly' && interval !== 'annual') {
      return NextResponse.json(
        { error: 'Invalid interval. Must be "monthly" or "annual".' },
        { status: 400 }
      );
    }

    // Fetch captain profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_tier, subscription_status, stripe_subscription_id, email, business_name, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const currentTier = profile.subscription_tier as SubscriptionTier;

    // If user already has an active subscription and wants to change tier,
    // redirect to billing portal for plan changes (handles proration)
    if (
      profile.stripe_subscription_id &&
      profile.subscription_status === 'active' &&
      (currentTier === 'captain' || currentTier === 'fleet')
    ) {
      if (!isUpgrade(currentTier, tier)) {
        return NextResponse.json(
          { error: `Already on ${currentTier === 'fleet' ? 'Fleet' : 'Captain'} plan. Use billing portal to manage your subscription.` },
          { status: 400 }
        );
      }

      // For upgrades with existing subscription, redirect to portal
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id!,
        return_url: `${appUrl}/dashboard/billing`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || user.email || undefined,
        name: profile.business_name || profile.full_name || undefined,
        metadata: {
          dockslot_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session for subscription
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const priceId = getPriceId(tier, interval);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/billing?success=true&tier=${tier}`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
      metadata: {
        dockslot_user_id: user.id,
        tier,
        interval,
      },
      subscription_data: {
        metadata: {
          dockslot_user_id: user.id,
          tier,
          interval,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription checkout' },
      { status: 500 }
    );
  }
}
