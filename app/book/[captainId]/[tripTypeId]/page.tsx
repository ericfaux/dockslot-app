'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Anchor, AlertTriangle, ArrowLeft, Clock, DollarSign, Loader2 } from 'lucide-react';
import { DatePicker, type DateAvailability, type TimeSlot } from '../../components/DatePicker';
import {
  getPublicCaptainProfile,
  getPublicTripType,
  getAvailableDates,
  getAvailability,
  type PublicCaptainProfile,
  type PublicTripType,
} from '@/app/actions/public-booking';

interface Props {
  params: Promise<{
    captainId: string;
    tripTypeId: string;
  }>;
}

export default function SelectDateTimePage({ params }: Props) {
  const router = useRouter();
  const [captainId, setCaptainId] = useState<string>('');
  const [tripTypeId, setTripTypeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<PublicCaptainProfile | null>(null);
  const [tripType, setTripType] = useState<PublicTripType | null>(null);
  const [availableDates, setAvailableDates] = useState<DateAvailability[]>([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      setCaptainId(p.captainId);
      setTripTypeId(p.tripTypeId);
    });
  }, [params]);

  // Fetch initial data
  useEffect(() => {
    if (!captainId || !tripTypeId) return;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      const [profileResult, tripTypeResult, datesResult] = await Promise.all([
        getPublicCaptainProfile(captainId),
        getPublicTripType(captainId, tripTypeId),
        getAvailableDates(captainId),
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
      setAvailableDates(datesResult.success ? datesResult.data! : []);
      setIsLoading(false);
    }

    loadData();
  }, [captainId, tripTypeId]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (!selectedDate || !captainId || !tripTypeId) {
      setTimeSlots([]);
      return;
    }

    async function loadTimeSlots() {
      setIsLoadingSlots(true);
      setSelectedTime(null);

      const result = await getAvailability(captainId, tripTypeId, selectedDate!);

      if (result.success && result.data) {
        setTimeSlots(result.data.time_slots);
      } else {
        setTimeSlots([]);
      }

      setIsLoadingSlots(false);
    }

    loadTimeSlots();
  }, [selectedDate, captainId, tripTypeId]);

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;

    // Store selection in session storage for the next step
    sessionStorage.setItem(
      'bookingSelection',
      JSON.stringify({
        captainId,
        tripTypeId,
        date: selectedDate,
        time: selectedTime,
      })
    );

    router.push(`/book/${captainId}/${tripTypeId}/details`);
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
              Back to trips
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
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/book/${captainId}`}
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
                  <p className="text-sm text-slate-400">Select Date & Time</p>
                </div>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white text-sm font-medium">
                2
              </span>
              <span className="text-sm text-slate-400">of 4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Trip Summary */}
        {tripType && (
          <div className="mb-8 rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">{tripType.title}</h2>
                {tripType.description && (
                  <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                    {tripType.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>{formatDuration(tripType.duration_hours)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span>{formatPrice(tripType.price_total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Date & Time</h2>
          <p className="text-slate-400">
            Select an available date and time for your charter.
          </p>
        </div>

        {/* Mobile Step Indicator */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-medium">
              2
            </span>
            <span>Step 2 of 4: Select Date & Time</span>
          </div>
        </div>

        {/* Date Picker */}
        <DatePicker
          availableDates={availableDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          timeSlots={timeSlots}
          selectedTime={selectedTime}
          onSelectTime={setSelectedTime}
          isLoadingSlots={isLoadingSlots}
          maxAdvanceDays={profile?.advance_booking_days || 60}
        />

        {/* Continue Button */}
        <div className="mt-8">
          <button
            onClick={handleContinue}
            disabled={!selectedDate || !selectedTime}
            className={`
              w-full py-4 rounded-lg font-semibold text-lg transition-all
              ${!selectedDate || !selectedTime
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
              }
            `}
          >
            Continue
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            Powered by DockSlot
          </p>
        </div>
      </footer>
    </div>
  );
}
