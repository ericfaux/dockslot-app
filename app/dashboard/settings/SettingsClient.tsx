'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  User,
  Building2,
  MapPin,
  Calendar,
  Moon,
  FileText,
  ChevronDown
} from 'lucide-react';
import { Profile, AvailabilityWindow } from '@/lib/db/types';
import { updateProfile } from '@/app/actions/profile';
import { BookingLinkCard } from '@/components/BookingLinkCard';
import { AvailabilitySettings } from './AvailabilitySettings';

interface SettingsClientProps {
  initialProfile: Profile | null;
  initialAvailabilityWindows: AvailabilityWindow[];
  userEmail: string;
}

// Common US timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (AZ)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time (AST)' },
];

export function SettingsClient({ initialProfile, initialAvailabilityWindows, userEmail }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [email, setEmail] = useState(initialProfile?.email || userEmail);
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [businessName, setBusinessName] = useState(initialProfile?.business_name || '');
  const [timezone, setTimezone] = useState(initialProfile?.timezone || 'America/New_York');
  const [meetingSpotName, setMeetingSpotName] = useState(initialProfile?.meeting_spot_name || '');
  const [meetingSpotAddress, setMeetingSpotAddress] = useState(initialProfile?.meeting_spot_address || '');
  const [meetingSpotInstructions, setMeetingSpotInstructions] = useState(initialProfile?.meeting_spot_instructions || '');
  const [bookingBufferMinutes, setBookingBufferMinutes] = useState(initialProfile?.booking_buffer_minutes ?? 30);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(initialProfile?.advance_booking_days ?? 30);
  const [isHibernating, setIsHibernating] = useState(initialProfile?.is_hibernating ?? false);
  const [hibernationMessage, setHibernationMessage] = useState(initialProfile?.hibernation_message || '');
  const [cancellationPolicy, setCancellationPolicy] = useState(initialProfile?.cancellation_policy || '');

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const result = await updateProfile({
        full_name: fullName || null,
        email: email || null,
        phone: phone || null,
        business_name: businessName || null,
        timezone,
        meeting_spot_name: meetingSpotName || null,
        meeting_spot_address: meetingSpotAddress || null,
        meeting_spot_instructions: meetingSpotInstructions || null,
        booking_buffer_minutes: bookingBufferMinutes,
        advance_booking_days: advanceBookingDays,
        is_hibernating: isHibernating,
        hibernation_message: hibernationMessage || null,
        cancellation_policy: cancellationPolicy || null,
      });

      if (result.success) {
        setSuccess('Settings saved successfully');
        router.refresh();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save settings');
      }
    });
  };

  const inputClassName = "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500";
  const labelClassName = "block text-sm font-medium text-slate-300 mb-1.5";
  const sectionClassName = "rounded-xl border border-slate-800 bg-slate-900/50 p-6";

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Booking Link - Show at top for easy access */}
      {initialProfile?.id && (
        <BookingLinkCard captainId={initialProfile.id} />
      )}

      {/* Profile Information */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Profile Information</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className={labelClassName}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Captain John Smith"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClassName}>
              Contact Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="captain@example.com"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClassName}>
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="timezone" className={labelClassName}>
              Timezone
            </label>
            <div className="relative">
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`${inputClassName} appearance-none pr-10`}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Business Information */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Business Information</h2>
        </div>
        <div>
          <label htmlFor="businessName" className={labelClassName}>
            Business Name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Captain John's Charter Fishing"
            className={inputClassName}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            This name will appear on booking confirmations and guest communications.
          </p>
        </div>
      </section>

      {/* Meeting Spot */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Meeting Spot</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Where should guests meet you for trips? This information is shared after booking.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="meetingSpotName" className={labelClassName}>
              Location Name
            </label>
            <input
              id="meetingSpotName"
              type="text"
              value={meetingSpotName}
              onChange={(e) => setMeetingSpotName(e.target.value)}
              placeholder="Harbor Marina - Dock 7"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="meetingSpotAddress" className={labelClassName}>
              Address
            </label>
            <input
              id="meetingSpotAddress"
              type="text"
              value={meetingSpotAddress}
              onChange={(e) => setMeetingSpotAddress(e.target.value)}
              placeholder="123 Harbor Road, Marina Bay, FL 33139"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="meetingSpotInstructions" className={labelClassName}>
              Instructions for Guests
            </label>
            <textarea
              id="meetingSpotInstructions"
              value={meetingSpotInstructions}
              onChange={(e) => setMeetingSpotInstructions(e.target.value)}
              placeholder="Park in the marina lot and walk to Dock 7. Look for the blue and white boat named 'Sea Quest'. Call me when you arrive."
              rows={3}
              className={inputClassName}
            />
          </div>
        </div>
      </section>

      {/* Booking Settings */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Booking Settings</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bookingBufferMinutes" className={labelClassName}>
              Buffer Between Trips (minutes)
            </label>
            <input
              id="bookingBufferMinutes"
              type="number"
              min="0"
              max="1440"
              value={bookingBufferMinutes}
              onChange={(e) => setBookingBufferMinutes(parseInt(e.target.value) || 0)}
              className={inputClassName}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Minimum time between the end of one trip and the start of the next.
            </p>
          </div>
          <div>
            <label htmlFor="advanceBookingDays" className={labelClassName}>
              Advance Booking Window (days)
            </label>
            <input
              id="advanceBookingDays"
              type="number"
              min="1"
              max="365"
              value={advanceBookingDays}
              onChange={(e) => setAdvanceBookingDays(parseInt(e.target.value) || 1)}
              className={inputClassName}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              How far in advance guests can book trips.
            </p>
          </div>
        </div>
      </section>

      {/* Weekly Availability */}
      <AvailabilitySettings initialWindows={initialAvailabilityWindows} />

      {/* Hibernation Mode */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <Moon className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Hibernation Mode</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Temporarily pause new bookings during off-season or when you're unavailable.
        </p>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={isHibernating}
                onChange={(e) => setIsHibernating(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`h-6 w-11 rounded-full transition-colors ${
                  isHibernating ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    isHibernating ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <span className="text-sm text-slate-300">
              {isHibernating ? 'Hibernation mode is ON' : 'Hibernation mode is OFF'}
            </span>
          </label>
          {isHibernating && (
            <div>
              <label htmlFor="hibernationMessage" className={labelClassName}>
                Message for Visitors
              </label>
              <textarea
                id="hibernationMessage"
                value={hibernationMessage}
                onChange={(e) => setHibernationMessage(e.target.value)}
                placeholder="We're currently on break and will return in Spring 2024. Check back soon for new availability!"
                rows={2}
                className={inputClassName}
              />
            </div>
          )}
        </div>
      </section>

      {/* Cancellation Policy */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Cancellation Policy</h2>
        </div>
        <div>
          <label htmlFor="cancellationPolicy" className={labelClassName}>
            Your Cancellation Terms
          </label>
          <textarea
            id="cancellationPolicy"
            value={cancellationPolicy}
            onChange={(e) => setCancellationPolicy(e.target.value)}
            placeholder="Cancellations made 48+ hours in advance receive a full refund of the deposit. Cancellations within 48 hours forfeit the deposit. Weather-related cancellations will be rescheduled at no additional cost."
            rows={4}
            className={inputClassName}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            This policy is displayed to guests during the booking process.
          </p>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="group flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-75 hover:bg-cyan-500 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            boxShadow: '0 4px 14px rgba(34, 211, 238, 0.25)',
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
