'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  Mail,
  MessageSquare,
  Palette,
  AlertTriangle,
  Star,
  ExternalLink,
} from 'lucide-react';
import { EmailPreferences, SubscriptionTier } from '@/lib/db/types';
import { canUseFeature } from '@/lib/subscription/gates';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { getEmailPreferences, updateEmailPreferences } from '@/app/actions/email-preferences';
import { getProfile } from '@/app/actions/profile';

/**
 * Checks if a branding field value contains placeholder/example text
 * that should not be sent in real emails.
 */
function containsPlaceholderText(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return (
    lower.includes('example.com') ||
    lower.includes('captain mike') ||
    lower.includes('(555) 123-4567')
  );
}

interface NotificationsTabProps {
  subscriptionTier: SubscriptionTier;
}

export function NotificationsTab({ subscriptionTier }: NotificationsTabProps) {
  const canUseSms = canUseFeature(subscriptionTier, 'sms_reminders');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email toggles
  const [bookingConfirmation, setBookingConfirmation] = useState(true);
  const [depositReminder, setDepositReminder] = useState(true);
  const [tripReminder, setTripReminder] = useState(true);
  const [reminderTiming, setReminderTiming] = useState<('24h' | '48h')[]>(['24h']);
  const [weatherAlert, setWeatherAlert] = useState(true);
  const [reviewRequest, setReviewRequest] = useState(true);
  const [reviewRequestTiming, setReviewRequestTiming] = useState<'immediate' | '8h' | '24h' | '48h'>('24h');
  const [reviewRequestCustomMessage, setReviewRequestCustomMessage] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [includeGoogleReviewLink, setIncludeGoogleReviewLink] = useState(false);
  const [cancellationNotification, setCancellationNotification] = useState(true);

  // SMS toggles
  const [smsBookingConfirmation, setSmsBookingConfirmation] = useState(true);
  const [smsDayOfReminder, setSmsDayOfReminder] = useState(true);
  const [smsWeatherHold, setSmsWeatherHold] = useState(true);

  // Branding
  const [customWhatToBring, setCustomWhatToBring] = useState('');
  const [businessNameOverride, setBusinessNameOverride] = useState('');
  const [businessPhoneOverride, setBusinessPhoneOverride] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [emailSignature, setEmailSignature] = useState('');

  // Profile data for placeholder hints and fallback
  const [profileBusinessName, setProfileBusinessName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileFullName, setProfileFullName] = useState('');

  useEffect(() => {
    async function loadPreferences() {
      const [prefsResult, profileResult] = await Promise.all([
        getEmailPreferences(),
        getProfile(),
      ]);

      if (prefsResult.success && prefsResult.data) {
        const p = prefsResult.data;
        setBookingConfirmation(p.booking_confirmation_enabled);
        setDepositReminder(p.deposit_reminder_enabled);
        setTripReminder(p.trip_reminder_enabled);
        setReminderTiming(p.trip_reminder_timing);
        setWeatherAlert(p.weather_alert_enabled);
        setReviewRequest(p.review_request_enabled);
        setReviewRequestTiming(p.review_request_timing || '24h');
        setReviewRequestCustomMessage(p.review_request_custom_message || '');
        setGoogleReviewLink(p.google_review_link || '');
        setIncludeGoogleReviewLink(p.include_google_review_link || false);
        setCancellationNotification(p.cancellation_notification_enabled);
        setSmsBookingConfirmation(p.sms_booking_confirmation);
        setSmsDayOfReminder(p.sms_day_of_reminder);
        setSmsWeatherHold(p.sms_weather_hold);
        setCustomWhatToBring(p.custom_what_to_bring || '');

        // Clear out values that contain placeholder text instead of loading them
        const nameOverride = p.business_name_override || '';
        const phoneOverride = p.business_phone_override || '';
        const logo = p.logo_url || '';
        const signature = p.email_signature || '';

        setBusinessNameOverride(containsPlaceholderText(nameOverride) ? '' : nameOverride);
        setBusinessPhoneOverride(containsPlaceholderText(phoneOverride) ? '' : phoneOverride);
        setLogoUrl(containsPlaceholderText(logo) ? '' : logo);
        setEmailSignature(containsPlaceholderText(signature) ? '' : signature);
      }

      // Use profile data for placeholder hints
      if (profileResult.success && profileResult.data) {
        const prof = profileResult.data;
        setProfileBusinessName(prof.business_name || '');
        setProfilePhone(prof.phone || '');
        setProfileFullName(prof.full_name || '');
      }

      setIsLoading(false);
    }
    loadPreferences();
  }, []);

  const handleTimingToggle = (value: '24h' | '48h') => {
    setReminderTiming(prev => {
      if (prev.includes(value)) {
        // Don't allow empty — keep at least one
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== value);
      }
      return [...prev, value];
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const result = await updateEmailPreferences({
        booking_confirmation_enabled: bookingConfirmation,
        deposit_reminder_enabled: depositReminder,
        trip_reminder_enabled: tripReminder,
        trip_reminder_timing: reminderTiming,
        weather_alert_enabled: weatherAlert,
        review_request_enabled: reviewRequest,
        review_request_timing: reviewRequestTiming,
        review_request_custom_message: reviewRequestCustomMessage || null,
        google_review_link: googleReviewLink || null,
        include_google_review_link: includeGoogleReviewLink,
        cancellation_notification_enabled: cancellationNotification,
        sms_booking_confirmation: smsBookingConfirmation,
        sms_day_of_reminder: smsDayOfReminder,
        sms_weather_hold: smsWeatherHold,
        custom_what_to_bring: customWhatToBring || null,
        business_name_override: businessNameOverride || null,
        business_phone_override: businessPhoneOverride || null,
        logo_url: logoUrl || null,
        email_signature: emailSignature || null,
      });

      if (result.success) {
        setSuccess('Notification preferences saved');
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save preferences');
      }
    });
  };

  const sectionClassName = 'rounded-xl border border-slate-200 bg-white p-6';
  const inputClassName = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500';
  const labelClassName = 'block text-sm font-medium text-slate-600 mb-1.5';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
        <span className="ml-2 text-slate-400">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className={sectionClassName}>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold text-slate-900">Email Notifications</h3>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Choose which automated emails are sent to your guests.
        </p>

        <div className="space-y-4">
          <ToggleRow
            label="Booking Confirmation"
            description="Sent immediately when a booking is created"
            checked={bookingConfirmation}
            onChange={setBookingConfirmation}
          />
          <ToggleRow
            label="Deposit Reminder"
            description="Sent to guests with pending deposits after 24 hours"
            checked={depositReminder}
            onChange={setDepositReminder}
          />
          <ToggleRow
            label="Trip Reminder"
            description="Sent before the scheduled trip"
            checked={tripReminder}
            onChange={setTripReminder}
          />
          {tripReminder && (
            <div className="ml-12 flex gap-3">
              <TimingButton
                label="24 hours before"
                value="24h"
                active={reminderTiming.includes('24h')}
                onToggle={handleTimingToggle}
              />
              <TimingButton
                label="48 hours before"
                value="48h"
                active={reminderTiming.includes('48h')}
                onToggle={handleTimingToggle}
              />
            </div>
          )}
          <ToggleRow
            label="Weather Alert"
            description="Notify guest when trip is placed on weather hold"
            checked={weatherAlert}
            onChange={setWeatherAlert}
          />
          <ToggleRow
            label="Review Request"
            description="Sent after trip completion asking for a review"
            checked={reviewRequest}
            onChange={setReviewRequest}
          />
          {reviewRequest && (
            <div className="ml-12 space-y-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
              {/* Timing selector */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  When to send
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'immediate' as const, label: 'Right after trip' },
                    { value: '8h' as const, label: '8 hours after' },
                    { value: '24h' as const, label: '24 hours after' },
                    { value: '48h' as const, label: '48 hours after' },
                  ]).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReviewRequestTiming(option.value)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        reviewRequestTiming === option.value
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Time is relative to when the trip is scheduled to end on your calendar.
                </p>
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Custom Review Request Message
                </label>
                <textarea
                  value={reviewRequestCustomMessage}
                  onChange={(e) => setReviewRequestCustomMessage(e.target.value)}
                  placeholder={`Thank you for choosing {business_name}! We had a great time with you aboard {vessel_name} and would love to hear your feedback.`}
                  rows={4}
                  className={inputClassName}
                  maxLength={2000}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Leave blank for the default message. Available placeholders: {'{guest_name}'}, {'{business_name}'}, {'{trip_type}'}, {'{vessel_name}'}, {'{trip_date}'}.
                </p>
              </div>

              {/* Google Reviews */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium text-slate-700">Google Reviews</p>
                </div>
                <ToggleRow
                  label="Include Google Reviews link"
                  description="Add a button linking to your Google review page"
                  checked={includeGoogleReviewLink}
                  onChange={setIncludeGoogleReviewLink}
                />
                {includeGoogleReviewLink && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">
                      Google Review Link
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={googleReviewLink}
                        onChange={(e) => setGoogleReviewLink(e.target.value)}
                        placeholder="https://g.page/r/your-business/review"
                        className={inputClassName}
                        maxLength={500}
                      />
                      <ExternalLink className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Find this in your Google Business Profile under &quot;Ask for reviews&quot; or &quot;Get more reviews&quot;.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <ToggleRow
            label="Cancellation / Reschedule Notification"
            description="Sent when a booking status changes"
            checked={cancellationNotification}
            onChange={setCancellationNotification}
          />
        </div>
      </div>

      {/* SMS Notifications */}
      <div className={sectionClassName}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold text-slate-900">SMS Notifications</h3>
        </div>
        {canUseSms ? (
          <>
            <p className="text-sm text-slate-400 mb-6">
              Critical text messages sent to guests who provide a phone number. Messages are kept short with a link to full details.
            </p>

            <div className="space-y-4">
              <ToggleRow
                label="Booking Confirmation SMS"
                description="Text confirmation when booking is created"
                checked={smsBookingConfirmation}
                onChange={setSmsBookingConfirmation}
              />
              <ToggleRow
                label="Day-of Reminder SMS"
                description="Short text on the day of the trip"
                checked={smsDayOfReminder}
                onChange={setSmsDayOfReminder}
              />
              <ToggleRow
                label="Weather Hold SMS"
                description="Text when trip is placed on weather hold"
                checked={smsWeatherHold}
                onChange={setSmsWeatherHold}
              />
            </div>
          </>
        ) : (
          <UpgradePrompt
            feature="SMS Reminders"
            description="Send text confirmations, day-of reminders, and weather alerts to your guests."
            requiredTier="captain"
          />
        )}
      </div>

      {/* Branding & Customization */}
      <div className={sectionClassName}>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold text-slate-900">Email Branding</h3>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Customize the content and branding of automated emails.
        </p>

        {/* Warning banner if any field contains placeholder text */}
        {(containsPlaceholderText(businessNameOverride) ||
          containsPlaceholderText(businessPhoneOverride) ||
          containsPlaceholderText(logoUrl) ||
          containsPlaceholderText(emailSignature)) && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Placeholder text detected
              </p>
              <p className="mt-1 text-xs text-amber-700">
                One or more branding fields contain example data (e.g. &quot;example.com&quot;, &quot;Captain Mike&quot;, &quot;(555) 123-4567&quot;). Please update or clear these fields so your emails use your real business information.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className={labelClassName}>Business Name (in emails)</label>
            <input
              type="text"
              value={businessNameOverride}
              onChange={(e) => setBusinessNameOverride(e.target.value)}
              placeholder={profileBusinessName ? `From profile: ${profileBusinessName}` : 'Leave blank to use your profile business name'}
              className={inputClassName}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave blank to use your profile business name{profileBusinessName ? ` (${profileBusinessName})` : ''}.
            </p>
          </div>

          <div>
            <label className={labelClassName}>Business Phone (in emails)</label>
            <input
              type="text"
              value={businessPhoneOverride}
              onChange={(e) => setBusinessPhoneOverride(e.target.value)}
              placeholder={profilePhone ? `From profile: ${profilePhone}` : 'Leave blank to use your profile phone'}
              className={inputClassName}
              maxLength={20}
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave blank to use your profile phone number{profilePhone ? ` (${profilePhone})` : ''}.
            </p>
          </div>

          <div>
            <label className={labelClassName}>Logo URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://your-website.com/logo.png"
              className={inputClassName}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional. Will appear at the top of your emails. Recommended: 200x60px.
            </p>
          </div>

          <div>
            <label className={labelClassName}>Custom &quot;What to Bring&quot; List</label>
            <textarea
              value={customWhatToBring}
              onChange={(e) => setCustomWhatToBring(e.target.value)}
              placeholder={"Photo ID\nSunscreen & sunglasses\nLight jacket\nCamera\nSnacks & beverages"}
              rows={5}
              className={inputClassName}
              maxLength={2000}
            />
            <p className="mt-1 text-xs text-slate-500">
              One item per line. Included in confirmation and reminder emails. Leave blank for defaults.
            </p>
          </div>

          <div>
            <label className={labelClassName}>Email Signature</label>
            <textarea
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              placeholder={profileBusinessName || profileFullName
                ? `${profileBusinessName || profileFullName}\n${profilePhone || 'Your phone number'}\nTight lines!`
                : 'Your Business Name\nYour phone number\nTight lines!'}
              rows={3}
              className={inputClassName}
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional closing text at the bottom of all emails.
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 px-4 py-3">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-cyan-600' : 'bg-slate-100'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function TimingButton({
  label,
  value,
  active,
  onToggle,
}: {
  label: string;
  value: '24h' | '48h';
  active: boolean;
  onToggle: (val: '24h' | '48h') => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-cyan-600 bg-cyan-900/30 text-cyan-600'
          : 'border-slate-200 bg-white text-slate-400 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}
