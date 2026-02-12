'use client';

import { useState } from 'react';
import {
  Edit3,
  Save,
  X,
  Tag,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface NotesSectionProps {
  bookingId: string;
  initialNotes: string | null;
  initialTags: string[];
  specialRequests: string | null;
  onUpdate: () => void;
}

const COMMON_TAGS = [
  'VIP',
  'First Timer',
  'Anniversary',
  'Birthday',
  'Corporate',
  'Special Occasion',
  'Repeat Guest',
  'Large Group',
  'Kids Onboard',
  'Fishing Focus',
  'Photography',
  'Proposal',
];

export function NotesSection({
  bookingId,
  initialNotes,
  initialTags,
  specialRequests,
  onUpdate,
}: NotesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internal_notes: notes,
          tags: tags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      setIsEditing(false);
      setSuccess('Notes saved');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(initialNotes || '');
    setTags(initialTags || []);
    setIsEditing(false);
    setError(null);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setCustomTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <section
      aria-label="Notes"
      className="rounded-lg border border-slate-200 bg-white p-6 print:border-slate-300 print:bg-white"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-600 print:text-cyan-600">
          <Edit3 className="h-5 w-5" />
          Captain&apos;s Notes
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-cyan-600 hover:bg-slate-100 print:hidden"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded border border-rose-500/50 bg-rose-50 p-3 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded border border-emerald-500/50 bg-emerald-50 p-3 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Special Requests (from guest - read only) */}
        {specialRequests && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-4 print:border-amber-300 print:bg-amber-50">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-600">
              <MessageSquare className="h-3 w-3" />
              Guest&apos;s Special Requests
            </div>
            <p className="whitespace-pre-wrap text-sm text-amber-800 print:text-amber-800">
              {specialRequests}
            </p>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <Tag className="h-3 w-3" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 && !isEditing && (
              <span className="text-sm italic text-slate-500">No tags</span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-600 print:bg-cyan-100 print:text-cyan-700"
              >
                <Tag className="h-3 w-3" />
                {tag}
                {isEditing && (
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-rose-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Tag Selection (when editing) */}
          {isEditing && (
            <div className="mt-3 space-y-2 print:hidden">
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(customTag);
                    }
                  }}
                  placeholder="Custom tag..."
                  className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={() => addTag(customTag)}
                  disabled={!customTag.trim()}
                  className="rounded bg-slate-100 px-3 py-1.5 text-sm text-cyan-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Private Notes */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Private Notes
          </label>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests, preferences, reminders..."
              rows={5}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none print:hidden"
            />
          ) : (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 print:bg-slate-100 print:text-slate-700">
              {notes || (
                <span className="italic text-slate-500">No notes yet</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
