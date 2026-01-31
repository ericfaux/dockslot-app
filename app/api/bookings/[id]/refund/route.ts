import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

// Initialize Stripe (will fail gracefully if no API key)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.',
      },
      { status: 503 }
    );
  }

  const { id: bookingId } = await context.params;
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { refund_amount_cents, reason } = body;

    // Validate inputs
    if (!refund_amount_cents || refund_amount_cents <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Refund reason is required' },
        { status: 400 }
      );
    }

    // Fetch booking with owner check
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, trip_type:trip_types(title)')
      .eq('id', bookingId)
      .eq('profile_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify refund amount doesn't exceed what was paid
    const paidSoFar = booking.total_price_cents - booking.balance_due_cents;
    if (refund_amount_cents > paidSoFar) {
      return NextResponse.json(
        { error: 'Refund amount exceeds amount paid' },
        { status: 400 }
      );
    }

    // Check if there's a Stripe payment intent to refund
    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment found to refund' },
        { status: 400 }
      );
    }

    // Create refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: refund_amount_cents,
      reason: 'requested_by_customer', // Stripe requires specific reason codes
      metadata: {
        booking_id: bookingId,
        captain_reason: reason.trim(),
      },
    });

    // Update booking in database
    const newBalanceDue = booking.balance_due_cents + refund_amount_cents;
    const newDepositPaid = Math.max(
      0,
      booking.deposit_paid_cents - refund_amount_cents
    );

    await supabase
      .from('bookings')
      .update({
        balance_due_cents: newBalanceDue,
        deposit_paid_cents: newDepositPaid,
        status:
          newBalanceDue >= booking.total_price_cents
            ? 'cancelled'
            : booking.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    // Log audit entry
    await supabase.from('audit_log').insert({
      booking_id: bookingId,
      action: 'refund_issued',
      details: {
        refund_amount_cents,
        reason: reason.trim(),
        stripe_refund_id: refund.id,
        refund_status: refund.status,
      },
      created_by: user.id,
    });

    // TODO: Send refund notification email to guest
    // This would use the email service (Resend) to notify the guest

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
