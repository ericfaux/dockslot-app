import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { WaiverTemplateList } from './components/WaiverTemplateList';
import { FileSignature, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function WaiversPage() {
  const { user, supabase } = await requireAuth()

  // Fetch captain's waiver templates
  const { data: templates } = await supabase
    .from('waiver_templates')
    .select('*')
    .eq('owner_id', user.id)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Waiver Templates</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage liability waivers for your passengers
          </p>
        </div>
        <Link
          href="/dashboard/waivers/new"
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900 transition-colors hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
              <FileSignature className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {templates?.length || 0}
              </p>
              <p className="text-sm text-slate-400">Total Templates</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <FileSignature className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {templates?.filter((t) => t.is_active).length || 0}
              </p>
              <p className="text-sm text-slate-400">Active</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-500/20">
              <FileSignature className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {templates?.filter((t) => !t.is_active).length || 0}
              </p>
              <p className="text-sm text-slate-400">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Template List */}
      <WaiverTemplateList templates={templates || []} />
    </div>
  );
}
