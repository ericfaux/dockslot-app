import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { retrieveAccount, syncAccountToProfile } from '@/lib/stripe/connect';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = createSupabaseServiceClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.redirect(
      `${origin}/dashboard/payments?stripe=missing-account`
    );
  }

  try {
    const account = await retrieveAccount(profile.stripe_account_id);
    await syncAccountToProfile(supabase, account);
  } catch (err) {
    console.error('Stripe Connect return handler failed:', err);
    return NextResponse.redirect(
      `${origin}/dashboard/payments?stripe=sync-failed`
    );
  }

  return NextResponse.redirect(
    `${origin}/dashboard/payments?stripe=connected`
  );
}
