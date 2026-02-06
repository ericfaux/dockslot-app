'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  Moon,
  FileText,
  Gift,
  Tag,
  ChevronDown,
  Users,
  Download,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Profile, HibernationSubscriber, TripType } from '@/lib/db/types';
import { updateProfile } from '@/app/actions/profile';
import {
  getHibernationSubscribers,
  deleteHibernationSubscriber,
  exportHibernationSubscribers,
} from '@/app/actions/hibernation-subscribers';
import { BookingLinkCard } from '@/components/BookingLinkCard';
import ReferralProgramClient from '../referrals/ReferralProgramClient';
import PromoCodesClient from '../promo-codes/PromoCodesClient';

interface BookingPageTabProps {
  initialProfile: Profile | null;
  tripTypes?: TripType[];
}

export function BookingPageTab({ initialProfile, tripTypes = [] }: BookingPageTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isHibernating, setIsHibernating] = useState(initialProfile?.is_hibernating ?? false);
  const [hibernationMessage, setHibernationMessage] = useState(initialProfile?.hibernation_message || '');
  const [hibernationEndDate, setHibernationEndDate] = useState(initialProfile?.hibernation_end_date || '');
  const [hibernationResumeTime, setHibernationResumeTime] = useState(initialProfile?.hibernation_resume_time || '');
  const [hibernationShowReturnDate, setHibernationShowReturnDate] = useState(initialProfile?.hibernation_show_return_date ?? true);
  const [hibernationAllowNotifications, setHibernationAllowNotifications] = useState(initialProfile?.hibernation_allow_notifications ?? true);
  const [hibernationShowContactInfo, setHibernationShowContactInfo] = useState(initialProfile?.hibernation_show_contact_info ?? false);
  const [cancellationPolicy, setCancellationPolicy] = useState(initialProfile?.cancellation_policy || '');

  const timezone = initialProfile?.timezone || 'America/New_York';

  // Subscriber management state
  const [subscribers, setSubscribers] = useState<HibernationSubscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscribersExpanded, setSubscribersExpanded] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      isHibernating !== (initialProfile?.is_hibernating ?? false) ||
      hibernationMessage !== (initialProfile?.hibernation_message || '') ||
      hibernationEndDate !== (initialProfile?.hibernation_end_date || '') ||
      hibernationResumeTime !== (initialProfile?.hibernation_resume_time || '') ||
      hibernationShowReturnDate !== (initialProfile?.hibernation_show_return_date ?? true) ||
      hibernationAllowNotifications !== (initialProfile?.hibernation_allow_notifications ?? true) ||
      hibernationShowContactInfo !== (initialProfile?.hibernation_show_contact_info ?? false) ||
      cancellationPolicy !== (initialProfile?.cancellation_policy || '')
    );
  }, [isHibernating, hibernationMessage, hibernationEndDate, hibernationResumeTime, hibernationShowReturnDate, hibernationAllowNotifications, hibernationShowContactInfo, cancellationPolicy, initialProfile]);

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

      const result = await updateProfile({
        is_hibernating: isHibernating,
        hibernation_message: hibernationMessage || null,
        hibernation_end_date: hibernationEndDate || null,
        hibernation_resume_time: hibernationResumeTime || null,
        hibernation_show_return_date: hibernationShowReturnDate,
        hibernation_allow_notifications: hibernationAllowNotifications,
        hibernation_show_contact_info: hibernationShowContactInfo,
        cancellation_policy: cancellationPolicy || null,
      });

      if (result.success) {
        setSuccess('Booking page settings saved successfully');
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save booking page settings');
      }
    });
  };

  const inputClassName = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500";
  const labelClassName = "block text-sm font-medium text-slate-600 mb-1.5";
  const sectionClassName = "rounded-xl border border-slate-200 bg-white p-6";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}

      {/* Booking Link */}
      {initialProfile?.id && (
        <BookingLinkCard captainId={initialProfile.id} />
      )}

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

      {/* Save Button for Booking Page settings */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {hasChanges && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            Unsaved changes
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="group flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-75 hover:bg-cyan-500 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            boxShadow: hasChanges ? '0 4px 14px rgba(34, 211, 238, 0.25)' : undefined,
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? 'Saving...' : 'Save Booking Page Settings'}
        </button>
      </div>

      {/* Promo Codes Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Promo Codes</h2>
        </div>
        <PromoCodesClient
          tripTypes={tripTypes.map(tt => ({ id: tt.id, title: tt.title }))}
        />
      </section>

      {/* Referral Program Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Referral Program</h2>
        </div>
        <ReferralProgramClient />
      </section>
    </div>
  );
}
