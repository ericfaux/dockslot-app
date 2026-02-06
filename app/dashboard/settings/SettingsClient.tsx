'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  User,
  Building2,
  MapPin,
  Calendar as CalendarIcon,
  Moon,
  FileText,
  ChevronDown,
  Anchor,
  ExternalLink,
  Users,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Profile, AvailabilityWindow, HibernationSubscriber } from '@/lib/db/types';
import { updateProfile } from '@/app/actions/profile';
import {
  getHibernationSubscribers,
  deleteHibernationSubscriber,
  exportHibernationSubscribers,
} from '@/app/actions/hibernation-subscribers';
import { BookingLinkCard } from '@/components/BookingLinkCard';
import { AvailabilitySettings } from './AvailabilitySettings';
import { CalendarExport } from './components/CalendarExport';

interface SettingsClientProps {
  initialProfile: Profile | null;
  initialAvailabilityWindows: AvailabilityWindow[];
  userEmail: string;
  calendarToken: string;
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

export function SettingsClient({ initialProfile, initialAvailabilityWindows, userEmail, calendarToken }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentCalendarToken, setCurrentCalendarToken] = useState(calendarToken);

  // Form state
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [email, setEmail] = useState(initialProfile?.email || userEmail);
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [businessName, setBusinessName] = useState(initialProfile?.business_name || '');
  const [timezone, setTimezone] = useState(initialProfile?.timezone || 'America/New_York');
  const [meetingSpotName, setMeetingSpotName] = useState(initialProfile?.meeting_spot_name || '');
  const [meetingSpotAddress, setMeetingSpotAddress] = useState(initialProfile?.meeting_spot_address || '');
  const [meetingSpotInstructions, setMeetingSpotInstructions] = useState(initialProfile?.meeting_spot_instructions || '');
  const [savedAddress, setSavedAddress] = useState(initialProfile?.meeting_spot_address || '');
  const [meetingSpotLat, setMeetingSpotLat] = useState<number | null>(initialProfile?.meeting_spot_latitude ?? null);
  const [meetingSpotLon, setMeetingSpotLon] = useState<number | null>(initialProfile?.meeting_spot_longitude ?? null);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [bookingBufferMinutes, setBookingBufferMinutes] = useState(initialProfile?.booking_buffer_minutes ?? 30);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(initialProfile?.advance_booking_days ?? 30);
  const [isHibernating, setIsHibernating] = useState(initialProfile?.is_hibernating ?? false);
  const [hibernationMessage, setHibernationMessage] = useState(initialProfile?.hibernation_message || '');
  const [hibernationEndDate, setHibernationEndDate] = useState(initialProfile?.hibernation_end_date || '');
  const [hibernationResumeTime, setHibernationResumeTime] = useState(initialProfile?.hibernation_resume_time || '');
  const [hibernationShowReturnDate, setHibernationShowReturnDate] = useState(initialProfile?.hibernation_show_return_date ?? true);
  const [hibernationAllowNotifications, setHibernationAllowNotifications] = useState(initialProfile?.hibernation_allow_notifications ?? true);
  const [hibernationShowContactInfo, setHibernationShowContactInfo] = useState(initialProfile?.hibernation_show_contact_info ?? false);
  const [cancellationPolicy, setCancellationPolicy] = useState(initialProfile?.cancellation_policy || '');
  const [dockModeEnabled, setDockModeEnabled] = useState(initialProfile?.dock_mode_enabled ?? false);
  const [seasonRevenueGoal, setSeasonRevenueGoal] = useState(
    (initialProfile?.season_revenue_goal_cents ?? 0) / 100
  );

  // Subscriber management state
  const [subscribers, setSubscribers] = useState<HibernationSubscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscribersExpanded, setSubscribersExpanded] = useState(false);

  const loadSubscribers = async () => {
    if (subscribersLoading) return;
    setSubscribersLoading(true);
    const result = await getHibernationSubscribers();
    if (result.success && result.data) {
      setSubscribers(result.data);
    }
    setSubscribersLoading(false);
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    const result = await deleteHibernationSubscriber(subscriberId);
    if (result.success) {
      setSubscribers(subscribers.filter(s => s.id !== subscriberId));
    }
  };

  const handleExportSubscribers = async () => {
    const result = await exportHibernationSubscribers();
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hibernation-subscribers.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const toggleSubscribers = () => {
    if (!subscribersExpanded && subscribers.length === 0) {
      loadSubscribers();
    }
    setSubscribersExpanded(!subscribersExpanded);
  };

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      let lat = meetingSpotLat;
      let lon = meetingSpotLon;

      // Auto-geocode if address changed since last save
      const addressChanged = meetingSpotAddress.trim() !== savedAddress.trim();
      if (addressChanged && meetingSpotAddress.trim()) {
        setGeocodeStatus('loading');
        setGeocodeMessage(null);
        try {
          const res = await fetch(`/api/geocode?address=${encodeURIComponent(meetingSpotAddress.trim())}`);
          const data = await res.json();
          if (res.ok && data.lat && data.lon) {
            lat = data.lat;
            lon = data.lon;
            setMeetingSpotLat(lat);
            setMeetingSpotLon(lon);
            setGeocodeStatus('success');
            setGeocodeMessage(`Matched: ${data.matchedAddress}`);
          } else {
            setGeocodeStatus('error');
            setGeocodeMessage(data.error || 'Geocoding failed');
            // Don't clear existing coords — keep them if address change failed
          }
        } catch {
          setGeocodeStatus('error');
          setGeocodeMessage('Geocoding service unavailable');
        }
      }

      const result = await updateProfile({
        full_name: fullName || null,
        email: email || null,
        phone: phone || null,
        business_name: businessName || null,
        timezone,
        meeting_spot_name: meetingSpotName || null,
        meeting_spot_address: meetingSpotAddress || null,
        meeting_spot_instructions: meetingSpotInstructions || null,
        meeting_spot_latitude: lat,
        meeting_spot_longitude: lon,
        booking_buffer_minutes: bookingBufferMinutes,
        advance_booking_days: advanceBookingDays,
        is_hibernating: isHibernating,
        hibernation_message: hibernationMessage || null,
        hibernation_end_date: hibernationEndDate || null,
        hibernation_resume_time: hibernationResumeTime || null,
        hibernation_show_return_date: hibernationShowReturnDate,
        hibernation_allow_notifications: hibernationAllowNotifications,
        hibernation_show_contact_info: hibernationShowContactInfo,
        cancellation_policy: cancellationPolicy || null,
        dock_mode_enabled: dockModeEnabled,
        season_revenue_goal_cents: Math.round(seasonRevenueGoal * 100),
      });

      if (result.success) {
        setSavedAddress(meetingSpotAddress);
        setSuccess('Settings saved successfully');
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save settings');
      }
    });
  };

  const handleManualCoordsSubmit = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setGeocodeStatus('error');
      setGeocodeMessage('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180.');
      return;
    }
    setMeetingSpotLat(lat);
    setMeetingSpotLon(lon);
    setGeocodeStatus('success');
    setGeocodeMessage('Coordinates set manually');
    setShowManualCoords(false);
  };

  const handleRegenerateCalendarToken = async () => {
    try {
      const response = await fetch('/api/calendar/regenerate', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate token');
      }

      const data = await response.json();
      setCurrentCalendarToken(data.calendarToken);
      setSuccess('Calendar token regenerated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to regenerate calendar token');
      setTimeout(() => setError(null), 3000);
    }
  };

  const inputClassName = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500";
  const labelClassName = "block text-sm font-medium text-slate-600 mb-1.5";
  const sectionClassName = "rounded-xl border border-slate-200 bg-white p-6";

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
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
          <User className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
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
          <Building2 className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Business Information</h2>
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
          <MapPin className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Meeting Spot</h2>
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

          {/* Coordinate Status & Weather Location */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Weather Location</span>
              {geocodeStatus === 'loading' && (
                <span className="flex items-center gap-1.5 text-xs text-cyan-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Geocoding...
                </span>
              )}
            </div>

            {meetingSpotLat !== null && meetingSpotLon !== null ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span className="text-sm text-emerald-600">
                  {meetingSpotLat.toFixed(4)}, {meetingSpotLon.toFixed(4)} — Location verified
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <span className="text-sm text-amber-600">
                  No coordinates set — save with an address to auto-detect, or enter manually below
                </span>
              </div>
            )}

            {geocodeStatus === 'error' && geocodeMessage && (
              <div className="flex items-start gap-2 rounded-md bg-rose-50 border border-rose-500/20 px-3 py-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span className="text-xs text-rose-600">{geocodeMessage}</span>
              </div>
            )}

            {geocodeStatus === 'success' && geocodeMessage && (
              <p className="text-xs text-slate-500">{geocodeMessage}</p>
            )}

            {/* Manual coordinate entry toggle */}
            <button
              type="button"
              onClick={() => setShowManualCoords(!showManualCoords)}
              className="text-xs text-cyan-600 hover:text-cyan-600 transition-colors"
            >
              {showManualCoords ? 'Hide manual entry' : 'Enter coordinates manually'}
            </button>

            {showManualCoords && (
              <div className="space-y-3 pt-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="manualLat" className="block text-xs font-medium text-slate-400 mb-1">
                      Latitude
                    </label>
                    <input
                      id="manualLat"
                      type="number"
                      step="any"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="e.g. 39.2815"
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="manualLon" className="block text-xs font-medium text-slate-400 mb-1">
                      Longitude
                    </label>
                    <input
                      id="manualLon"
                      type="number"
                      step="any"
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                      placeholder="e.g. -76.5925"
                      className={inputClassName}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualCoordsSubmit}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Set Coordinates
                </button>
                <p className="text-xs text-slate-500">
                  Tip: Find coordinates on Google Maps by right-clicking your location.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Booking Settings */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Booking Settings</h2>
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
          <div>
            <label htmlFor="seasonRevenueGoal" className={labelClassName}>
              Season Revenue Goal ($)
            </label>
            <input
              id="seasonRevenueGoal"
              type="number"
              min="0"
              step="100"
              value={seasonRevenueGoal || ''}
              onChange={(e) => setSeasonRevenueGoal(parseFloat(e.target.value) || 0)}
              placeholder="10000"
              className={inputClassName}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Your revenue target for the season. Shown on the dashboard fuel gauge.
            </p>
          </div>
        </div>
      </section>

      {/* Dock Mode */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <Anchor className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Dock Mode</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          A simplified, high-contrast interface for use while on the water. Large text, big buttons, and only essential trip info.
        </p>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={dockModeEnabled}
                onChange={(e) => setDockModeEnabled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`h-6 w-11 rounded-full transition-colors ${
                  dockModeEnabled ? 'bg-cyan-500' : 'bg-slate-100'
                }`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    dockModeEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <span className="text-sm text-slate-600">
              {dockModeEnabled ? 'Dock Mode is available' : 'Dock Mode is disabled'}
            </span>
          </label>
          {dockModeEnabled && (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-50 p-4">
              <p className="text-sm text-cyan-600 mb-3">
                When enabled, a &quot;Dock Mode&quot; button will appear on your dashboard. You can also access it directly at:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 text-sm text-slate-600 font-mono">
                  /dock
                </code>
                <a
                  href="/dock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
                >
                  <span>Open</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Designed for sun glare, wet hands, and quick reference. Perfect for dockside use.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Weekly Availability */}
      <AvailabilitySettings initialWindows={initialAvailabilityWindows} />

      {/* Hibernation Mode */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <Moon className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Hibernation Mode</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Temporarily pause new bookings during off-season. Set a return date to automatically resume accepting bookings.
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
                  isHibernating ? 'bg-amber-500' : 'bg-slate-100'
                }`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    isHibernating ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <span className="text-sm text-slate-600">
              {isHibernating ? 'Hibernation mode is ON' : 'Hibernation mode is OFF'}
            </span>
          </label>

          {isHibernating && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-4 space-y-4">
              {/* Scheduled Resumption */}
              <div>
                <label htmlFor="hibernationEndDate" className={labelClassName}>
                  Hibernation Ends On
                </label>
                <div className="flex gap-3">
                  <input
                    id="hibernationEndDate"
                    type="date"
                    value={hibernationEndDate}
                    onChange={(e) => setHibernationEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`${inputClassName} flex-1`}
                  />
                  <input
                    id="hibernationResumeTime"
                    type="time"
                    value={hibernationResumeTime}
                    onChange={(e) => setHibernationResumeTime(e.target.value)}
                    placeholder="08:00"
                    className={`${inputClassName} w-32`}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Your booking page will automatically reopen on this date{hibernationResumeTime ? ` at ${hibernationResumeTime}` : ' at midnight'} ({timezone.split('/')[1]?.replace('_', ' ') || timezone}).
                </p>
              </div>

              {/* Guest-facing options */}
              <div className="space-y-3 pt-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={hibernationShowReturnDate}
                    onChange={(e) => setHibernationShowReturnDate(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm text-slate-600">
                    Show return date to guests
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={hibernationAllowNotifications}
                    onChange={(e) => setHibernationAllowNotifications(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm text-slate-600">
                    Let guests sign up for &quot;We&apos;re Back!&quot; notifications
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={hibernationShowContactInfo}
                    onChange={(e) => setHibernationShowContactInfo(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm text-slate-600">
                    Show contact info during hibernation
                  </span>
                </label>
              </div>

              {/* Off-season message */}
              <div className="pt-2">
                <label htmlFor="hibernationMessage" className={labelClassName}>
                  Off-Season Message
                </label>
                <textarea
                  id="hibernationMessage"
                  value={hibernationMessage}
                  onChange={(e) => setHibernationMessage(e.target.value)}
                  placeholder="We're taking a winter break! See you in the spring."
                  rows={2}
                  className={inputClassName}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  This message is shown to guests who visit your booking page during hibernation.
                </p>
              </div>

              {/* Notification Subscribers */}
              {hibernationAllowNotifications && (
                <div className="pt-4 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={toggleSubscribers}
                    className="flex w-full items-center justify-between text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Notification Subscribers
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${subscribersExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {subscribersExpanded && (
                    <div className="mt-3 space-y-3">
                      {subscribersLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                        </div>
                      ) : subscribers.length === 0 ? (
                        <p className="text-sm text-slate-500 py-2">
                          No subscribers yet. Guests can sign up on your booking page.
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">
                              {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
                            </span>
                            <button
                              type="button"
                              onClick={handleExportSubscribers}
                              className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-600 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Export CSV
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {subscribers.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-slate-900 truncate">
                                    {sub.email}
                                  </p>
                                  {sub.name && (
                                    <p className="text-xs text-slate-400 truncate">
                                      {sub.name}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubscriber(sub.id)}
                                  className="ml-2 p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                                  title="Remove subscriber"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Cancellation Policy */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Cancellation Policy</h2>
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

      {/* Calendar Export */}
      <section className={sectionClassName}>
        <CalendarExport
          calendarToken={currentCalendarToken}
          onRegenerate={handleRegenerateCalendarToken}
        />
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
