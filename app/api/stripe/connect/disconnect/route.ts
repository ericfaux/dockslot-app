import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { markAccountDisconnected } from '@/lib/stripe/connect';

export async function POST() {
  const { user, supabase: userSupabase } = await requireAuth();

  const { data: profile } = await userSupabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ ok: true });
  }

  // Use the service client so the disconnect write isn't gated by RLS
  // policies that may scope profile updates by session role.
  const adminSupabase = createSupabaseServiceClient();
  await markAccountDisconnected(adminSupabase, profile.stripe_account_id);

  return NextResponse.json({ ok: true });
}
