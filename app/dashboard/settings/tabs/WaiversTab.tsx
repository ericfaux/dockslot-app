'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileSignature, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { WaiverTemplateList } from '@/app/dashboard/waivers/components/WaiverTemplateList';
import { toggleWaiversEnabled } from '@/app/actions/waivers';
import type { WaiverTemplate } from '../components/SettingsTabs';

interface WaiversTabProps {
  initialTemplates: WaiverTemplate[];
  waiversEnabled: boolean;
}

export function WaiversTab({ initialTemplates, waiversEnabled }: WaiversTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(waiversEnabled);
  const activeCount = initialTemplates.filter((t) => t.is_active).length;
  const inactiveCount = initialTemplates.filter((t) => !t.is_active).length;

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    startTransition(async () => {
      const result = await toggleWaiversEnabled(newValue);
      if (!result.success) {
        setEnabled(!newValue);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Manage liability waivers for your passengers.
        </p>
        <Link
          href="/dashboard/waivers/new"
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white transition-colors hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      {/* Waivers Enabled Toggle */}
      <div className={`rounded-xl border p-5 ${
        enabled
          ? 'border-cyan-200 bg-cyan-50'
          : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              enabled ? 'bg-cyan-100' : 'bg-slate-100'
            }`}>
              <FileSignature className={`h-5 w-5 ${enabled ? 'text-cyan-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Require Waivers for Bookings
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {enabled
                  ? 'Guests will be required to sign active waivers before their trip.'
                  : 'Waivers are not currently required. Guests can book without signing waivers.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className="relative flex-shrink-0 ml-4"
            aria-label={enabled ? 'Disable waivers' : 'Enable waivers'}
          >
            {isPending ? (
              <div className="flex h-6 w-11 items-center justify-center rounded-full bg-slate-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="relative">
                <div
                  className={`h-6 w-11 rounded-full transition-colors ${
                    enabled ? 'bg-cyan-500' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Warning when ON but no active templates */}
        {enabled && activeCount === 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-700">
              You need at least one active waiver template. Create one below or choose from our standard templates.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
              <FileSignature className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {initialTemplates.length}
              </p>
              <p className="text-sm text-slate-400">Total Templates</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <FileSignature className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
              <p className="text-sm text-slate-400">Active</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-500/20">
              <FileSignature className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{inactiveCount}</p>
              <p className="text-sm text-slate-400">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Template List */}
      <WaiverTemplateList templates={initialTemplates} />
    </div>
  );
}
