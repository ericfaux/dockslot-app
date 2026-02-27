import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth/server';
import { GuestsList } from './components/GuestsList';

export default async function GuestsPage() {
  const { user, supabase } = await requireAuth();

  // Fetch trip types and profile in parallel (needed for modals)
  const [tripTypesResult, profileResult] = await Promise.all([
    supabase
      .from('trip_types')
      .select('id, title')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('business_name')
      .eq('id', user.id)
      .single(),
  ]);

  const tripTypes = (tripTypesResult.data || []).map((t) => ({ id: t.id, title: t.title }));
  const businessName = profileResult.data?.business_name || 'Our Business';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guest Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track repeat customers and build relationships
        </p>
      </div>

      {/* Guests List with Server-Side Pagination */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        }
      >
        <GuestsList tripTypes={tripTypes} businessName={businessName} />
      </Suspense>
    </div>
  );
}
