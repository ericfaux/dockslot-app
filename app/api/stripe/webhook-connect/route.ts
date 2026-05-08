import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import {
  markAccountDisconnected,
  syncAccountToProfile,
  verifyWebhookSignature,
} from '@/lib/stripe/connect';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_CONNECT;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET_CONNECT not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(body, signature, webhookSecret);
  } catch (err) {
    console.error('Connect webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  try {
    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      const profileId = await syncAccountToProfile(supabase, account);
      if (!profileId) {
        // No captain row references this Stripe account. Common during
        // reconnect-after-disconnect where the platform-side row was wiped,
        // or when Stripe replays an event for an account we've never seen.
        // Return 200 so Stripe doesn't retry forever.
        console.warn(
          `account.updated for ${account.id} matched no profile row`
        );
      } else {
        console.log(
          `Synced account.updated for ${account.id} -> profile ${profileId}`
        );
      }
    } else if (event.type === 'account.application.deauthorized') {
      // For this event, the connected account ID is on the event's top-level
      // `account` field; `data.object` is the Application object, not the
      // Account. Stripe docs:
      // https://stripe.com/docs/api/events/types#event_types-account.application.deauthorized
      const accountId = event.account;
      if (!accountId) {
        console.error(
          'account.application.deauthorized missing event.account'
        );
        return NextResponse.json({ received: true });
      }
      await markAccountDisconnected(supabase, accountId);
      console.log(`Marked ${accountId} disconnected (deauthorized)`);
    } else if (event.type.startsWith('account.')) {
      console.log(`Unhandled Connect account event: ${event.type}`);
    } else {
      // Connect webhook should only receive account.* events given the
      // dashboard configuration, but tolerate anything else without erroring.
      console.log(`Connect webhook received non-account event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Connect webhook handler failed:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
