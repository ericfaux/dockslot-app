import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { retrieveAccount, syncAccountToProfile } from '@/lib/stripe/connect';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  try {
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

    const account = await retrieveAccount(profile.stripe_account_id);
    await syncAccountToProfile(supabase, account);

    return NextResponse.redirect(
      `${origin}/dashboard/payments?stripe=connected`
    );
  } catch (err) {
    // Redirect rather than returning JSON 500: Stripe sends the captain
    // back to this endpoint via browser navigation, so a bare 500 drops
    // them onto Chrome's error page. Sync-failed lands them on the
    // dashboard with a banner explaining the failure.
    console.error('Stripe Connect return handler failed:', err);
    return NextResponse.redirect(
      `${origin}/dashboard/payments?stripe=sync-failed`
    );
  }
}
