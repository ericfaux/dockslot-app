'use client';

import { useState, useEffect } from 'react';
import { DateSlotPicker } from '@/components/booking/DateSlotPicker';
import { ProgressIndicator } from '@/components/booking/ProgressIndicator';
import { StickyBottomCTA, CTAButton } from '@/components/booking/StickyBottomCTA';
import { PhoneInput } from '@/components/booking/PhoneInput';
import { PartySizeSelector } from '@/components/booking/PartySizeSelector';
import { CancellationPolicy, SecurePaymentBadge } from '@/components/booking/TrustSignals';
import { WeatherForecast } from '@/components/booking/WeatherForecast';
import { Calendar, Users, Mail, User, MessageSquare, ChevronRight, AlertCircle, FileWarning, Tag, Loader2, CheckCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { formatDollars, formatCents } from '@/lib/utils/format';

interface BookingFormProps {
  captainId: string;
  tripTypeId: string;
  tripDuration: number;
  depositAmount: number;
  totalPrice: number;
  maxCapacity: number;
  captainTimezone?: string;
  cancellationPolicy?: string;
  meetingSpotLatitude?: number;
  meetingSpotLongitude?: number;
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
  meetingSpotLatitude,
  meetingSpotLongitude,
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
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscountCents, setPromoDiscountCents] = useState(0);
  const [promoDiscountType, setPromoDiscountType] = useState<string | null>(null);
  const [promoDiscountValue, setPromoDiscountValue] = useState<number | null>(null);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);

  // Persist form data to sessionStorage + localStorage for offline recovery
  useEffect(() => {
    if (step === 'details') {
      const data = JSON.stringify({
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
      });
      sessionStorage.setItem('bookingFormData', data);
      try { localStorage.setItem('bookingFormData', data); } catch {}
    }
  }, [captainId, tripTypeId, selectedDate, selectedTime, selectedEndTime, guestName, guestEmail, guestPhone, partySize, specialRequests, step]);

  // Restore form data on mount (for payment failure recovery or connection drop)
  useEffect(() => {
    const savedData = sessionStorage.getItem('bookingFormData') || localStorage.getItem('bookingFormData');
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

  const validatePromoCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoValid(null);
      setPromoError(null);
      setPromoDiscountCents(0);
      setPromoCodeId(null);
      return;
    }

    setPromoValidating(true);
    setPromoError(null);

    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captain_id: captainId,
          code,
          trip_type_id: tripTypeId,
          total_price_cents: totalPrice,
        }),
      });

      const data = await res.json();

      if (data.is_valid) {
        setPromoValid(true);
        setPromoDiscountCents(data.discount_cents);
        setPromoDiscountType(data.discount_type);
        setPromoDiscountValue(data.discount_value);
        setPromoCodeId(data.promo_code_id);
        setPromoError(null);
      } else {
        setPromoValid(false);
        setPromoDiscountCents(0);
        setPromoCodeId(null);
        setPromoError(data.error_message || 'Invalid promo code');
      }
    } catch {
      setPromoValid(false);
      setPromoDiscountCents(0);
      setPromoCodeId(null);
      setPromoError('Unable to validate promo code');
    } finally {
      setPromoValidating(false);
    }
  };

  const clearPromoCode = () => {
    setPromoCode('');
    setPromoValid(null);
    setPromoError(null);
    setPromoDiscountCents(0);
    setPromoDiscountType(null);
    setPromoDiscountValue(null);
    setPromoCodeId(null);
  };

  // Effective prices after promo discount
  const effectiveTotalPrice = Math.max(0, totalPrice - promoDiscountCents);
  const depositRatio = totalPrice > 0 ? depositAmount / totalPrice : 0;
  const effectiveDeposit = promoDiscountCents > 0
    ? Math.round(effectiveTotalPrice * depositRatio)
    : depositAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
          promo_code: promoValid ? promoCode.trim().toUpperCase() : undefined,
          promo_code_id: promoCodeId || undefined,
          promo_discount_cents: promoDiscountCents || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

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
      try { localStorage.removeItem('bookingFormData'); } catch {}

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
      <span className="text-slate-500">Selected:</span>
      <span className="text-slate-900 font-medium">
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
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Calendar className="h-5 w-5 text-cyan-600" />
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

          {/* Weather Forecast */}
          {selectedDate && meetingSpotLatitude && meetingSpotLongitude && (
            <WeatherForecast
              latitude={meetingSpotLatitude}
              longitude={meetingSpotLongitude}
              selectedDate={selectedDate}
            />
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm text-red-700">
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
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <PartySizeSelector
              value={partySize}
              onChange={setPartySize}
              maxSize={maxCapacity}
            />
          </div>

          {/* Guest Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Users className="h-5 w-5 text-cyan-600" />
              Contact Information
            </h3>

            <div className="space-y-4">
              {/* Guest Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 min-h-[48px]"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 min-h-[48px] ${
                    emailError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-200'
                  }`}
                  required
                />
                {emailError ? (
                  <p className="mt-1.5 text-sm text-red-600">{emailError}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400">
                    We'll send your booking confirmation and trip details here
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone Number
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <PhoneInput
                  value={guestPhone}
                  onChange={setGuestPhone}
                  helperText="For trip updates and day-of coordination"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Special Requests
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </div>
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Anything we should know? Dietary restrictions, special occasions, questions..."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none"
                />
                <p className="mt-1 text-xs text-slate-400 text-right">
                  {specialRequests.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <button
              type="button"
              onClick={() => setPromoExpanded(!promoExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors w-full"
            >
              <Tag className="h-4 w-4 text-cyan-600" />
              Have a promo code?
              <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${promoExpanded ? 'rotate-90' : ''}`} />
            </button>

            {promoExpanded && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        if (promoValid !== null) {
                          setPromoValid(null);
                          setPromoError(null);
                          setPromoDiscountCents(0);
                          setPromoCodeId(null);
                        }
                      }}
                      placeholder="Enter promo code"
                      maxLength={30}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 min-h-[48px] font-mono uppercase ${
                        promoValid === true
                          ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200'
                          : promoValid === false
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-200'
                      }`}
                    />
                    {promoValid === true && (
                      <button
                        type="button"
                        onClick={clearPromoCode}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={validatePromoCode}
                    disabled={!promoCode.trim() || promoValidating || promoValid === true}
                    className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                  >
                    {promoValidating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>

                {promoValid === true && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-700">
                      {promoDiscountType === 'percentage'
                        ? `${promoDiscountValue}% discount applied`
                        : `${formatCents(promoDiscountCents)} discount applied`}
                      {' '}&mdash; you save {formatCents(promoDiscountCents)}!
                    </span>
                  </div>
                )}

                {promoError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-700">{promoError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Price Summary (when promo applied) */}
          {promoValid === true && promoDiscountCents > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Updated Price</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Total</span>
                  <span className="text-slate-400 line-through">{formatDollars(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Promo Discount ({promoCode})</span>
                  <span>-{formatCents(promoDiscountCents)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-1.5">
                  <span className="font-semibold text-slate-900">New Total</span>
                  <span className="font-bold text-slate-900">{formatDollars(effectiveTotalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Deposit Due Now</span>
                  <span>{formatDollars(effectiveDeposit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Waiver Requirement Notice */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <FileWarning className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Liability Waiver Required
                </h4>
                <p className="text-sm text-blue-700">
                  All passengers must sign a liability waiver before the trip. Waiver links will be sent to your email after booking.
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">{error}</p>
                  <p className="text-xs text-red-500 mt-1">
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
                <span className="text-slate-500">Deposit:</span>
                <span className="text-cyan-700 font-semibold">
                  {promoDiscountCents > 0 && promoValid ? (
                    <>
                      <span className="text-slate-400 line-through mr-1.5">{formatDollars(depositAmount)}</span>
                      {formatDollars(effectiveDeposit)}
                    </>
                  ) : (
                    formatDollars(depositAmount)
                  )}
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
