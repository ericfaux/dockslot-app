import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { SideNav } from "./components/side-nav";
import { MobileHeader } from "./components/mobile-header";
import { MobileTabBar } from "./components/mobile-tab-bar";
import { QuickActionsProvider } from "./components/QuickActionsProvider";
import { SubscriptionProvider } from "@/lib/subscription/context";
import type { SubscriptionTier } from "@/lib/db/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth with automatic retry and redirect
  const { user, supabase: authSupabase } = await requireAuth();

  // Check if captain has completed onboarding + fetch subscription data
  const { data: profile } = await authSupabase
    .from("profiles")
    .select("onboarding_completed, subscription_tier, monthly_booking_count, booking_count_reset_date")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const subscriptionTier = (profile?.subscription_tier as SubscriptionTier) ?? "deckhand";

  // Lazy reset: if current month differs from booking_count_reset_date, reset count
  const resetDate = profile?.booking_count_reset_date;
  const today = new Date().toISOString().slice(0, 10);
  if (resetDate && resetDate.slice(0, 7) !== today.slice(0, 7)) {
    await authSupabase
      .from("profiles")
      .update({ monthly_booking_count: 0, booking_count_reset_date: today })
      .eq("id", user.id);
  }

  // Extract user details for the UI
  const userEmail = user.email ?? "Unknown";

  // 5. Define the Sign Out Server Action
  async function signOutAction() {
    "use server";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <SideNav userEmail={userEmail} signOutAction={signOutAction} />

      {/* Mobile Header (Visible on small screens) */}
      <MobileHeader userEmail={userEmail} signOutAction={signOutAction} />

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />

      {/* Main Content Area */}
      {/* Spacing handled by .dashboard-content in globals.css to avoid Tailwind v4 cascade issues */}
      <main className="dashboard-content">
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
            <SubscriptionProvider tier={subscriptionTier}>
              <QuickActionsProvider>
                {children}
              </QuickActionsProvider>
            </SubscriptionProvider>
          </div>
        </div>
      </main>
    </div>
  );
}
