import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceClient } from '@/utils/supabase/service';

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

    // Fetch booking with trip details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trip_type:trip_types(id, title, description),
        vessel:vessels(id, name),
        profile:profiles(id, business_name)
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

    const depositAmount = Math.round(booking.total_price_cents * 0.5); // 50% deposit
    const bookingDate = new Date(booking.scheduled_start).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create Stripe Checkout session
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
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${request.nextUrl.origin}/book/${booking.captain_id}/${booking.trip_type_id}/confirm?bookingId=${bookingId}&payment=cancelled`,
      metadata: {
        bookingId: booking.id,
        depositAmount: depositAmount.toString(),
        totalAmount: booking.total_price_cents.toString(),
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
