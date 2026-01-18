import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ensureAvailabilityExists } from "@/app/actions/availability";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=auth_code_error", origin),
      );
    }

    // Ensure the user has default availability windows set up
    // This handles cases where the database trigger didn't run (e.g., existing users)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await ensureAvailabilityExists(user.id);
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
