'use client';

import { useState, useEffect } from 'react';
import { DateSlotPicker } from '@/components/booking/DateSlotPicker';
import { ProgressIndicator } from '@/components/booking/ProgressIndicator';
import { StickyBottomCTA, CTAButton } from '@/components/booking/StickyBottomCTA';
import { PhoneInput } from '@/components/booking/PhoneInput';
import { PartySizeSelector } from '@/components/booking/PartySizeSelector';
import { CancellationPolicy, SecurePaymentBadge } from '@/components/booking/TrustSignals';
import { Calendar, Users, Mail, User, MessageSquare, ChevronRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface BookingFormProps {
  captainId: string;
  tripTypeId: string;
  tripDuration: number;
  depositAmount: number;
  totalPrice: number;
  maxCapacity: number;
  captainTimezone?: string;
  cancellationPolicy?: string;
}

// Booking steps for progress indicator
const BOOKING_STEPS = [
  { label: 'Select Date', shortLabel: 'Date' },
  { label: 'Guest Info', shortLabel: 'Info' },
  { label: 'Confirm', shortLabel: 'Confirm' },
  { label: 'Pay', shortLabel: 'Pay' },
];

export function BookingForm({
  captainId,
  tripTypeId,
  tripDuration,
  depositAmount,
  totalPrice,
  maxCapacity,
  captainTimezone,
  cancellationPolicy,
}: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<'date' | 'details'>('date');

  // Date/time selection
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');

  // Guest details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [partySize, setPartySize] = useState(2); // Smart default
  const [specialRequests, setSpecialRequests] = useState('');

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Persist form data to sessionStorage for recovery
  useEffect(() => {
    if (step === 'details') {
      sessionStorage.setItem('bookingFormData', JSON.stringify({
        captainId,
        tripTypeId,
        selectedDate: selectedDate?.toISOString(),
        selectedTime,
        selectedEndTime,
        guestName,
        guestEmail,
        guestPhone,
        partySize,
        specialRequests,
      }));
    }
  }, [captainId, tripTypeId, selectedDate, selectedTime, selectedEndTime, guestName, guestEmail, guestPhone, partySize, specialRequests, step]);

  // Restore form data on mount (for payment failure recovery)
  useEffect(() => {
    const savedData = sessionStorage.getItem('bookingFormData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.captainId === captainId && data.tripTypeId === tripTypeId) {
          if (data.guestName) setGuestName(data.guestName);
          if (data.guestEmail) setGuestEmail(data.guestEmail);
          if (data.guestPhone) setGuestPhone(data.guestPhone);
          if (data.partySize) setPartySize(data.partySize);
          if (data.specialRequests) setSpecialRequests(data.specialRequests);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [captainId, tripTypeId]);

  const handleSlotSelect = (date: Date, startTime: string, endTime: string) => {
    setSelectedDate(date);
    setSelectedTime(startTime);
    setSelectedEndTime(endTime);
    setError(null);
  };

  const handleContinueToDetails = () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time slot');
      return;
    }
    setError(null);
    setStep('details');
    // Scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email before submission
    if (!validateEmail(guestEmail)) {
      return;
    }

    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build scheduled_start and scheduled_end timestamps
      const dateStr = selectedDate!.toISOString().split('T')[0];
      const scheduledStart = `${dateStr}T${selectedTime}:00+00:00`;
      const scheduledEnd = `${dateStr}T${selectedEndTime}:00+00:00`;

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captain_id: captainId,
          trip_type_id: tripTypeId,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone || null,
          party_size: partySize,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          special_requests: specialRequests.trim() || null,
          total_price_cents: totalPrice,
          deposit_paid_cents: 0,
          balance_due_cents: totalPrice,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        // Handle specific error cases
        if (data.code === 'SLOT_UNAVAILABLE') {
          setError('This time slot is no longer available. Please select a different time.');
          setStep('date');
          setSelectedTime('');
          setSelectedEndTime('');
          return;
        }

        throw new Error(data.error || 'Failed to create booking');
      }

      const { booking, managementUrl } = await response.json();

      // Clear saved form data on success
      sessionStorage.removeItem('bookingFormData');

      // Redirect to confirmation/payment page
      router.push(`/book/${captainId}/${tripTypeId}/confirm?bookingId=${booking.id}&token=${managementUrl?.split('/')[2] || ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // Current step number for progress indicator
  const currentStepNumber = step === 'date' ? 1 : 2;

  // Format selected slot for summary
  const selectedSlotSummary = selectedDate && selectedTime ? (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">Selected:</span>
      <span className="text-slate-100 font-medium">
        {format(selectedDate, 'MMM d')} at {selectedTime}
      </span>
    </div>
  ) : null;

  return (
    <div className="relative">
      {/* Progress Indicator */}
      <ProgressIndicator
        steps={BOOKING_STEPS}
        currentStep={currentStepNumber}
        className="mb-8"
      />

      {/* Step 1: Date & Time Selection */}
      {step === 'date' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Calendar className="h-5 w-5 text-cyan-400" />
              Select Date & Time
            </h3>

            <DateSlotPicker
              captainId={captainId}
              tripTypeId={tripTypeId}
              tripDuration={tripDuration}
              onSlotSelect={handleSlotSelect}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              timezone={captainTimezone}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Sticky CTA */}
          <StickyBottomCTA showSummary={!!selectedSlotSummary} summaryContent={selectedSlotSummary}>
            <CTAButton
              onClick={handleContinueToDetails}
              disabled={!selectedDate || !selectedTime}
            >
              Continue
              <ChevronRight className="h-5 w-5" />
            </CTAButton>
          </StickyBottomCTA>
        </div>
      )}

      {/* Step 2: Guest Details Form */}
      {step === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Party Size Section */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
            <PartySizeSelector
              value={partySize}
              onChange={setPartySize}
              maxSize={maxCapacity}
            />
          </div>

          {/* Guest Information */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Users className="h-5 w-5 text-cyan-400" />
              Contact Information
            </h3>

            <div className="space-y-4">
              {/* Guest Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Name
                  </div>
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-h-[48px]"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  placeholder="john@example.com"
                  autoComplete="email"
                  className={`w-full rounded-xl border bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 min-h-[48px] ${
                    emailError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                      : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500/50'
                  }`}
                  required
                />
                {emailError ? (
                  <p className="mt-1.5 text-sm text-red-400">{emailError}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">
                    We'll send your booking confirmation and trip details here
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Phone Number
                  <span className="text-slate-500 font-normal ml-1">(optional)</span>
                </label>
                <PhoneInput
                  value={guestPhone}
                  onChange={setGuestPhone}
                  helperText="For trip updates and day-of coordination"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Special Requests
                    <span className="text-slate-500 font-normal">(optional)</span>
                  </div>
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Anything we should know? Dietary restrictions, special occasions, questions..."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
                <p className="mt-1 text-xs text-slate-500 text-right">
                  {specialRequests.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <CancellationPolicy policy={cancellationPolicy} />

          {/* Secure Payment Badge */}
          <div className="flex justify-center py-2">
            <SecurePaymentBadge />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">{error}</p>
                  <p className="text-xs text-red-400/70 mt-1">
                    Please try again or contact support if the problem persists.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sticky CTA */}
          <StickyBottomCTA
            showSummary
            summaryContent={
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Deposit:</span>
                <span className="text-cyan-400 font-semibold">
                  ${(depositAmount / 100).toFixed(2)}
                </span>
              </div>
            }
          >
            <CTAButton
              type="button"
              variant="secondary"
              onClick={() => {
                setStep('date');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-initial w-auto px-6"
            >
              Back
            </CTAButton>
            <CTAButton type="submit" loading={submitting}>
              {submitting ? 'Creating Booking...' : 'Continue to Payment'}
            </CTAButton>
          </StickyBottomCTA>
        </form>
      )}
    </div>
  );
}
