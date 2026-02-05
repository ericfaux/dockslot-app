'use client';

import { useState } from 'react';
import { Moon, Calendar, Bell, Mail, Phone, Loader2, Check, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { HibernationInfo } from '@/app/actions/public-booking';
import { subscribeToHibernationNotifications } from '@/app/actions/hibernation-subscribers';

interface HibernationPageProps {
  info: HibernationInfo;
}

export function HibernationPage({ info }: HibernationPageProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = info.business_name || info.full_name || 'This Captain';

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await subscribeToHibernationNotifications(info.id, email, name || null);

      if (result.success) {
        setSubscribed(true);
      } else {
        setError(result.error || 'Failed to subscribe');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedReturnDate = info.hibernation_end_date
    ? format(parseISO(info.hibernation_end_date), 'MMMM d, yyyy')
    : null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-8 text-center">
          {/* Moon Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
              <Moon className="h-10 w-10 text-amber-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Taking a Break
          </h1>

          {/* Business Name */}
          <p className="text-lg text-slate-300 mb-4">
            {displayName} is taking a break for the off-season.
          </p>

          {/* Custom Message */}
          {info.hibernation_message && (
            <div className="rounded-lg bg-slate-800/50 p-4 mb-6">
              <p className="text-slate-300 italic">
                &ldquo;{info.hibernation_message}&rdquo;
              </p>
            </div>
          )}

          {/* Return Date */}
          {formattedReturnDate && (
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-6">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">We&apos;ll be back on {formattedReturnDate}!</span>
            </div>
          )}

          {/* Notification Signup */}
          {info.hibernation_allow_notifications && !subscribed && (
            <div className="border-t border-slate-700 pt-6 mt-6">
              <div className="flex items-center justify-center gap-2 text-slate-300 mb-4">
                <Bell className="h-5 w-5" />
                <span>Get notified when we&apos;re back</span>
              </div>

              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />

                {error && (
                  <div className="flex items-center gap-2 text-rose-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-medium text-slate-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="h-5 w-5" />
                      <span>Notify Me</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-slate-500 mt-3">
                We&apos;ll only send you one email when bookings reopen.
              </p>
            </div>
          )}

          {/* Subscribed Confirmation */}
          {subscribed && (
            <div className="border-t border-slate-700 pt-6 mt-6">
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                <Check className="h-5 w-5" />
                <span className="font-medium">You&apos;re all set!</span>
              </div>
              <p className="text-slate-400 text-sm">
                We&apos;ll email you when {displayName} starts accepting bookings again.
              </p>
            </div>
          )}

          {/* Contact Info */}
          {info.hibernation_show_contact_info && (info.email || info.phone) && (
            <div className="border-t border-slate-700 pt-6 mt-6">
              <p className="text-sm text-slate-400 mb-3">
                Need to reach us during the off-season?
              </p>
              <div className="flex flex-col gap-2">
                {info.email && (
                  <a
                    href={`mailto:${info.email}`}
                    className="flex items-center justify-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{info.email}</span>
                  </a>
                )}
                {info.phone && (
                  <a
                    href={`tel:${info.phone}`}
                    className="flex items-center justify-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{info.phone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Powered by DockSlot
        </p>
      </div>
    </div>
  );
}
