import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { TripReportsList } from './components/TripReportsList';
import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function TripReportsPage() {
  const { user, supabase } = await requireAuth()

  // Fetch trip reports with booking details
  const { data: reports } = await supabase
    .from('trip_reports')
    .select(`
      id,
      created_at,
      departure_time,
      arrival_time,
      actual_passengers,
      conditions_summary,
      incidents,
      notes,
      weather_conditions,
      booking:bookings(
        id,
        scheduled_start,
        guest_name,
        trip_type:trip_types(title),
        vessel:vessels(name)
      )
    `)
    .eq('captain_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch completed bookings without reports (prompt to create)
  const { data: completedBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      scheduled_start,
      guest_name,
      trip_type:trip_types(title),
      vessel:vessels(name)
    `)
    .eq('captain_id', user.id)
    .eq('status', 'completed')
    .is('trip_reports.id', null)
    .limit(5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trip Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            Document trips for records, safety, and compliance
          </p>
        </div>
        <Link
          href="/dashboard/reports/new"
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Link>
      </div>

      {/* Pending Reports (Completed trips without reports) */}
      {completedBookings && completedBookings.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            <h2 className="font-semibold text-amber-300">
              Trips Needing Reports ({completedBookings.length})
            </h2>
          </div>
          <div className="space-y-3">
            {completedBookings.map((booking: any) => {
              const tripType = Array.isArray(booking.trip_type)
                ? booking.trip_type[0]
                : booking.trip_type;
              const vessel = Array.isArray(booking.vessel)
                ? booking.vessel[0]
                : booking.vessel;

              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4"
                >
                  <div>
                    <p className="font-medium text-white">
                      {tripType?.title} - {booking.guest_name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {new Date(booking.scheduled_start).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      • {vessel?.name}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/reports/new?bookingId=${booking.id}`}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                  >
                    Create Report
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports List */}
      <TripReportsList reports={reports || []} />

      {/* Empty State */}
      {(!reports || reports.length === 0) &&
        (!completedBookings || completedBookings.length === 0) && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-white">No trip reports yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Create your first report after completing a trip
            </p>
            <Link
              href="/dashboard/reports/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Create Report
            </Link>
          </div>
        )}
    </div>
  );
}
