import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Calendar, MapPin, Mail } from 'lucide-react';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ session_id?: string; booking_id?: string }>;
}

async function PaymentSuccessContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { session_id, booking_id } = params;

  if (!booking_id) {
    redirect('/');
  }

  const supabase = createSupabaseServiceClient();

  // Fetch updated booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      trip_type:trip_types(id, title, duration_hours),
      vessel:vessels(id, name),
      profile:profiles(id, business_name, contact_email, contact_phone, meeting_spot_name, meeting_spot_address)
    `)
    .eq('id', booking_id)
    .single();

  if (error || !booking) {
    notFound();
  }

  // Fetch guest token for management link
  const { data: token } = await supabase
    .from('guest_tokens')
    .select('token')
    .eq('booking_id', booking_id)
    .single();

  const bookingDate = new Date(booking.scheduled_start).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startTime = new Date(booking.scheduled_start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const endTime = new Date(booking.scheduled_end).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-slate-400">
            Your booking is confirmed. We&apos;ve sent a confirmation email to{' '}
            <span className="text-cyan-400">{booking.primary_contact_email}</span>
          </p>
        </div>

        {/* Booking Summary Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {booking.trip_type.title}
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <div className="text-white font-medium">{bookingDate}</div>
                <div className="text-slate-400 text-sm">
                  {startTime} - {endTime} ({booking.trip_type.duration_hours}h)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <div className="text-white font-medium">
                  {booking.profile.meeting_spot_name}
                </div>
                <div className="text-slate-400 text-sm">
                  {booking.profile.meeting_spot_address}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Trip Total</span>
              <span className="text-white">
                ${(booking.total_price_cents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Deposit Paid</span>
              <span className="text-green-400 font-medium">
                ${(booking.deposit_paid_cents / 100).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-2 mt-2"></div>
            <div className="flex justify-between">
              <span className="text-white font-medium">Balance Due</span>
              <span className="text-cyan-400 font-semibold text-lg">
                ${(booking.balance_due_cents / 100).toFixed(2)}
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Balance due at time of trip
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">What&apos;s Next?</h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-2">
              <Mail className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>
                Check your email for a confirmation with all trip details
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>
                Complete your waiver (link in confirmation email)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>
                The captain will contact you if any weather changes occur
              </span>
            </li>
          </ul>
        </div>

        {/* Management Link */}
        {token && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Manage Your Booking
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Save this link to view or modify your booking anytime:
            </p>
            <Link
              href={`/manage/${token.token}`}
              className="block w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg text-center transition-colors"
            >
              View Booking Details
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <Link
            href={`/c/${booking.captain_id}`}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to {booking.profile.business_name}
          </Link>
        </div>

        {/* DockSlot Branding */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          Powered by <span className="text-cyan-400 font-semibold">DockSlot</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>}>
      <PaymentSuccessContent {...props} />
    </Suspense>
  );
}
