// app/manage/[token]/page.tsx
// Guest booking management page - View and manage booking via secure token
// Allows viewing details, cancellation, rescheduling (Phase 4)

import { createSupabaseServiceClient } from "@/utils/supabase/service";
import { notFound } from "next/navigation";
import { format, parseISO, isBefore } from "date-fns";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Mail, 
  Phone, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Anchor,
} from "lucide-react";
import Link from "next/link";

interface ManageBookingProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ManageBookingPage({ params }: ManageBookingProps) {
  const { token } = await params;
  const supabase = createSupabaseServiceClient();
  
  // Store token for reschedule link
  const rescheduleToken = token;

  // Find booking by guest token
  const { data: guestToken } = await supabase
    .from('guest_tokens')
    .select('booking_id, expires_at')
    .eq('token', token)
    .single();

  if (!guestToken) {
    notFound();
  }

  // Check if token expired
  const isExpired = isBefore(parseISO(guestToken.expires_at), new Date());
  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-slate-100">
            Link Expired
          </h1>
          <p className="text-slate-400">
            This booking management link has expired. Please contact the captain
            directly for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Fetch booking with related data
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      trip_type:trip_types(*),
      vessel:vessels(*)
    `)
    .eq('id', guestToken.booking_id)
    .single();

  if (!booking) {
    notFound();
  }

  // Fetch captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', booking.captain_id)
    .single();

  // Fetch passengers
  const { data: passengers } = await supabase
    .from('passengers')
    .select('*')
    .eq('booking_id', booking.id)
    .order('is_primary_contact', { ascending: false });

  // Determine booking status details
  const isPastTrip = isBefore(parseISO(booking.scheduled_end), new Date());
  const isActive = ['confirmed', 'pending_deposit', 'rescheduled'].includes(booking.status);
  const isCancelled = booking.status === 'cancelled';
  const isWeatherHold = booking.status === 'weather_hold';

  // Status badge helper
  const getStatusBadge = () => {
    switch (booking.status) {
      case 'confirmed':
        return { icon: CheckCircle, text: 'Confirmed', color: 'text-green-400 bg-green-400/20' };
      case 'pending_deposit':
        return { icon: AlertTriangle, text: 'Pending Payment', color: 'text-amber-400 bg-amber-400/20' };
      case 'weather_hold':
        return { icon: AlertTriangle, text: 'Weather Hold', color: 'text-amber-400 bg-amber-400/20' };
      case 'cancelled':
        return { icon: XCircle, text: 'Cancelled', color: 'text-red-400 bg-red-400/20' };
      case 'completed':
        return { icon: CheckCircle, text: 'Completed', color: 'text-slate-400 bg-slate-400/20' };
      default:
        return { icon: Info, text: booking.status, color: 'text-slate-400 bg-slate-400/20' };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-4 flex items-center gap-2">
            <Anchor className="h-5 w-5 text-cyan-400" />
            <span className="font-mono text-sm uppercase tracking-widest text-slate-500">
              Guest Booking Portal
            </span>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-slate-100">
                Your Booking
              </h1>
              <p className="text-sm text-slate-400">
                {profile?.business_name || 'Charter Booking'} • 
                Booking #{booking.id.slice(0, 8)}
              </p>
            </div>
            
            {/* Status Badge */}
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${statusBadge.color}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">{statusBadge.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Weather Hold Alert */}
        {isWeatherHold && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-6">
            <div className="mb-3 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Trip on Weather Hold
              </h2>
            </div>
            <p className="mb-4 text-sm text-slate-300">
              {booking.weather_hold_reason || 'Due to weather conditions, your trip has been placed on hold. The captain has provided alternative dates for you to choose from.'}
            </p>
            <Link
              href={`/reschedule/${rescheduleToken}`}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-900 transition-all hover:bg-cyan-400"
            >
              <Calendar className="h-5 w-5" />
              Choose a New Date
            </Link>
          </div>
        )}

        {/* Cancelled Alert */}
        {isCancelled && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
            <XCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
            <h2 className="mb-2 text-lg font-semibold text-slate-100">
              Booking Cancelled
            </h2>
            <p className="text-sm text-slate-300">
              This booking was cancelled. Please contact the captain if you have questions.
            </p>
          </div>
        )}

        {/* Trip Details Card */}
        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Trip Details
          </h2>

          <div className="space-y-4">
            {/* Trip Type */}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <div>
                <div className="font-medium text-slate-100">
                  {booking.trip_type?.title || 'Charter Trip'}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {format(parseISO(booking.scheduled_start), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <div>
                <div className="font-medium text-slate-100">
                  {format(parseISO(booking.scheduled_start), 'h:mm a')} - {format(parseISO(booking.scheduled_end), 'h:mm a')}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {booking.trip_type?.duration_hours} hours
                </div>
              </div>
            </div>

            {/* Party Size */}
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <div>
                <div className="font-medium text-slate-100">
                  {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
                </div>
                {booking.vessel && (
                  <div className="mt-1 text-sm text-slate-400">
                    Aboard {booking.vessel.name}
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Spot */}
            {profile?.meeting_spot_name && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
                <div>
                  <div className="font-medium text-slate-100">
                    {profile.meeting_spot_name}
                  </div>
                  {profile.meeting_spot_address && (
                    <div className="mt-1 text-sm text-slate-400">
                      {profile.meeting_spot_address}
                    </div>
                  )}
                  {profile.meeting_spot_instructions && (
                    <div className="mt-2 text-sm text-slate-300">
                      {profile.meeting_spot_instructions}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Contact Information
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
              <div>
                <div className="text-sm text-slate-400">Primary Contact</div>
                <div className="font-medium text-slate-100">{booking.guest_name}</div>
                <div className="text-sm text-slate-300">{booking.guest_email}</div>
              </div>
            </div>

            {booking.guest_phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-400">Phone</div>
                  <div className="font-medium text-slate-100">{booking.guest_phone}</div>
                </div>
              </div>
            )}
          </div>

          {/* Passengers List (if any) */}
          {passengers && passengers.length > 0 && (
            <div className="mt-6 border-t border-slate-700 pt-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Passenger Manifest
              </h3>
              <div className="space-y-2">
                {passengers.map((passenger) => (
                  <div
                    key={passenger.id}
                    className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-2"
                  >
                    <div>
                      <div className="font-medium text-slate-100">
                        {passenger.full_name}
                        {passenger.is_primary_contact && (
                          <span className="ml-2 text-xs text-cyan-400">(Primary)</span>
                        )}
                      </div>
                      {passenger.email && (
                        <div className="text-xs text-slate-400">{passenger.email}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {booking.special_requests && (
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Special Requests
              </div>
              <div className="text-sm text-slate-300">{booking.special_requests}</div>
            </div>
          )}
        </div>

        {/* Payment Information Card */}
        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Payment Information
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>Trip Total</span>
              <span className="font-medium">${(booking.total_price_cents / 100).toFixed(2)}</span>
            </div>

            {booking.deposit_paid_cents > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Deposit Paid</span>
                <span className="font-medium">
                  ${(booking.deposit_paid_cents / 100).toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-slate-100">
                  {booking.balance_due_cents > 0 ? 'Balance Due' : 'Fully Paid'}
                </span>
                <span className={booking.balance_due_cents > 0 ? 'text-cyan-400' : 'text-green-400'}>
                  ${(booking.balance_due_cents / 100).toFixed(2)}
                </span>
              </div>
              {booking.balance_due_cents > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Balance due at time of trip
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Captain Contact Card */}
        {(profile?.email || profile?.phone) && (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Need Help?
            </h2>
            <p className="mb-4 text-sm text-slate-400">
              Contact {profile.business_name || 'the captain'} directly:
            </p>
            <div className="space-y-2">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                >
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                >
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer Branding */}
        <div className="border-t border-slate-800 pt-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Anchor className="h-4 w-4 text-slate-600" />
            <span className="font-mono text-xs uppercase tracking-widest text-slate-600">
              Powered by DockSlot
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Captain-first booking for 6-pack charters
          </p>
        </div>
      </div>
    </div>
  );
}
