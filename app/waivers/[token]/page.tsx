'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Anchor,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader2,
  FileSignature,
  Ship,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { WaiverStatus, PassengerWaiverCard } from '../components/WaiverStatus';
import {
  getBookingWaiverInfo,
  type BookingWaiverInfo,
} from '@/app/actions/waivers';

interface Props {
  params: Promise<{
    token: string;
  }>;
}

export default function WaiversPage({ params }: Props) {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waiverInfo, setWaiverInfo] = useState<BookingWaiverInfo | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
    });
  }, [params]);

  // Load waiver info
  useEffect(() => {
    if (!token) return;

    async function loadWaiverInfo() {
      setIsLoading(true);
      setError(null);

      const result = await getBookingWaiverInfo(token);

      if (!result.success) {
        setError(result.error || 'Failed to load waiver information');
        setIsLoading(false);
        return;
      }

      setWaiverInfo(result.data!);
      setIsLoading(false);
    }

    loadWaiverInfo();
  }, [token]);

  const handleSignWaiver = (passengerId: string) => {
    router.push(`/waivers/${token}/sign/${passengerId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
                <AlertTriangle className="h-8 w-8 text-rose-400" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Error</h1>
            <p className="text-slate-400 mb-4">{error}</p>
            <p className="text-sm text-slate-500">
              Please check your link or contact the charter captain for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!waiverInfo) {
    return null;
  }

  const { booking, passengers, requiredWaivers, totalSigned, totalRequired, allComplete } = waiverInfo;

  // If no waivers required, show message
  if (requiredWaivers.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a1628]">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                <Anchor className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {booking.captain?.business_name || booking.captain?.full_name || 'Charter Captain'}
                </h1>
                <p className="text-sm text-slate-400">Trip Waivers</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
                <FileSignature className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Waivers Required</h2>
            <p className="text-slate-400">
              This captain hasn&apos;t set up any waiver requirements. You&apos;re all set for your trip!
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
              <Anchor className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {booking.captain?.business_name || booking.captain?.full_name || 'Charter Captain'}
              </h1>
              <p className="text-sm text-slate-400">Trip Waivers</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign Trip Waivers</h2>
          <p className="text-slate-400">
            All passengers must sign the required waivers before your trip.
          </p>
        </div>

        {/* Waiver Progress */}
        <WaiverStatus
          totalSigned={totalSigned}
          totalRequired={totalRequired}
          allComplete={allComplete}
        />

        {/* Booking Details Card */}
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Trip Details</h3>
          <div className="space-y-3">
            {/* Trip Type */}
            {booking.trip_type && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Ship className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{booking.trip_type.title}</p>
                  <p className="text-xs text-slate-400">
                    {booking.trip_type.duration_hours} hour{booking.trip_type.duration_hours !== 1 ? 's' : ''}
                    {booking.vessel && ` on ${booking.vessel.name}`}
                  </p>
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {formatDate(booking.scheduled_start)}
                </p>
                <p className="text-xs text-slate-400">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatTime(booking.scheduled_start)} - {formatTime(booking.scheduled_end)}
                </p>
              </div>
            </div>

            {/* Party Size */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {booking.party_size} passenger{booking.party_size !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-400">Booked by {booking.guest_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Passengers Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Passenger Waivers</h3>
          <div className="space-y-3">
            {passengers.map((ps) => (
              <PassengerWaiverCard
                key={ps.passenger.id}
                passengerName={ps.passenger.full_name}
                isPrimaryContact={ps.passenger.is_primary_contact}
                signedCount={ps.signedWaivers.length}
                totalCount={requiredWaivers.length}
                isComplete={ps.isComplete}
                onSignClick={
                  ps.isComplete ? undefined : () => handleSignWaiver(ps.passenger.id)
                }
              />
            ))}
          </div>
        </div>

        {/* Required Waivers List */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Required Waivers</h3>
          <ul className="space-y-1">
            {requiredWaivers.map((waiver) => (
              <li key={waiver.id} className="flex items-center gap-2 text-sm text-slate-300">
                <FileSignature className="h-3.5 w-3.5 text-cyan-400" />
                {waiver.title}
              </li>
            ))}
          </ul>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-slate-500">
          <p>
            Questions about waivers?{' '}
            <Link
              href={`mailto:${booking.guest_email}`}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Contact the booking guest
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            Powered by DockSlot
          </p>
        </div>
      </footer>
    </div>
  );
}
