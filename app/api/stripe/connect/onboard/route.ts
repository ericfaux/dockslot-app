import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import {
  createAccountLink,
  createConnectedAccount,
  markAccountPending,
} from '@/lib/stripe/connect';

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();

    let body: { businessName?: string; email?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional — fall through to profile lookups.
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, business_name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    const ownerEmail = body.email ?? profile?.email ?? user.email ?? null;
    if (!ownerEmail) {
      return NextResponse.json(
        {
          error:
            'A captain email is required to start Stripe Connect onboarding. Add an email to your profile first.',
        },
        { status: 400 }
      );
    }

    const businessName = body.businessName ?? profile?.business_name ?? null;

    let accountId = profile?.stripe_account_id ?? null;

    if (accountId) {
      // Reusing an existing Express account (after disconnect, or to retry
      // a stalled onboarding). Flip status to pending so the dashboard
      // immediately reflects the new attempt; the return handler resyncs
      // to active or restricted once Stripe processes the submission.
      await markAccountPending(supabase, accountId);
    } else {
      const account = await createConnectedAccount({
        ownerEmail,
        captainId: user.id,
        businessName,
      });
      accountId = account.id;

      const { error: persistError } = await supabase
        .from('profiles')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: 'pending',
        })
        .eq('id', user.id);

      if (persistError) {
        return NextResponse.json(
          { error: 'Failed to persist Stripe account id' },
          { status: 500 }
        );
      }
    }

    const origin = request.nextUrl.origin;
    const link = await createAccountLink({
      accountId,
      refreshUrl: `${origin}/api/stripe/connect/refresh`,
      returnUrl: `${origin}/api/stripe/connect/return`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });

    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error('Stripe Connect onboard failed:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to start Stripe onboarding';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
