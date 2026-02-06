'use client'

import { useState } from 'react'
import { X, Tag, XCircle, Check } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  onCancel: () => void
  onClearSelection: () => void
  availableTags: string[]
}

export default function BulkActionsBar({
  selectedCount,
  onCancel,
  onClearSelection,
  availableTags,
}: BulkActionsBarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [result, setResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleBulkAction = async (
    action: string,
    actionData?: Record<string, unknown>
  ) => {
    setIsProcessing(true)
    setResult(null)

    try {
      const selectedIds = getSelectedBookingIds()

      const response = await fetch('/api/bookings/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          booking_ids: selectedIds,
          data: actionData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Bulk action failed')
      }

      setResult({
        type: 'success',
        message: `Success: ${data.succeeded}/${data.processed} bookings updated`,
      })

      setTimeout(() => {
        onClearSelection()
        setResult(null)
        window.location.reload() // Refresh to show changes
      }, 1500)
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Action failed',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getSelectedBookingIds = (): string[] => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[name="booking-select"]:checked'
    )
    return Array.from(checkboxes).map((cb) => cb.value)
  }

  const handleAddTag = (tag: string) => {
    handleBulkAction('add_tag', { tag })
    setShowTagMenu(false)
    setCustomTag('')
  }

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      handleAddTag(customTag.trim())
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white p-4 shadow-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Selection count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50">
              <Check className="h-4 w-4 text-cyan-600" />
            </div>
            <span className="font-medium text-slate-700">
              {selectedCount} selected
            </span>
          </div>

          {result && (
            <div
              className={`rounded px-3 py-1 text-sm ${
                result.type === 'success'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {result.message}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Add Tag */}
          <div className="relative">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              <Tag className="h-4 w-4" />
              Add Tag
            </button>

            {showTagMenu && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setShowTagMenu(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="mb-2 text-xs font-medium text-slate-400">
                    Select tag to add
                  </div>
                  <div className="mb-3 flex max-h-48 flex-col gap-1 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className="rounded px-2 py-1 text-left text-sm text-slate-600 hover:bg-slate-100"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-slate-200 pt-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomTag()
                      }}
                      placeholder="Custom tag..."
                      className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      onClick={handleAddCustomTag}
                      className="rounded bg-cyan-600 px-3 py-1 text-sm font-medium text-white hover:bg-cyan-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cancel Bookings */}
          <button
            onClick={() => {
              if (
                confirm(
                  `Cancel ${selectedCount} booking(s)? This cannot be undone.`
                )
              ) {
                handleBulkAction('cancel', {
                  reason: 'Bulk cancelled by captain',
                })
              }
            }}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded border border-rose-600 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Cancel All
          </button>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
