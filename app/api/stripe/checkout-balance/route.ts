import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { getStripe, calculatePlatformFee } from '@/lib/stripe/config';
import { isBefore, parseISO } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { bookingId, token } = await request.json();

    if (!bookingId || !token) {
      return NextResponse.json(
        { error: 'Missing bookingId or token' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();

    // Verify the guest token is valid and matches the booking
    const { data: guestToken } = await supabase
      .from('guest_tokens')
      .select('booking_id, expires_at')
      .eq('token', token)
      .single();

    if (!guestToken || guestToken.booking_id !== bookingId) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 403 }
      );
    }

    // Check token expiry
    if (isBefore(parseISO(guestToken.expires_at), new Date())) {
      return NextResponse.json(
        { error: 'This link has expired. Please contact the captain.' },
        { status: 403 }
      );
    }

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

    // Verify there's actually a balance to pay
    if (booking.balance_due_cents <= 0) {
      return NextResponse.json(
        { error: 'This booking is already fully paid' },
        { status: 400 }
      );
    }

    // Verify the booking is in a payable state
    if (!['confirmed', 'rescheduled'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'This booking cannot accept payments in its current state' },
        { status: 400 }
      );
    }

    const captainStripeAccountId: string | null = booking.profile?.stripe_account_id ?? null;

    // Verify captain's Stripe account
    if (captainStripeAccountId) {
      const account = await stripe.accounts.retrieve(captainStripeAccountId);
      if (!account.charges_enabled) {
        return NextResponse.json(
          { error: 'The captain\'s payment account setup is not complete. Please contact the captain.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'The captain has not set up their payment account yet. Please contact the captain.' },
        { status: 400 }
      );
    }

    const balanceAmount = booking.balance_due_cents;
    const applicationFee = calculatePlatformFee(balanceAmount);
    const bookingDate = new Date(booking.scheduled_start).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create Stripe Checkout session for balance payment with destination charge
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${booking.trip_type.title} - Balance Payment`,
              description: `${bookingDate} | ${booking.profile.business_name} | ${booking.vessel.name}`,
            },
            unit_amount: balanceAmount,
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
      success_url: `${request.nextUrl.origin}/manage/${token}?payment=balance_success`,
      cancel_url: `${request.nextUrl.origin}/manage/${token}?payment=cancelled`,
      metadata: {
        bookingId: booking.id,
        paymentType: 'balance',
        balanceAmount: balanceAmount.toString(),
        totalAmount: booking.total_price_cents.toString(),
        captainStripeAccountId,
        applicationFee: applicationFee.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Balance checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
