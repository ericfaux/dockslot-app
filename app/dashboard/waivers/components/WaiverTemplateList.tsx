'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  FileSignature,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toggleWaiverTemplate, deleteWaiverTemplate } from '@/app/actions/waivers';

interface WaiverTemplate {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  templates: WaiverTemplate[];
}

export function WaiverTemplateList({ templates: initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: 'toggle' | 'delete';
  } | null>(null);

  const handleToggle = async (id: string) => {
    setPendingAction({ id, action: 'toggle' });

    startTransition(async () => {
      const result = await toggleWaiverTemplate(id);

      if (result.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, is_active: !t.is_active } : t
          )
        );
      }

      setPendingAction(null);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will permanently delete the waiver template.')) {
      return;
    }

    setPendingAction({ id, action: 'delete' });

    startTransition(async () => {
      const result = await deleteWaiverTemplate(id);

      if (result.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }

      setPendingAction(null);
    });
  };

  const isPendingFor = (id: string, action: 'toggle' | 'delete') => {
    return isPending && pendingAction?.id === id && pendingAction?.action === action;
  };

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
        <FileSignature className="mx-auto h-12 w-12 text-slate-500" />
        <h3 className="mt-4 text-lg font-medium text-white">No waiver templates yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Create your first waiver template to require passengers to sign before their trip.
        </p>
        <Link
          href="/dashboard/waivers/new"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-cyan-400"
        >
          <FileSignature className="h-4 w-4" />
          Create Waiver Template
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className={`rounded-lg border transition-colors ${
            template.is_active
              ? 'border-cyan-500/30 bg-cyan-500/5'
              : 'border-slate-700 bg-slate-800'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Template Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {template.title}
                  </h3>
                  {template.is_active && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  {!template.is_active && (
                    <span className="flex items-center gap-1 rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
                  <span>
                    Created {format(parseISO(template.created_at), 'MMM d, yyyy')}
                  </span>
                  <span className="line-clamp-1">
                    {template.content.substring(0, 100)}...
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Toggle Active */}
                <button
                  onClick={() => handleToggle(template.id)}
                  disabled={isPendingFor(template.id, 'toggle')}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-700 disabled:opacity-50"
                  title={template.is_active ? 'Deactivate' : 'Activate'}
                >
                  {isPendingFor(template.id, 'toggle') ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : template.is_active ? (
                    <ToggleRight className="h-4 w-4 text-green-400" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {/* Preview */}
                <Link
                  href={`/dashboard/waivers/${template.id}/preview`}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                </Link>

                {/* Edit */}
                <Link
                  href={`/dashboard/waivers/${template.id}/edit`}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <Edit className="h-4 w-4" />
                </Link>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(template.id)}
                  disabled={isPendingFor(template.id, 'delete')}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-rose-400 disabled:opacity-50"
                >
                  {isPendingFor(template.id, 'delete') ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
