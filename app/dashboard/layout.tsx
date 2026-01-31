import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { SideNav } from "./components/side-nav";
import { MobileHeader } from "./components/mobile-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Initialize Supabase Client
  const supabase = await createSupabaseServerClient();

  // 2. Check for a valid user session with retry logic
  // getUser() is safer than getSession() for server-side route protection
  let user = null;
  let authError = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    authError = error;

    // If getUser fails, try once more (handles transient failures)
    if (!user && error) {
      console.warn('[Dashboard Auth] First auth check failed, retrying...', error.message);
      const retryResult = await supabase.auth.getUser();
      user = retryResult.data.user;
      authError = retryResult.error;
    }
  } catch (err) {
    console.error('[Dashboard Auth] Exception during auth check:', err);
  }

  // 3. The "Bouncer": Redirect if not logged in
  // Only redirect if we're certain there's no valid session
  if (!user) {
    if (authError) {
      console.error('[Dashboard Auth] Redirecting to login:', authError.message);
    }
    redirect("/login");
  }

  // 4. Extract user details for the UI
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
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
