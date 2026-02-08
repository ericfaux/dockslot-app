'use client';

import { useState, useTransition } from 'react';
import { PaymentsClient } from '@/app/dashboard/payments/PaymentsClient';
import { updateProfile } from '@/app/actions/profile';
import { Profile } from '@/lib/db/types';
import {
  Loader2,
  Save,
  Smartphone,
  Building2,
  Eye,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface PaymentsTabProps {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  businessName: string;
  email: string;
  profile: Profile | null;
}

export function PaymentsTab(props: PaymentsTabProps) {
  const [isPending, startTransition] = useTransition();
  const [venmoEnabled, setVenmoEnabled] = useState(props.profile?.venmo_enabled ?? false);
  const [venmoUsername, setVenmoUsername] = useState(props.profile?.venmo_username ?? '');
  const [zelleEnabled, setZelleEnabled] = useState(props.profile?.zelle_enabled ?? false);
  const [zelleContact, setZelleContact] = useState(props.profile?.zelle_contact ?? '');
  const [autoConfirm, setAutoConfirm] = useState(props.profile?.auto_confirm_manual_payments ?? true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSavePaymentMethods = () => {
    setSaveSuccess(false);
    setSaveError(null);

    startTransition(async () => {
      const result = await updateProfile({
        venmo_enabled: venmoEnabled,
        venmo_username: venmoUsername || null,
        zelle_enabled: zelleEnabled,
        zelle_contact: zelleContact || null,
        auto_confirm_manual_payments: autoConfirm,
      });

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.error || 'Failed to save');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Stripe Integration */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Card Payments (Stripe)</h3>
        <p className="text-sm text-slate-400 mb-4">
          Connect your Stripe account to accept deposits and payments from guests.
        </p>
        <PaymentsClient
          stripeAccountId={props.stripeAccountId}
          stripeOnboardingComplete={props.stripeOnboardingComplete}
          businessName={props.businessName}
          email={props.email}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Alternative Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Alternative Payment Methods</h3>
        <p className="text-sm text-slate-400 mb-6">
          Accept Venmo and Zelle payments. Guests send payment outside of DockSlot, then you manually confirm receipt.
        </p>

        <div className="space-y-6">
          {/* Venmo */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Venmo</h4>
                  <p className="text-xs text-slate-500">Accept payments via Venmo</p>
                </div>
              </div>
              <button
                onClick={() => setVenmoEnabled(!venmoEnabled)}
                className="flex items-center gap-2"
              >
                {venmoEnabled ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-slate-300" />
                )}
              </button>
            </div>

            {venmoEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Venmo Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                    <input
                      type="text"
                      value={venmoUsername.replace(/^@/, '')}
                      onChange={(e) => setVenmoUsername(e.target.value.replace(/^@/, ''))}
                      placeholder="CaptainEric"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Your Venmo username without the @ symbol
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Zelle */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Zelle</h4>
                  <p className="text-xs text-slate-500">Accept payments via Zelle</p>
                </div>
              </div>
              <button
                onClick={() => setZelleEnabled(!zelleEnabled)}
                className="flex items-center gap-2"
              >
                {zelleEnabled ? (
                  <ToggleRight className="h-8 w-8 text-purple-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-slate-300" />
                )}
              </button>
            </div>

            {zelleEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Zelle Email or Phone
                  </label>
                  <input
                    type="text"
                    value={zelleContact}
                    onChange={(e) => setZelleContact(e.target.value)}
                    placeholder="captain@email.com or (555) 123-4567"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    The email or phone number linked to your Zelle account
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Auto-confirm toggle */}
          {(venmoEnabled || zelleEnabled) && (
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h4 className="font-medium text-slate-900">Auto-confirm Venmo/Zelle bookings</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {autoConfirm
                      ? 'Bookings are immediately confirmed (trusting the guest). You can verify payment later.'
                      : 'Bookings stay in "Awaiting Deposit" until you manually confirm payment receipt.'}
                  </p>
                </div>
                <button
                  onClick={() => setAutoConfirm(!autoConfirm)}
                  className="flex-shrink-0"
                >
                  {autoConfirm ? (
                    <ToggleRight className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-slate-300" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Guest Preview */}
          {(venmoEnabled || zelleEnabled) && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-slate-500" />
                <h4 className="text-sm font-medium text-slate-700">Guest Preview</h4>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                This is what guests will see when choosing a payment method.
              </p>

              <div className="space-y-3">
                {venmoEnabled && venmoUsername && (
                  <div className="rounded-lg border border-blue-200 bg-white p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Pay with Venmo</p>
                        <p className="text-xs text-slate-500">Send to @{venmoUsername.replace(/^@/, '')}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      Guest sends payment via Venmo, then confirms on DockSlot.
                    </div>
                  </div>
                )}

                {zelleEnabled && zelleContact && (
                  <div className="rounded-lg border border-purple-200 bg-white p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                        <Building2 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Pay with Zelle</p>
                        <p className="text-xs text-slate-500">Send to {zelleContact}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      Guest sends payment via their banking app, then confirms on DockSlot.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSavePaymentMethods}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Payment Methods
            </button>

            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Saved!
              </span>
            )}

            {saveError && (
              <span className="flex items-center gap-1 text-sm text-rose-600">
                <AlertCircle className="h-4 w-4" />
                {saveError}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
