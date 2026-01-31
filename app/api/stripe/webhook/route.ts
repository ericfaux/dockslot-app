import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendBookingConfirmation, sendBalancePaymentConfirmation } from '@/lib/email/resend';
import { format, parseISO } from 'date-fns';

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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { bookingId, depositAmount, totalAmount } = session.metadata || {};

      if (!bookingId || !depositAmount || !totalAmount) {
        console.error('Missing metadata in webhook:', session.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const supabase = createSupabaseServiceClient();

      // Update booking with deposit payment
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          deposit_paid_cents: parseInt(depositAmount),
          balance_due_cents: parseInt(totalAmount) - parseInt(depositAmount),
          status: 'confirmed', // Move from pending_deposit to confirmed
          deposit_paid_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Failed to update booking:', updateError);
        return NextResponse.json(
          { error: 'Failed to update booking' },
          { status: 500 }
        );
      }

      // Log the payment
      const { error: logError } = await supabase
        .from('booking_logs')
        .insert({
          booking_id: bookingId,
          actor: 'system',
          entry_type: 'payment_received',
          entry_text: `Deposit payment received via Stripe: $${(parseInt(depositAmount) / 100).toFixed(2)}`,
          metadata: {
            stripe_session_id: session.id,
            payment_intent: session.payment_intent,
            amount_cents: depositAmount,
          },
        });

      if (logError) {
        console.error('Failed to log payment:', logError);
      }

      // Fetch booking details with related data for email
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          trip_type:trip_types(title),
          vessel:vessels(name),
          profile:profiles(full_name, business_name, meeting_spot_name)
        `)
        .eq('id', bookingId)
        .single();

      // Send confirmation email to guest
      if (booking) {
        const managementUrl = `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.management_token}`;
        const formattedDate = format(parseISO(booking.scheduled_start), 'EEEE, MMMM d, yyyy');
        const formattedTime = format(parseISO(booking.scheduled_start), 'h:mm a');
        
        await sendBookingConfirmation({
          to: booking.guest_email,
          guestName: booking.guest_name,
          tripType: booking.trip_type?.title || 'Charter Trip',
          date: formattedDate,
          time: formattedTime,
          vessel: booking.vessel?.name || 'Charter Vessel',
          meetingSpot: booking.profile?.meeting_spot_name || 'TBD',
          captainName: booking.profile?.full_name || booking.profile?.business_name || 'Your Captain',
          totalPrice: `$${(booking.total_price_cents / 100).toFixed(2)}`,
          depositPaid: `$${(booking.deposit_paid_cents / 100).toFixed(2)}`,
          balanceDue: `$${(booking.balance_due_cents / 100).toFixed(2)}`,
          managementUrl,
        });
      }

      // Note: Captain email notifications would require email field in profiles table

      console.log(`✅ Payment processed for booking ${bookingId}`);
    }

    // Handle balance payment confirmation
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { bookingId, paymentType } = paymentIntent.metadata || {};

      if (paymentType === 'balance' && bookingId) {
        const supabase = createSupabaseServiceClient();

        // Update booking with balance payment
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            balance_due_cents: 0,
            payment_status: 'fully_paid',
            balance_paid_at: new Date().toISOString(),
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Failed to update booking with balance payment:', updateError);
          return NextResponse.json(
            { error: 'Failed to update booking' },
            { status: 500 }
          );
        }

        // Log the payment
        await supabase.from('booking_logs').insert({
          booking_id: bookingId,
          actor: 'system',
          entry_type: 'payment_received',
          entry_text: `Balance payment received via Stripe: $${(paymentIntent.amount / 100).toFixed(2)}`,
          metadata: {
            payment_intent: paymentIntent.id,
            amount_cents: paymentIntent.amount,
          },
        });

        // Fetch booking details for email
        const { data: booking } = await supabase
          .from('bookings')
          .select(`
            *,
            trip_type:trip_types(title)
          `)
          .eq('id', bookingId)
          .single();

        // Send balance payment confirmation email
        if (booking) {
          const managementUrl = `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.management_token}`;
          const formattedDate = format(parseISO(booking.scheduled_start), 'EEEE, MMMM d, yyyy');
          
          await sendBalancePaymentConfirmation({
            to: booking.guest_email,
            guestName: booking.guest_name,
            tripType: booking.trip_type?.title || 'Charter Trip',
            date: formattedDate,
            amountPaid: `$${(paymentIntent.amount / 100).toFixed(2)}`,
            managementUrl,
          });
        }

        console.log(`✅ Balance payment processed for booking ${bookingId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
