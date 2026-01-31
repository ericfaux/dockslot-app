'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X } from 'lucide-react';
import { createWaiverTemplate, updateWaiverTemplate } from '@/app/actions/waivers';

interface Props {
  template?: {
    id: string;
    title: string;
    content: string;
    requires_initials: boolean;
    is_active: boolean;
  };
}

export function WaiverTemplateForm({ template }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: template?.title || '',
    content: template?.content || '',
    is_active: template?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = template
        ? await updateWaiverTemplate(template.id, formData)
        : await createWaiverTemplate(formData);

      if (result.success) {
        router.push('/dashboard/waivers');
        router.refresh();
      } else {
        setError(result.error || 'Failed to save template');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-slate-300">
            Template Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Standard Liability Waiver"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            required
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-slate-300">
            Waiver Content <span className="text-rose-400">*</span>
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Enter the full waiver text that passengers will read and sign..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-sm"
            rows={16}
            required
          />
          <p className="text-xs text-slate-500">
            This text will be displayed to passengers before they sign. Include all liability releases, acknowledgments, and terms.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm font-medium text-slate-300">
              Active (require for all new bookings)
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-400">
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-2 font-medium text-slate-900 transition-colors hover:bg-cyan-400 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {template ? 'Update Template' : 'Create Template'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/waivers')}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-2 font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
