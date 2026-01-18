'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Anchor,
  AlertTriangle,
  Calendar,
  Clock,
  CloudRain,
  Users,
  Loader2,
  CheckCircle2,
  Ship,
  MessageSquare,
  Send,
  ArrowRight,
  CalendarCheck,
} from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import {
  getBookingRescheduleInfo,
  guestSelectRescheduleOffer,
  guestRequestDifferentDates,
  type RescheduleInfoResult,
} from '@/app/actions/bookings';
import { RescheduleOffer } from '@/lib/db/types';

interface Props {
  params: Promise<{
    token: string;
  }>;
}

function formatTime12(isoString: string): string {
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return '';
  }
}

function formatDate(isoString: string): string {
  try {
    return format(parseISO(isoString), 'EEEE, MMMM d, yyyy');
  } catch {
    return '';
  }
}

function formatShortDate(isoString: string): string {
  try {
    return format(parseISO(isoString), 'EEE, MMM d');
  } catch {
    return '';
  }
}

type OfferStatus = 'available' | 'expired' | 'selected';

function getOfferStatus(offer: RescheduleOffer): OfferStatus {
  if (offer.is_selected) return 'selected';
  if (offer.expires_at && isBefore(new Date(offer.expires_at), new Date())) {
    return 'expired';
  }
  return 'available';
}

export default function ReschedulePage({ params }: Props) {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleInfo, setRescheduleInfo] = useState<RescheduleInfoResult | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
    });
  }, [params]);

  // Load reschedule info
  useEffect(() => {
    if (!token) return;

    async function loadRescheduleInfo() {
      setIsLoading(true);
      setError(null);

      const result = await getBookingRescheduleInfo(token);

      if (!result.success) {
        setError(result.error || 'Failed to load reschedule information');
        setIsLoading(false);
        return;
      }

      setRescheduleInfo(result.data!);
      setIsLoading(false);
    }

    loadRescheduleInfo();
  }, [token]);

  const handleSelectOffer = async () => {
    if (!selectedOfferId || !token) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await guestSelectRescheduleOffer(token, selectedOfferId);

    if (!result.success) {
      setSubmitError(result.error || 'Failed to confirm new date');
      setIsSubmitting(false);
      return;
    }

    setIsConfirmed(true);
    setIsSubmitting(false);
  };

  const handleRequestDifferent = async () => {
    if (!requestMessage.trim() || !token) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await guestRequestDifferentDates(token, requestMessage);

    if (!result.success) {
      setSubmitError(result.error || 'Failed to send request');
      setIsSubmitting(false);
      return;
    }

    setIsRequestSent(true);
    setIsSubmitting(false);
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
            <h1 className="text-xl font-semibold text-white mb-2">Unable to Load</h1>
            <p className="text-slate-400 mb-4">{error}</p>
            <p className="text-sm text-slate-500">
              Please check your link or contact the charter captain for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!rescheduleInfo) {
    return null;
  }

  const { booking, offers, captain } = rescheduleInfo;
  const availableOffers = offers.filter(o => getOfferStatus(o) === 'available');
  const hasExpiredOffers = offers.some(o => getOfferStatus(o) === 'expired');
  const selectedOffer = selectedOfferId ? offers.find(o => o.id === selectedOfferId) : null;
  const captainName = captain?.business_name || captain?.full_name || 'Your Charter Captain';

  // Success state - confirmed new date
  if (isConfirmed && selectedOffer) {
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
                <h1 className="text-lg font-semibold text-white">{captainName}</h1>
                <p className="text-sm text-slate-400">Trip Rescheduled</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <CalendarCheck className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You&apos;re All Set!</h2>
            <p className="text-slate-300 mb-6">
              Your trip has been rescheduled to the new date.
            </p>

            <div className="inline-block rounded-lg border border-emerald-500/30 bg-slate-900 p-4 text-left">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <span className="text-lg font-semibold text-white">
                  {formatDate(selectedOffer.proposed_start)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Clock className="h-5 w-5 text-slate-400" />
                <span>
                  {formatTime12(selectedOffer.proposed_start)} - {formatTime12(selectedOffer.proposed_end)}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 mt-6">
              The captain has been notified. See you on the water!
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

  // Request sent state
  if (isRequestSent) {
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
                <h1 className="text-lg font-semibold text-white">{captainName}</h1>
                <p className="text-sm text-slate-400">Request Sent</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
                <MessageSquare className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Request Sent</h2>
            <p className="text-slate-300 mb-4">
              The captain has been notified of your request for different dates.
            </p>
            <p className="text-sm text-slate-400">
              They will contact you soon with new options.
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
              <h1 className="text-lg font-semibold text-white">{captainName}</h1>
              <p className="text-sm text-slate-400">Trip Rescheduling</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Weather Hold Notice */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <CloudRain className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-amber-300 mb-1">
                Weather Hold Notice
              </h2>
              <p className="text-slate-300">
                Due to weather conditions, your trip on{' '}
                <span className="font-medium text-white">
                  {formatDate(booking.scheduled_start)}
                </span>{' '}
                has been placed on hold.
              </p>
              {booking.weather_hold_reason && (
                <p className="text-amber-400/80 italic mt-2 text-sm">
                  &ldquo;{booking.weather_hold_reason}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Original Booking Details */}
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Original Booking</h3>
          <div className="space-y-3">
            {/* Trip Type */}
            {booking.trip_type && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Ship className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{booking.trip_type.title}</p>
                  {booking.vessel && (
                    <p className="text-xs text-slate-400">on {booking.vessel.name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 line-through">
                  {formatShortDate(booking.scheduled_start)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTime12(booking.scheduled_start)} - {formatTime12(booking.scheduled_end)}
                </p>
              </div>
            </div>

            {/* Party Size */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300">
                  {booking.party_size} passenger{booking.party_size !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-400">{booking.guest_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Reschedule Options */}
        {availableOffers.length > 0 && !showRequestForm && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Select a New Date</h2>
              <p className="text-slate-400 text-sm">
                Choose one of the following dates offered by your captain.
              </p>
            </div>

            <div className="space-y-3">
              {availableOffers.map((offer) => {
                const isSelected = selectedOfferId === offer.id;
                return (
                  <button
                    key={offer.id}
                    onClick={() => setSelectedOfferId(isSelected ? null : offer.id)}
                    className={`w-full text-left rounded-lg border p-4 transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-cyan-500/20' : 'bg-slate-800'
                        }`}>
                          <Calendar className={`h-5 w-5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className={`font-semibold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                            {formatDate(offer.proposed_start)}
                          </p>
                          <p className="text-sm text-slate-400">
                            {formatTime12(offer.proposed_start)} - {formatTime12(offer.proposed_end)}
                          </p>
                        </div>
                      </div>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500'
                          : 'border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirm Button */}
            {selectedOfferId && (
              <button
                onClick={handleSelectOffer}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    Confirm New Date
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            )}

            {/* Error */}
            {submitError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3">
                <p className="text-sm text-rose-400">{submitError}</p>
              </div>
            )}

            {/* Request Different Dates Link */}
            <div className="text-center pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowRequestForm(true)}
                className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
              >
                None of these dates work?{' '}
                <span className="underline">Request different dates</span>
              </button>
            </div>
          </div>
        )}

        {/* No Available Offers */}
        {availableOffers.length === 0 && !showRequestForm && (
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {hasExpiredOffers ? 'Offers Have Expired' : 'No Dates Available'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {hasExpiredOffers
                ? 'The offered reschedule dates have expired.'
                : 'No reschedule dates have been offered yet.'}
            </p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              Request new dates from the captain
            </button>
          </div>
        )}

        {/* Request Different Dates Form */}
        {showRequestForm && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Request Different Dates</h2>
              <p className="text-slate-400 text-sm">
                Let the captain know what dates work better for you.
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Message
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="e.g., I'm available on weekends in the next two weeks, preferably mornings..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRequestForm(false);
                  setRequestMessage('');
                }}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                Back to Options
              </button>
              <button
                onClick={handleRequestDifferent}
                disabled={isSubmitting || !requestMessage.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>

            {/* Error */}
            {submitError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3">
                <p className="text-sm text-rose-400">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-center text-sm text-slate-500 pt-4">
          <p>
            Questions? Contact{' '}
            <span className="text-slate-400">{captainName}</span> directly.
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
