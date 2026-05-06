import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createAccountLink } from '@/lib/stripe/connect';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_account_status')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.redirect(
      `${origin}/dashboard/payments?stripe=missing-account`
    );
  }

  const linkType: 'account_onboarding' | 'account_update' =
    profile.stripe_account_status === 'restricted'
      ? 'account_update'
      : 'account_onboarding';

  const link = await createAccountLink({
    accountId: profile.stripe_account_id,
    refreshUrl: `${origin}/api/stripe/connect/refresh`,
    returnUrl: `${origin}/api/stripe/connect/return`,
    type: linkType,
    collect: 'eventually_due',
  });

  return NextResponse.redirect(link.url);
}
