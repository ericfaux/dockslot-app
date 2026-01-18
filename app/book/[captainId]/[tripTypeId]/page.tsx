'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Anchor, AlertTriangle, ArrowLeft, Clock, DollarSign, Loader2 } from 'lucide-react';
import { DatePicker, type DateAvailability, type TimeSlot } from '../../components/DatePicker';
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
  const [selectedDateInfo, setSelectedDateInfo] = useState<{
    is_blackout?: boolean;
    blackout_reason?: string | null;
    has_active_window?: boolean;
  } | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      setCaptainId(p.captainId);
      setTripTypeId(p.tripTypeId);
    });
  }, [params]);

  // Fetch date range availability from API
  const fetchDateRangeAvailability = useCallback(async (
    cId: string,
    tId: string
  ): Promise<DateAvailability[]> => {
    try {
      const response = await fetch(`/api/availability/${cId}/${tId}`);
      const result = await response.json();

      if (result.success && result.data?.dates) {
        return result.data.dates.map((d: {
          date: string;
          has_availability: boolean;
          is_blackout?: boolean;
          blackout_reason?: string | null;
          has_active_window?: boolean;
        }) => ({
          date: d.date,
          has_availability: d.has_availability,
          is_blackout: d.is_blackout,
          blackout_reason: d.blackout_reason,
          has_active_window: d.has_active_window,
        }));
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (!captainId || !tripTypeId) return;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      const [profileResult, tripTypeResult, datesResult] = await Promise.all([
        getPublicCaptainProfile(captainId),
        getPublicTripType(captainId, tripTypeId),
        fetchDateRangeAvailability(captainId, tripTypeId),
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
      setAvailableDates(datesResult);
      setIsLoading(false);
    }

    loadData();
  }, [captainId, tripTypeId, fetchDateRangeAvailability]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (!selectedDate || !captainId || !tripTypeId) {
      setTimeSlots([]);
      setSelectedDateInfo(null);
      return;
    }

    async function loadTimeSlots() {
      setIsLoadingSlots(true);
      setSelectedTime(null);

      try {
        const response = await fetch(
          `/api/availability/${captainId}/${tripTypeId}?date=${selectedDate}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          // Convert ISO datetime slots to HH:MM format for the TimeSlot interface
          const slots: TimeSlot[] = result.data.slots.map((slot: {
            start_time: string;
            end_time: string;
            display_start: string;
            display_end: string;
          }) => {
            // Extract HH:MM from the display time or ISO string
            const startMatch = slot.display_start?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            let startTimeHHMM = '00:00';

            if (startMatch) {
              let hours = parseInt(startMatch[1], 10);
              const minutes = startMatch[2];
              const period = startMatch[3].toUpperCase();

              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;

              startTimeHHMM = `${String(hours).padStart(2, '0')}:${minutes}`;
            }

            const endMatch = slot.display_end?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            let endTimeHHMM = '00:00';

            if (endMatch) {
              let hours = parseInt(endMatch[1], 10);
              const minutes = endMatch[2];
              const period = endMatch[3].toUpperCase();

              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;

              endTimeHHMM = `${String(hours).padStart(2, '0')}:${minutes}`;
            }

            return {
              start_time: startTimeHHMM,
              end_time: endTimeHHMM,
              available: true, // All returned slots are available
              display_start: slot.display_start,
              display_end: slot.display_end,
            };
          });

          setTimeSlots(slots);

          // Set date info for showing context in the UI
          if (result.data.date_info) {
            setSelectedDateInfo({
              is_blackout: result.data.date_info.is_blackout,
              blackout_reason: result.data.date_info.blackout_reason,
              has_active_window: result.data.date_info.has_active_window,
            });
          }
        } else {
          setTimeSlots([]);
          setSelectedDateInfo(null);
        }
      } catch {
        setTimeSlots([]);
        setSelectedDateInfo(null);
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
          selectedDateInfo={selectedDateInfo}
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
