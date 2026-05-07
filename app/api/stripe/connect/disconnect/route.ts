import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { markAccountDisconnected } from '@/lib/stripe/connect';

export async function POST() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ ok: true });
    }

    // RLS policy "Users can update own profile" gates by auth.uid() = id,
    // so the user-scoped client can update its own profile row. No need
    // for the service role.
    await markAccountDisconnected(supabase, profile.stripe_account_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Stripe Connect disconnect failed:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to disconnect Stripe account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
