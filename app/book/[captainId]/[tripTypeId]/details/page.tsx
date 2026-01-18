'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Anchor, AlertTriangle, ArrowLeft, Clock, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { GuestForm, type GuestFormData } from '../../../components/GuestForm';
import {
  getPublicCaptainProfile,
  getPublicTripType,
  type PublicCaptainProfile,
  type PublicTripType,
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

export default function GuestDetailsPage({ params }: Props) {
  const router = useRouter();
  const [captainId, setCaptainId] = useState<string>('');
  const [tripTypeId, setTripTypeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<PublicCaptainProfile | null>(null);
  const [tripType, setTripType] = useState<PublicTripType | null>(null);
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      if (!storedSelection) {
        setError('No date and time selected. Please go back and select a time slot.');
        setIsLoading(false);
        return;
      }

      try {
        const parsedSelection: BookingSelection = JSON.parse(storedSelection);

        // Verify the selection matches the current URL
        if (
          parsedSelection.captainId !== captainId ||
          parsedSelection.tripTypeId !== tripTypeId
        ) {
          setError('Selection mismatch. Please go back and select a time slot.');
          setIsLoading(false);
          return;
        }

        setSelection(parsedSelection);
      } catch {
        setError('Invalid selection data. Please go back and select a time slot.');
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

  const handleSubmit = (formData: GuestFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Store form data and navigate to confirmation
    sessionStorage.setItem('guestFormData', JSON.stringify(formData));
    router.push(`/book/${captainId}/${tripTypeId}/confirm`);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
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
              href={`/book/${captainId}/${tripTypeId}`}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to date selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/book/${captainId}/${tripTypeId}`}
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
                  <p className="text-sm text-slate-400">Your Details</p>
                </div>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white text-sm font-medium">
                3
              </span>
              <span className="text-sm text-slate-400">of 4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Booking Summary */}
        {tripType && selection && (
          <div className="mb-8 rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">{tripType.title}</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span>{format(parseISO(selection.date), 'EEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>{formatTime(selection.time)} ({formatDuration(tripType.duration_hours)})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>{formatPrice(tripType.price_total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Enter Your Details</h2>
          <p className="text-slate-400">
            Please provide your contact information and party details.
          </p>
        </div>

        {/* Mobile Step Indicator */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-medium">
              3
            </span>
            <span>Step 3 of 4: Your Details</span>
          </div>
        </div>

        {/* Guest Form */}
        <GuestForm
          meetingSpotName={profile?.meeting_spot_name || null}
          meetingSpotAddress={profile?.meeting_spot_address || null}
          meetingSpotInstructions={profile?.meeting_spot_instructions || null}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
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
