import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { calculatePlatformFee } from '@/lib/stripe/config';

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(key, {
    apiVersion: '2026-01-28.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();

    // Fetch booking with trip details and captain's Stripe Connect account
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trip_type:trip_types(id, title, description),
        vessel:vessels(id, name),
        profile:profiles(id, business_name, stripe_account_id)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if deposit already paid
    if (booking.deposit_paid_cents > 0) {
      return NextResponse.json(
        { error: 'Deposit already paid' },
        { status: 400 }
      );
    }

    const captainStripeAccountId: string | null = booking.profile?.stripe_account_id ?? null;

    // If the captain has a Connect account, verify it can accept payments
    if (captainStripeAccountId) {
      const account = await stripe.accounts.retrieve(captainStripeAccountId);
      if (!account.charges_enabled) {
        console.error(
          `Captain ${booking.captain_id} Stripe account ${captainStripeAccountId} cannot accept charges (onboarding incomplete)`
        );
        return NextResponse.json(
          { error: 'The captain\'s payment account setup is not complete. Please contact the captain.' },
          { status: 400 }
        );
      }
    } else {
      // Captain has no Stripe Connect account — block checkout so funds aren't held incorrectly
      console.error(`Captain ${booking.captain_id} has no Stripe Connect account — cannot process payment`);
      return NextResponse.json(
        { error: 'The captain has not set up their payment account yet. Please contact the captain.' },
        { status: 400 }
      );
    }

    const depositAmount = Math.round(booking.total_price_cents * 0.5); // 50% deposit
    const applicationFee = calculatePlatformFee(depositAmount);
    const bookingDate = new Date(booking.scheduled_start).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create Stripe Checkout session with destination charge
    // This automatically splits payment: captain receives (depositAmount - applicationFee),
    // DockSlot keeps applicationFee as the platform fee.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${booking.trip_type.title} - Deposit`,
              description: `${bookingDate} | ${booking.profile.business_name} | ${booking.vessel.name}`,
            },
            unit_amount: depositAmount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: captainStripeAccountId,
        },
      },
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${request.nextUrl.origin}/book/${booking.captain_id}/${booking.trip_type_id}/confirm?bookingId=${bookingId}&payment=cancelled`,
      metadata: {
        bookingId: booking.id,
        depositAmount: depositAmount.toString(),
        totalAmount: booking.total_price_cents.toString(),
        captainStripeAccountId,
        applicationFee: applicationFee.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
