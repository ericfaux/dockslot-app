'use client';

import { useState, useTransition } from 'react';
import {
  X,
  Check,
  Copy,
  Loader2,
  DollarSign,
  Percent,
  Mail,
  Tag,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { createPromoCode } from '@/app/actions/promo-codes';

interface TripTypeOption {
  id: string;
  title: string;
}

interface OfferDiscountModalProps {
  guest: {
    name: string;
    email: string;
  };
  tripTypes: TripTypeOption[];
  onClose: () => void;
}

const PRESET_PERCENTAGES = [10, 15, 20, 25];

export function OfferDiscountModal({ guest, tripTypes, onClose }: OfferDiscountModalProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [customValue, setCustomValue] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedTripTypes, setSelectedTripTypes] = useState<string[]>([]);
  const [personalMessage, setPersonalMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [discountResult, setDiscountResult] = useState<{ code: string } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  function handlePresetClick(value: number) {
    setDiscountValue(String(value));
    setCustomValue(false);
  }

  function handleCustomClick() {
    setCustomValue(true);
    setDiscountValue('');
  }

  function toggleTripType(id: string) {
    setSelectedTripTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function generateCode(): string {
    const guestPart = guest.name
      .split(' ')[0]
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 8);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GUEST-${guestPart}-${suffix}`;
  }

  function handleCreate() {
    const value = parseInt(discountValue, 10);
    if (!value || value < 1) {
      setDiscountError('Please enter a valid discount value');
      return;
    }
    if (discountType === 'percentage' && value > 100) {
      setDiscountError('Percentage cannot exceed 100%');
      return;
    }
    setDiscountError(null);

    const code = generateCode();

    startTransition(async () => {
      const discountVal = discountType === 'fixed' ? value * 100 : value;
      const result = await createPromoCode({
        code,
        discount_type: discountType,
        discount_value: discountVal,
        valid_to: expirationDate || null,
        max_uses: 1,
        trip_type_ids: selectedTripTypes.length > 0 ? selectedTripTypes : [],
      });
      if (result.success) {
        setDiscountResult({ code });
      } else {
        setDiscountError(result.error || 'Failed to create promo code');
      }
    });
  }

  async function handleCopyCode() {
    if (!discountResult) return;
    try {
      await navigator.clipboard.writeText(discountResult.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      /* silent */
    }
  }

  function buildMailtoHref(): string {
    if (!discountResult) return '';
    const subject = 'A special discount just for you!';
    const messageLines = [
      `Hi ${guest.name},`,
      '',
      personalMessage || 'As a valued guest, we\'d like to offer you a special discount on your next booking!',
      '',
      `Your promo code: ${discountResult.code}`,
      `Discount: ${discountType === 'percentage' ? `${discountValue}% off` : `$${discountValue} off`}`,
      expirationDate ? `Valid until: ${new Date(expirationDate + 'T00:00:00').toLocaleDateString()}` : '',
      '',
      'Use this code when booking your next trip!',
    ].filter(Boolean).join('\n');
    return `mailto:${encodeURIComponent(guest.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageLines)}`;
  }

  // Minimum date for expiration: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="pointer-events-auto w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Tag className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Offer Discount</h3>
                <p className="text-sm text-slate-400">
                  Create a promo code for {guest.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
            {discountResult ? (
              /* Success state */
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <Check className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-2 text-sm font-medium text-emerald-800">
                    Promo code created!
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <code className="rounded border border-emerald-200 bg-white px-3 py-1.5 text-lg font-bold text-slate-900">
                      {discountResult.code}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      {codeCopied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-emerald-600">
                    {discountType === 'percentage'
                      ? `${discountValue}% off`
                      : `$${discountValue} off`}
                    {expirationDate &&
                      ` · Expires ${new Date(expirationDate + 'T00:00:00').toLocaleDateString()}`}
                  </p>
                </div>

                <p className="text-center text-sm text-slate-500">
                  Share this code with {guest.name} via email
                </p>

                <div className="flex gap-2">
                  <a
                    href={buildMailtoHref()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
                  >
                    <Mail className="h-4 w-4" />
                    Send Discount
                  </a>
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Form state */
              <div className="space-y-4">
                {discountError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {discountError}
                  </div>
                )}

                {/* Discount type toggle */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Discount type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDiscountType('percentage');
                        setDiscountValue('10');
                        setCustomValue(false);
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        discountType === 'percentage'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Percent className="mr-1.5 inline h-3.5 w-3.5" />
                      Percentage
                    </button>
                    <button
                      onClick={() => {
                        setDiscountType('fixed');
                        setCustomValue(true);
                        setDiscountValue('');
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        discountType === 'fixed'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <DollarSign className="mr-1.5 inline h-3.5 w-3.5" />
                      Fixed Amount
                    </button>
                  </div>
                </div>

                {/* Discount value - presets for percentage */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {discountType === 'percentage' ? 'Percentage off' : 'Amount off ($)'}
                  </label>
                  {discountType === 'percentage' && (
                    <div className="mb-2 flex gap-2">
                      {PRESET_PERCENTAGES.map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handlePresetClick(pct)}
                          className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                            !customValue && discountValue === String(pct)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                      <button
                        onClick={handleCustomClick}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                          customValue
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  )}
                  {(customValue || discountType === 'fixed') && (
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={discountType === 'percentage' ? 100 : 99999}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                        autoFocus
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        {discountType === 'percentage' ? '%' : 'USD'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expiration date */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Calendar className="h-3.5 w-3.5" />
                    Expiration date
                    <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Applicable trip types */}
                {tripTypes.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Applicable trip types
                      <span className="ml-1 text-slate-400">(leave empty for all)</span>
                    </label>
                    <div className="space-y-1.5 rounded-lg border border-slate-200 p-3">
                      {tripTypes.map((trip) => (
                        <label
                          key={trip.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1 transition-colors hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTripTypes.includes(trip.id)}
                            onChange={() => toggleTripType(trip.id)}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className="text-sm text-slate-700">{trip.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal message */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Personal message
                    <span className="text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Add a personal note to include in the email..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer - only show in form state */}
          {!discountResult && (
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-6">
              <button
                onClick={onClose}
                disabled={isPending}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4" />
                )}
                {isPending ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
