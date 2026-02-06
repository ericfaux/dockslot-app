import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { SideNav } from "./components/side-nav";
import { MobileHeader } from "./components/mobile-header";
import { MobileTabBar } from "./components/mobile-tab-bar";
import { QuickActionsProvider } from "./components/QuickActionsProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth with automatic retry and redirect
  const { user, supabase: authSupabase } = await requireAuth();

  // Check if captain has completed onboarding
  const { data: onboardingProfile } = await authSupabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (onboardingProfile && !onboardingProfile.onboarding_completed) {
    redirect("/onboarding");
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
      {/* pb-20 on mobile for bottom tab bar clearance, pt-16 on mobile for header */}
      {/* md:pl-16 for collapsed tablet sidebar, lg:pl-64 for full desktop sidebar */}
      <main className="md:pl-16 lg:pl-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
            <QuickActionsProvider>
              {children}
            </QuickActionsProvider>
          </div>
        </div>
      </main>
    </div>
  );
}
