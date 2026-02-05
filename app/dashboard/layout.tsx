import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { SideNav } from "./components/side-nav";
import { MobileHeader } from "./components/mobile-header";
import { QuickActionsProvider } from "./components/QuickActionsProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth with automatic retry and redirect
  const { user } = await requireAuth();

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
    <div className="min-h-screen bg-gray-950">
      {/* Desktop Sidebar */}
      <SideNav userEmail={userEmail} signOutAction={signOutAction} />

      {/* Mobile Header (Visible on small screens) */}
      <MobileHeader userEmail={userEmail} signOutAction={signOutAction} />

      {/* Main Content Area - Maritime Helm Theme */}
      <main className="md:pl-64 pt-16 md:pt-0">
        <div className="min-h-screen bg-gray-950">
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
