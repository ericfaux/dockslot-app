import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { TripReportForm } from '../components/TripReportForm';

export default async function NewTripReportPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { user, supabase } = await requireAuth();
  const params = await searchParams;

  // Fetch vessels for dropdown
  const { data: vessels } = await supabase
    .from('vessels')
    .select('id, name')
    .eq('captain_id', user.id)
    .order('name');

  // If bookingId provided, fetch booking details
  let booking = null;
  if (params.bookingId) {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        guest_name,
        party_size,
        vessel_id,
        trip_type:trip_types(title)
      `)
      .eq('id', params.bookingId)
      .eq('captain_id', user.id)
      .single();

    booking = data;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Trip Report</h1>
        <p className="mt-1 text-sm text-slate-400">
          Document trip details for safety records and compliance
        </p>
      </div>

      <TripReportForm vessels={vessels || []} booking={booking} />
    </div>
  );
}
