'use client'

import { useState } from 'react'
import { X, Tag, Save, Edit3 } from 'lucide-react'

interface BookingNotesEditorProps {
  bookingId: string
  initialNotes: string | null
  initialTags: string[]
  onUpdate?: () => void
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
  'Bachelor/Bachelorette',
]

export default function BookingNotesEditor({
  bookingId,
  initialNotes,
  initialTags,
  onUpdate,
}: BookingNotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [tags, setTags] = useState<string[]>(initialTags || [])
  const [customTag, setCustomTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internal_notes: notes,
          tags: tags,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      setIsEditing(false)
      onUpdate?.()
    } catch (err) {
      setError('Failed to save notes. Please try again.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setNotes(initialNotes || '')
    setTags(initialTags || [])
    setIsEditing(false)
    setError(null)
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setCustomTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      addTag(customTag)
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
          <Edit3 className="h-4 w-4" />
          Captain&apos;s Notes & Tags
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded px-3 py-1 text-sm text-cyan-400 hover:bg-slate-700/50"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded border border-red-500/50 bg-red-500/10 p-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Tags Display/Edit */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-slate-400">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && !isEditing && (
            <span className="text-sm italic text-slate-500">No tags</span>
          )}
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300"
            >
              <Tag className="h-3 w-3" />
              {tag}
              {isEditing && (
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>

        {/* Tag Selection (when editing) */}
        {isEditing && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-300"
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
                    e.preventDefault()
                    handleAddCustomTag()
                  }
                }}
                placeholder="Custom tag..."
                className="flex-1 rounded border border-slate-600 bg-slate-900/50 px-3 py-1 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleAddCustomTag}
                className="rounded bg-slate-700 px-3 py-1 text-sm text-cyan-400 hover:bg-slate-600"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes Display/Edit */}
      <div>
        <label className="mb-2 block text-xs font-medium text-slate-400">
          Private Notes
        </label>
        {isEditing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special requests, preferences, reminders..."
            rows={4}
            className="w-full rounded border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        ) : (
          <div className="rounded bg-slate-900/30 p-3 text-sm text-slate-300">
            {notes || (
              <span className="italic text-slate-500">No notes yet</span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="rounded border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
