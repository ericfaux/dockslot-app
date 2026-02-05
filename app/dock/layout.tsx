// app/dock/layout.tsx
// Dock Mode Layout - Minimal, optimized for on-water use
// Design: High contrast, large touch targets, no distractions

import { requireAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dock Mode - DockSlot',
  description: 'Simplified view for captains at the dock',
  // Prevent search engine indexing of dock mode
  robots: 'noindex, nofollow',
};

export default async function DockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication
  const { user, supabase } = await requireAuth();

  // Check if dock mode is enabled for this captain
  const { data: profile } = await supabase
    .from('profiles')
    .select('dock_mode_enabled')
    .eq('id', user.id)
    .single();

  // If dock mode is not enabled, redirect to settings
  if (!profile?.dock_mode_enabled) {
    redirect('/dashboard/settings?enableDockMode=true');
  }

  return (
    <div
      className="min-h-screen bg-slate-950"
      style={{
        // Prevent auto-lock by keeping screen active (works with user interaction)
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Full screen dock mode container */}
      <div className="flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}
