'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  AlertCircle,
  Anchor,
} from 'lucide-react';
import { BookingWithDetails, Passenger, WaiverSignature, Payment, BookingLog } from '@/lib/db/types';
import StatusBadge from '@/app/dashboard/components/StatusBadge';
import { BookingHeader } from './components/BookingHeader';
import { GuestInfoSection } from './components/GuestInfoSection';
import { PaymentTimeline } from './components/PaymentTimeline';
import { PassengerManifest } from './components/PassengerManifest';
import { ActivityLog } from './components/ActivityLog';
import { NotesSection } from './components/NotesSection';

interface WaiverSignatureWithTemplate extends WaiverSignature {
  waiver_template: {
    id: string;
    title: string;
    version: number;
  } | null;
}

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_fields: string[] | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}

interface BookingDetails {
  booking: BookingWithDetails;
  passengers: Passenger[];
  waiverSignatures: WaiverSignatureWithTemplate[];
  activeWaiverTemplate: { id: string; title: string; version: number } | null;
  payments: Payment[];
  logs: BookingLog[];
  auditLogs: AuditLog[];
  guestToken: { token: string; expires_at: string } | null;
}

interface BookingDetailClientProps {
  bookingId: string;
  initialBooking: BookingWithDetails;
}

export function BookingDetailClient({ bookingId, initialBooking }: BookingDetailClientProps) {
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      const data = await response.json();
      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    fetchDetails();
  };

  // Use initial booking while loading full details
  const booking = details?.booking || initialBooking;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-6">
        <div className="flex items-center justify-between border-b border-slate-300 pb-4">
          <div className="flex items-center gap-2">
            <Anchor className="h-6 w-6" />
            <span className="text-xl font-bold">Captain&apos;s Logbook</span>
          </div>
          <div className="text-right text-sm">
            <div>Booking #{bookingId.slice(0, 8)}</div>
            <div>Printed: {format(new Date(), 'MMM d, yyyy h:mm a')}</div>
          </div>
        </div>
      </div>

      {/* Page Header - Hidden when printing */}
      <section aria-label="Page Header" className="print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Bookings
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
                  Captain&apos;s Logbook
                </span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Booking #{bookingId.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700/50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700/50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Booking Header */}
      <BookingHeader
        booking={booking}
        onRefresh={handleRefresh}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3 print:grid-cols-1">
        {/* Left Column - 2/3 width */}
        <div className="space-y-6 lg:col-span-2 print:space-y-4">
          {/* Guest Information */}
          <GuestInfoSection
            booking={booking}
            guestToken={details?.guestToken || null}
          />

          {/* Payment Timeline */}
          <PaymentTimeline
            booking={booking}
            payments={details?.payments || []}
            isLoading={isLoading && !details}
            onRefresh={handleRefresh}
          />

          {/* Passenger Manifest */}
          <PassengerManifest
            bookingId={bookingId}
            passengers={details?.passengers || []}
            waiverSignatures={details?.waiverSignatures || []}
            activeWaiverTemplate={details?.activeWaiverTemplate || null}
            guestToken={details?.guestToken || null}
            partySize={booking.party_size}
            isLoading={isLoading && !details}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6 print:space-y-4">
          {/* Notes Section */}
          <NotesSection
            bookingId={bookingId}
            initialNotes={booking.internal_notes}
            initialTags={booking.tags || []}
            specialRequests={booking.special_requests}
            onUpdate={handleRefresh}
          />

          {/* Activity Log */}
          <ActivityLog
            logs={details?.logs || []}
            auditLogs={details?.auditLogs || []}
            isLoading={isLoading && !details}
          />
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block print:mt-8 print:border-t print:border-slate-300 print:pt-4">
        <p className="text-center text-xs text-slate-500">
          This document is for informational purposes. Generated by DockSlot.
        </p>
      </div>

      {/* Bottom Accent Bar - Hidden when printing */}
      <div
        className="mx-auto h-1 w-32 rounded-full print:hidden"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)',
        }}
      />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 12px !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:grid-cols-1 {
            grid-template-columns: 1fr !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:mt-8 {
            margin-top: 2rem !important;
          }
          .print\\:border-t {
            border-top-width: 1px !important;
          }
          .print\\:border-slate-300 {
            border-color: #cbd5e1 !important;
          }
          .print\\:pt-4 {
            padding-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
