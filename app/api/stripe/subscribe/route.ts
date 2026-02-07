import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStripe, getProPriceId } from '@/lib/stripe/config';

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
    // Fetch captain profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_tier, email, business_name, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Already on pro
    if (profile.subscription_tier === 'pro') {
      return NextResponse.json(
        { error: 'Already subscribed to Captain Pro' },
        { status: 400 }
      );
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
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: getProPriceId(),
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
      metadata: {
        dockslot_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          dockslot_user_id: user.id,
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
