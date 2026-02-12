'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { BookingWithDetails } from '@/lib/db/types';

interface GuestInfoSectionProps {
  booking: BookingWithDetails;
  guestToken: { token: string; expires_at: string } | null;
}

export function GuestInfoSection({ booking, guestToken }: GuestInfoSectionProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Your ${booking.trip_type?.title || 'Charter'} Booking`);
    window.location.href = `mailto:${booking.guest_email}?subject=${subject}`;
  };

  const handleCall = () => {
    if (booking.guest_phone) {
      window.location.href = `tel:${booking.guest_phone}`;
    }
  };

  const handleSMS = () => {
    if (booking.guest_phone) {
      window.location.href = `sms:${booking.guest_phone}`;
    }
  };

  const guestPortalUrl = guestToken
    ? `${window.location.origin}/manage/${guestToken.token}`
    : null;

  return (
    <section
      aria-label="Guest Information"
      className="rounded-lg border border-slate-200 bg-white p-6 print:border-slate-300 print:bg-white"
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-cyan-600 print:text-cyan-600">
        <User className="h-5 w-5" />
        Guest Information
      </h2>

      <div className="space-y-4">
        {/* Primary Contact */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 print:border-slate-300 print:bg-slate-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Primary Contact
            </span>
            {guestPortalUrl && (
              <a
                href={guestPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-600 hover:underline print:hidden"
              >
                <ExternalLink className="h-3 w-3" />
                Guest Portal
              </a>
            )}
          </div>

          {/* Guest Name */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-800 print:text-black">
              {booking.guest_name}
            </h3>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <a
                  href={`mailto:${booking.guest_email}`}
                  className="text-slate-600 hover:text-cyan-600 hover:underline print:text-slate-700"
                >
                  {booking.guest_email}
                </a>
              </div>
              <div className="flex items-center gap-1 print:hidden">
                <button
                  onClick={() => handleCopy(booking.guest_email, 'email')}
                  className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-slate-700"
                  title="Copy email"
                >
                  {copiedField === 'email' ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleEmail}
                  className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-cyan-600"
                  title="Send email"
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Phone */}
            {booking.guest_phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <a
                    href={`tel:${booking.guest_phone}`}
                    className="text-slate-600 hover:text-cyan-600 hover:underline print:text-slate-700"
                  >
                    {booking.guest_phone}
                  </a>
                </div>
                <div className="flex items-center gap-1 print:hidden">
                  <button
                    onClick={() => handleCopy(booking.guest_phone!, 'phone')}
                    className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-slate-700"
                    title="Copy phone"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCall}
                    className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-emerald-600"
                    title="Call"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSMS}
                    className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-blue-600"
                    title="Send SMS"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Booking Created */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-slate-50">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              <Calendar className="h-3 w-3" />
              Booked On
            </div>
            <div className="text-slate-700 print:text-slate-800">
              {format(parseISO(booking.created_at), 'MMMM d, yyyy')}
            </div>
            <div className="text-sm text-slate-400">
              {format(parseISO(booking.created_at), 'h:mm a')}
            </div>
          </div>

          {/* Party Size */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-slate-50">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              <User className="h-3 w-3" />
              Party Size
            </div>
            <div className="text-slate-700 print:text-slate-800">
              {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
            </div>
            {booking.guest_count_confirmed && booking.guest_count_confirmed !== booking.party_size && (
              <div className="text-sm text-amber-600">
                Confirmed: {booking.guest_count_confirmed}
              </div>
            )}
          </div>
        </div>

        {/* Special Requests */}
        {booking.special_requests && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-slate-50">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Special Requests
            </div>
            <p className="whitespace-pre-wrap text-slate-600 print:text-slate-700">
              {booking.special_requests}
            </p>
          </div>
        )}

        {/* Captain Instructions */}
        {booking.captain_instructions && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-50 p-4 print:border-cyan-300 print:bg-cyan-50">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-cyan-600">
              Captain Instructions
            </div>
            <p className="whitespace-pre-wrap text-cyan-800 print:text-cyan-800">
              {booking.captain_instructions}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
