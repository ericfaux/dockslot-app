'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Anchor,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { BookingSummary } from '../../../components/BookingSummary';
import { type GuestFormData, type PassengerInfo } from '../../../components/GuestForm';
import {
  getPublicCaptainProfile,
  getPublicTripType,
  createPublicBooking,
  type PublicCaptainProfile,
  type PublicTripType,
  type PublicBookingResult,
} from '@/app/actions/public-booking';

interface Props {
  params: Promise<{
    captainId: string;
    tripTypeId: string;
  }>;
}

interface BookingSelection {
  captainId: string;
  tripTypeId: string;
  date: string;
  time: string;
}

export default function ConfirmBookingPage({ params }: Props) {
  const router = useRouter();
  const [captainId, setCaptainId] = useState<string>('');
  const [tripTypeId, setTripTypeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<PublicCaptainProfile | null>(null);
  const [tripType, setTripType] = useState<PublicTripType | null>(null);
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const [guestData, setGuestData] = useState<GuestFormData | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<PublicBookingResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      setCaptainId(p.captainId);
      setTripTypeId(p.tripTypeId);
    });
  }, [params]);

  // Load data and verify selection
  useEffect(() => {
    if (!captainId || !tripTypeId) return;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      // Check for booking selection in session storage
      const storedSelection = sessionStorage.getItem('bookingSelection');
      const storedGuestData = sessionStorage.getItem('guestFormData');

      if (!storedSelection) {
        setError('No date and time selected. Please start over.');
        setIsLoading(false);
        return;
      }

      if (!storedGuestData) {
        setError('No guest information found. Please go back and enter your details.');
        setIsLoading(false);
        return;
      }

      try {
        const parsedSelection: BookingSelection = JSON.parse(storedSelection);
        const parsedGuestData: GuestFormData = JSON.parse(storedGuestData);

        // Verify the selection matches the current URL
        if (
          parsedSelection.captainId !== captainId ||
          parsedSelection.tripTypeId !== tripTypeId
        ) {
          setError('Selection mismatch. Please start over.');
          setIsLoading(false);
          return;
        }

        setSelection(parsedSelection);
        setGuestData(parsedGuestData);
      } catch {
        setError('Invalid selection data. Please start over.');
        setIsLoading(false);
        return;
      }

      // Fetch profile and trip type
      const [profileResult, tripTypeResult] = await Promise.all([
        getPublicCaptainProfile(captainId),
        getPublicTripType(captainId, tripTypeId),
      ]);

      if (!profileResult.success) {
        setError(profileResult.error || 'Failed to load captain profile');
        setIsLoading(false);
        return;
      }

      if (!tripTypeResult.success) {
        setError(tripTypeResult.error || 'Failed to load trip type');
        setIsLoading(false);
        return;
      }

      setProfile(profileResult.data!);
      setTripType(tripTypeResult.data!);
      setIsLoading(false);
    }

    loadData();
  }, [captainId, tripTypeId]);

  const handleConfirm = async () => {
    if (!selection || !guestData || !tripType) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await createPublicBooking({
      captain_id: captainId,
      trip_type_id: tripTypeId,
      scheduled_date: selection.date,
      scheduled_time: selection.time,
      guest_name: guestData.guest_name,
      guest_email: guestData.guest_email,
      guest_phone: guestData.guest_phone || undefined,
      party_size: guestData.party_size,
      passengers: guestData.passengers.filter((p: PassengerInfo) => p.full_name),
      special_requests: guestData.special_requests || undefined,
    });

    if (!result.success) {
      setSubmitError(result.error || 'Failed to create booking');
      setIsSubmitting(false);
      return;
    }

    // Clear session storage
    sessionStorage.removeItem('bookingSelection');
    sessionStorage.removeItem('guestFormData');

    setBookingResult(result.data!);
    setIsSubmitting(false);
  };

  const handleBack = () => {
    router.push(`/book/${captainId}/${tripTypeId}/details`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
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
            <Link
              href={`/book/${captainId}`}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Start over
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state - booking created
  if (bookingResult) {
    const guestLookupUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/lookup?token=${bookingResult.guest_token}`;

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
                  {profile?.business_name || profile?.full_name || 'Charter Captain'}
                </h1>
                <p className="text-sm text-slate-400">Booking Confirmed</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Booking Request Submitted!</h2>
            <p className="text-slate-400">
              Your booking request has been sent to the captain. You&apos;ll receive a confirmation
              email once the deposit is paid.
            </p>
          </div>

          {/* Booking Details Card */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 space-y-6">
            {/* Confirmation Code */}
            <div className="text-center pb-6 border-b border-slate-800">
              <p className="text-sm text-slate-400 mb-2">Your Confirmation Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold text-cyan-400 tracking-wider">
                  {bookingResult.confirmation_code}
                </span>
                <button
                  onClick={() => copyToClipboard(bookingResult.confirmation_code)}
                  className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Copy confirmation code"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              {copied && (
                <p className="text-sm text-emerald-400 mt-2">Copied to clipboard!</p>
              )}
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Next Steps</h3>
              <ol className="space-y-3 text-sm text-slate-400">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                    1
                  </span>
                  <span>
                    Pay your deposit of{' '}
                    <strong className="text-amber-400">
                      {formatPrice(bookingResult.deposit_amount_cents)}
                    </strong>{' '}
                    to confirm your booking.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                    2
                  </span>
                  <span>
                    You&apos;ll receive a confirmation email with trip details and meeting
                    instructions.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                    3
                  </span>
                  <span>
                    Pay the remaining balance of{' '}
                    <strong className="text-white">
                      {formatPrice(
                        bookingResult.total_price_cents - bookingResult.deposit_amount_cents
                      )}
                    </strong>{' '}
                    on the day of your trip.
                  </span>
                </li>
              </ol>
            </div>

            {/* Guest Lookup Link */}
            <div className="pt-6 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-3">
                Save this link to view or manage your booking:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={guestLookupUrl}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 truncate"
                />
                <button
                  onClick={() => copyToClipboard(guestLookupUrl)}
                  className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-sm transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Back to Captain Page */}
          <div className="mt-8 text-center">
            <Link
              href={`/book/${captainId}`}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
              Book another trip
              <ExternalLink className="h-4 w-4" />
            </Link>
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

  // Review state - show booking summary
  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/book/${captainId}/${tripTypeId}/details`}
                className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                  <Anchor className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">
                    {profile?.business_name || profile?.full_name || 'Charter Captain'}
                  </h1>
                  <p className="text-sm text-slate-400">Review & Confirm</p>
                </div>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white text-sm font-medium">
                4
              </span>
              <span className="text-sm text-slate-400">of 4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Review Your Booking</h2>
          <p className="text-slate-400">
            Please review your booking details before submitting.
          </p>
        </div>

        {/* Mobile Step Indicator */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-medium">
              4
            </span>
            <span>Step 4 of 4: Review & Confirm</span>
          </div>
        </div>

        {/* Booking Summary */}
        {tripType && selection && guestData && (
          <BookingSummary
            tripTitle={tripType.title}
            tripDescription={tripType.description}
            durationHours={tripType.duration_hours}
            priceTotal={tripType.price_total}
            depositAmount={tripType.deposit_amount}
            scheduledDate={selection.date}
            scheduledTime={selection.time}
            guestData={guestData}
            meetingSpotName={profile?.meeting_spot_name}
            meetingSpotAddress={profile?.meeting_spot_address}
            cancellationPolicy={profile?.cancellation_policy}
            onConfirm={handleConfirm}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )}
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
