'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  AlertTriangle,
  Loader2,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { RescheduleOffer } from '@/lib/db/types';

interface RescheduleOffersProps {
  bookingId: string;
  weatherHoldReason?: string | null;
  onConfirmReschedule?: (offerId: string) => Promise<void>;
  guestToken?: string;
}

type OfferStatus = 'pending' | 'selected' | 'expired';

function getOfferStatus(offer: RescheduleOffer): OfferStatus {
  if (offer.is_selected) return 'selected';
  if (offer.expires_at && isBefore(new Date(offer.expires_at), new Date())) {
    return 'expired';
  }
  return 'pending';
}

function formatTime12(isoString: string): string {
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return '';
  }
}

function formatDate(isoString: string): string {
  try {
    return format(parseISO(isoString), 'EEEE, MMMM d');
  } catch {
    return '';
  }
}

export function RescheduleOffers({
  bookingId,
  weatherHoldReason,
  onConfirmReschedule,
  guestToken,
}: RescheduleOffersProps) {
  const [offers, setOffers] = useState<RescheduleOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/bookings/${bookingId}/reschedule-offers`);
        if (!response.ok) {
          throw new Error('Failed to load reschedule offers');
        }
        const data = await response.json();
        setOffers(data.offers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load offers');
      } finally {
        setIsLoading(false);
      }
    }

    loadOffers();
  }, [bookingId]);

  const handleConfirm = async (offerId: string) => {
    if (!onConfirmReschedule) return;

    setConfirmingId(offerId);
    try {
      await onConfirmReschedule(offerId);
    } finally {
      setConfirmingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading reschedule offers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-sm text-slate-400 text-center">
          No reschedule offers have been created yet.
        </p>
      </div>
    );
  }

  const selectedOffer = offers.find(o => o.is_selected);
  const pendingOffers = offers.filter(o => getOfferStatus(o) === 'pending');
  const hasExpiredOffers = offers.some(o => getOfferStatus(o) === 'expired');

  return (
    <div className="space-y-4">
      {/* Weather Reason */}
      {weatherHoldReason && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-300 italic">
            &ldquo;{weatherHoldReason}&rdquo;
          </p>
        </div>
      )}

      {/* Selected Offer */}
      {selectedOffer && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="font-medium text-emerald-300">Guest Selected New Date</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-white font-medium">
              {formatDate(selectedOffer.proposed_start)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-300">
              {formatTime12(selectedOffer.proposed_start)} - {formatTime12(selectedOffer.proposed_end)}
            </span>
          </div>
        </div>
      )}

      {/* Pending Offers */}
      {pendingOffers.length > 0 && !selectedOffer && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Hourglass className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Awaiting Guest Response
            </span>
          </div>

          {pendingOffers.map((offer, index) => (
            <div
              key={offer.id}
              className="flex items-center justify-between rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {formatDate(offer.proposed_start)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatTime12(offer.proposed_start)} - {formatTime12(offer.proposed_end)}
                  </p>
                </div>
              </div>
              {offer.expires_at && (
                <div className="text-xs text-slate-500">
                  Expires {format(parseISO(offer.expires_at), 'MMM d')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* All Offers List (when one is selected) */}
      {selectedOffer && offers.length > 1 && (
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Other Offers
          </span>
          {offers.filter(o => !o.is_selected).map((offer) => {
            const status = getOfferStatus(offer);
            return (
              <div
                key={offer.id}
                className={`flex items-center justify-between rounded-lg border p-2.5 ${
                  status === 'expired'
                    ? 'border-slate-700 bg-slate-800/30 opacity-60'
                    : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {status === 'expired' ? (
                    <XCircle className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={`text-sm ${status === 'expired' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                    {formatDate(offer.proposed_start)} at {formatTime12(offer.proposed_start)}
                  </span>
                </div>
                {status === 'expired' && (
                  <span className="text-xs text-slate-500">Expired</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Expired Warning */}
      {hasExpiredOffers && !selectedOffer && pendingOffers.length === 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">All reschedule offers have expired</span>
          </div>
          <p className="text-xs text-amber-400/70 mt-1">
            Consider creating new offers or contacting the guest directly.
          </p>
        </div>
      )}

      {/* Guest Link */}
      {guestToken && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium">Guest Reschedule Link</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-slate-900 rounded px-2 py-1.5 text-cyan-400 truncate">
              /reschedule/{guestToken}
            </code>
            <button
              onClick={() => {
                const url = `${window.location.origin}/reschedule/${guestToken}`;
                navigator.clipboard.writeText(url);
              }}
              className="rounded px-2 py-1.5 text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
