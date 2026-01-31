'use client';

import { useState } from 'react';
import { DateSlotPicker } from '@/components/booking/DateSlotPicker';
import { Calendar, Users, Mail, Phone, User, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
  captainId: string;
  tripTypeId: string;
  tripDuration: number;
  depositAmount: number;
  totalPrice: number;
  maxCapacity: number;
}

export function BookingForm({
  captainId,
  tripTypeId,
  tripDuration,
  depositAmount,
  totalPrice,
  maxCapacity,
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSlotSelect = (date: Date, startTime: string, endTime: string) => {
    setSelectedDate(date);
    setSelectedTime(startTime);
    setSelectedEndTime(endTime);
  };

  const handleContinueToDetails = () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time slot');
      return;
    }
    setError(null);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone || null,
          party_size: partySize,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          special_requests: specialRequests || null,
          total_price_cents: totalPrice,
          deposit_paid_cents: 0, // Will be updated after payment
          balance_due_cents: totalPrice,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      const { booking } = await response.json();

      // Redirect to confirmation/payment page
      router.push(`/book/${captainId}/${tripTypeId}/confirm?bookingId=${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
            step === 'date'
              ? 'bg-cyan-500 text-slate-900'
              : 'bg-slate-700 text-slate-100'
          }`}
        >
          1
        </div>
        <div className="h-px w-12 bg-slate-700" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
            step === 'details'
              ? 'bg-cyan-500 text-slate-900'
              : 'bg-slate-700 text-slate-400'
          }`}
        >
          2
        </div>
      </div>

      {/* Step 1: Date & Time Selection */}
      {step === 'date' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
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
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleContinueToDetails}
            disabled={!selectedDate || !selectedTime}
            className="w-full rounded-lg bg-cyan-500 px-6 py-4 font-semibold text-slate-900 transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-cyan-500"
          >
            Continue to Guest Details
          </button>
        </div>
      )}

      {/* Step 2: Guest Details Form */}
      {step === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Users className="h-5 w-5 text-cyan-400" />
              Guest Information
            </h3>

            <div className="space-y-4">
              {/* Party Size */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Party Size
                </label>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                >
                  {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'guest' : 'guests'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guest Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Primary Contact Name
                  </div>
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  We'll send your booking confirmation here
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </div>
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Optional - for trip updates and coordination
                </p>
              </div>

              {/* Special Requests */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Special Requests or Notes
                  </div>
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests, dietary restrictions, or questions..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep('date')}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-6 py-4 font-semibold text-slate-100 transition-all hover:bg-slate-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-cyan-500 px-6 py-4 font-semibold text-slate-900 transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Creating Booking...' : `Pay Deposit ($${(depositAmount / 100).toFixed(2)})`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
