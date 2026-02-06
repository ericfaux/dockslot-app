'use client';

import Link from 'next/link';
import { FileSignature, Plus } from 'lucide-react';
import { WaiverTemplateList } from '@/app/dashboard/waivers/components/WaiverTemplateList';
import type { WaiverTemplate } from '../components/SettingsTabs';

interface WaiversTabProps {
  initialTemplates: WaiverTemplate[];
}

export function WaiversTab({ initialTemplates }: WaiversTabProps) {
  const activeCount = initialTemplates.filter((t) => t.is_active).length;
  const inactiveCount = initialTemplates.filter((t) => !t.is_active).length;

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
