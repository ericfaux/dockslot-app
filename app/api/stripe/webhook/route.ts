import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendBookingConfirmation, sendBalancePaymentConfirmation } from '@/lib/email/resend';
import { format, parseISO } from 'date-fns';
import { getStripe, getTierFromPriceId } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
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

    const supabase = createSupabaseServiceClient();

    // ========================================================================
    // DEPOSIT / BOOKING PAYMENTS
    // ========================================================================

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Subscription checkout — activate the tier immediately
      if (session.mode === 'subscription') {
        const userId = session.metadata?.dockslot_user_id;
        const tier = session.metadata?.tier;
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null;

        if (!userId || !tier) {
          console.error('Missing metadata in subscription checkout:', {
            userId,
            tier,
            sessionId: session.id,
          });
          return NextResponse.json({ received: true });
        }

        // Validate tier is a known paid tier
        const validTiers = ['captain', 'fleet'];
        if (!validTiers.includes(tier)) {
          console.error(`Invalid tier "${tier}" in subscription checkout metadata, session ${session.id}`);
          return NextResponse.json({ received: true });
        }

        const updateData: Record<string, unknown> = {
          subscription_tier: tier,
          subscription_status: 'active',
        };

        if (subscriptionId) {
          updateData.stripe_subscription_id = subscriptionId;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (updateError) {
          console.error('Failed to update profile from subscription checkout:', updateError);
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          );
        }

        console.log(`✅ Subscription checkout completed: user ${userId} upgraded to ${tier}`);
        return NextResponse.json({ received: true });
      }

      // Deposit payment checkout
      const { bookingId, depositAmount, totalAmount } = session.metadata || {};

      if (!bookingId || !depositAmount || !totalAmount) {
        console.error('Missing metadata in webhook:', session.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Update booking with deposit payment
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          deposit_paid_cents: parseInt(depositAmount),
          balance_due_cents: parseInt(totalAmount) - parseInt(depositAmount),
          status: 'confirmed',
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

      console.log(`✅ Deposit payment processed for booking ${bookingId}`);
    }

    // ========================================================================
    // BALANCE PAYMENTS
    // ========================================================================

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { bookingId, paymentType } = paymentIntent.metadata || {};

      if (paymentType === 'balance' && bookingId) {
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

    // ========================================================================
    // SUBSCRIPTION EVENTS (Captain / Fleet billing)
    // ========================================================================

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.dockslot_user_id;

      if (!userId) {
        console.error('Missing dockslot_user_id in subscription metadata:', subscription.id);
        return NextResponse.json({ received: true });
      }

      const isActive = ['active', 'trialing'].includes(subscription.status);

      // Derive tier from the subscription's price ID
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const tier = priceId ? getTierFromPriceId(priceId) : 'deckhand';

      // In Stripe SDK v20+, current_period_end is on SubscriptionItem, not Subscription
      const periodEnd = subscription.items?.data?.[0]?.current_period_end;

      const updateData: Record<string, unknown> = {
        subscription_tier: isActive ? tier : 'deckhand',
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status === 'active' ? 'active'
          : subscription.status === 'trialing' ? 'trialing'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'canceled' ? 'canceled'
          : subscription.status === 'unpaid' ? 'unpaid'
          : 'active',
      };

      if (periodEnd) {
        updateData.subscription_current_period_end = new Date(periodEnd * 1000).toISOString();
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      console.log(`✅ Subscription ${event.type} for user ${userId}: ${subscription.status}`);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.dockslot_user_id;

      if (!userId) {
        console.error('Missing dockslot_user_id in subscription metadata:', subscription.id);
        return NextResponse.json({ received: true });
      }

      // Downgrade to deckhand
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'deckhand',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          monthly_booking_count: 0,
          booking_count_reset_date: new Date().toISOString().slice(0, 10),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to downgrade subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      // Archive extra trip types (keep only the oldest active one)
      const { data: tripTypes } = await supabase
        .from('trip_types')
        .select('id')
        .eq('owner_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (tripTypes && tripTypes.length > 1) {
        const idsToDeactivate = tripTypes.slice(1).map((t: { id: string }) => t.id);
        await supabase
          .from('trip_types')
          .update({ is_active: false })
          .in('id', idsToDeactivate);
        console.log(`Archived ${idsToDeactivate.length} extra trip types for user ${userId}`);
      }

      // Archive extra vessels (keep only the oldest one)
      const { data: vessels } = await supabase
        .from('vessels')
        .select('id')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (vessels && vessels.length > 1) {
        const vesselIdsToArchive = vessels.slice(1).map((v: { id: string }) => v.id);
        await supabase
          .from('vessels')
          .delete()
          .in('id', vesselIdsToArchive)
          .then(() => {
            // If delete fails (FK constraints), that's fine — data is preserved
          });
        console.log(`Attempted to archive ${vesselIdsToArchive.length} extra vessels for user ${userId}`);
      }

      console.log(`✅ Subscription canceled for user ${userId}`);
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      // In Stripe SDK v20+, subscription is nested under parent.subscription_details
      const subDetails = invoice.parent?.subscription_details;
      const subscriptionId = typeof subDetails?.subscription === 'string'
        ? subDetails.subscription
        : subDetails?.subscription?.id ?? null;

      if (subscriptionId) {
        // Mark as past_due — Stripe will retry automatically
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId);

        if (updateError) {
          console.error('Failed to update payment failure:', updateError);
        }

        console.log(`⚠️ Invoice payment failed for subscription ${subscriptionId}`);
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
