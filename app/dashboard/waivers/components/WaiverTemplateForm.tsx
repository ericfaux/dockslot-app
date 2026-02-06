'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  X,
  Eye,
  Edit3,
  Plus,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { createWaiverTemplate, updateWaiverTemplate } from '@/app/actions/waivers';
import { WAIVER_VARIABLES, substituteWaiverVariables, validateVariables } from '@/lib/utils/waiver-variables';
import { WaiverDocument } from '@/app/waivers/components/WaiverDocument';

interface Props {
  template?: {
    id: string;
    title: string;
    content: string;
    requires_initials: boolean;
    is_active: boolean;
    version: number;
  };
}

export function WaiverTemplateForm({ template }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    title: template?.title || '',
    content: template?.content || '',
    is_active: template?.is_active ?? true,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);

  // Validate variables in content
  const variableValidation = validateVariables(formData.content);

  // Sample context for preview
  const previewContext = {
    guestName: 'John Smith',
    passengerName: 'Jane Doe',
    tripDate: new Date().toISOString(),
    captainName: 'Captain Mike',
    vesselName: 'Sea Breeze',
    tripType: 'Half-Day Fishing Charter',
    partySize: 4,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Warn about unknown variables but don't block
    if (!variableValidation.valid) {
      const proceed = confirm(
        `Warning: The following variables are not recognized and will appear as-is:\n${variableValidation.unknown.join(', ')}\n\nDo you want to continue?`
      );
      if (!proceed) return;
    }

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

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const newContent = text.substring(0, start) + variable + text.substring(end);

    setFormData({ ...formData, content: newContent });

    // Restore cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Field */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-slate-600">
            Template Title <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Standard Liability Waiver"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            required
          />
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="content" className="block text-sm font-medium text-slate-600">
              Waiver Content <span className="text-rose-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVariables(!showVariables)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  showVariables
                    ? 'bg-cyan-50 text-cyan-600'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Plus className="h-3 w-3" />
                Variables
                {showVariables ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  showFormattingHelp
                    ? 'bg-cyan-50 text-cyan-600'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="h-3 w-3" />
                Formatting
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  showPreview
                    ? 'bg-cyan-50 text-cyan-600'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {showPreview ? (
                  <>
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    Preview
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Variables Panel */}
          {showVariables && (
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
              <p className="text-xs text-slate-400">
                Click to insert variables that will be replaced with actual values when guests view the waiver:
              </p>
              <div className="flex flex-wrap gap-2">
                {WAIVER_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="group relative px-2 py-1 text-xs font-mono bg-white text-cyan-600 rounded border border-slate-300 hover:border-cyan-500 hover:bg-slate-100 transition-colors"
                    title={`${v.description} - Example: ${v.example}`}
                  >
                    {v.key}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {v.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formatting Help */}
          {showFormattingHelp && (
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2 text-xs text-slate-400">
              <p className="font-medium text-slate-600">Formatting Tips:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li><code className="text-cyan-600"># Heading</code> - Main heading</li>
                <li><code className="text-cyan-600">## Subheading</code> - Secondary heading</li>
                <li><code className="text-cyan-600">### Section</code> - Section heading</li>
                <li><code className="text-cyan-600">- Item</code> - Bullet point</li>
                <li><code className="text-cyan-600">1. Item</code> - Numbered list</li>
                <li><code className="text-cyan-600">**bold**</code> - <strong>Bold text</strong></li>
                <li><code className="text-cyan-600">*italic*</code> - <em>Italic text</em></li>
                <li>Use blank lines to separate paragraphs</li>
              </ul>
            </div>
          )}

          {/* Variable Validation Warning */}
          {!variableValidation.valid && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-500/30">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-600">
                <p className="font-medium">Unknown variables detected:</p>
                <p className="font-mono">{variableValidation.unknown.join(', ')}</p>
                <p className="mt-1 text-amber-600/80">These will appear as-is in the signed waiver.</p>
              </div>
            </div>
          )}

          {/* Editor / Preview Toggle */}
          {showPreview ? (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-100 border-b border-slate-200">
                <span className="text-xs font-medium text-slate-400">Preview Mode</span>
                <span className="ml-2 text-xs text-slate-500">(with sample data)</span>
              </div>
              <div className="bg-white">
                <WaiverDocument
                  title={formData.title || 'Untitled Waiver'}
                  content={formData.content || 'Enter waiver content to preview...'}
                  version={template?.version || 1}
                  variableContext={previewContext}
                />
              </div>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter the full waiver text that passengers will read and sign..."
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-sm"
              rows={16}
              required
            />
          )}
          <p className="text-xs text-slate-500">
            This text will be displayed to passengers before they sign. Use variables like{' '}
            <code className="text-cyan-600">{'{{guest_name}}'}</code> to personalize the waiver.
          </p>
        </div>

        {/* Active Checkbox */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-200 bg-white text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm font-medium text-slate-600">
              Active (require for all new bookings)
            </span>
          </label>
        </div>

        {/* Version Info */}
        {template && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Current version: <span className="text-slate-400 font-mono">v{template.version}</span>
              <span className="ml-2">• Saving will create a new version</span>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-500/30 p-4 text-sm text-rose-600">
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white transition-colors hover:bg-cyan-400 disabled:opacity-50"
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
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-2 font-medium text-slate-400 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
