'use client'

import { useState, useEffect } from 'react'
import { Save, Star, Trash2, X, Check } from 'lucide-react'
import { BookingFilterState } from '../schedule/BookingFilters'

interface FilterPreset {
  id: string
  name: string
  filters: BookingFilterState
  is_default: boolean
}

interface FilterPresetsMenuProps {
  currentFilters: BookingFilterState
  onApplyPreset: (filters: BookingFilterState) => void
}

export default function FilterPresetsMenu({
  currentFilters,
  onApplyPreset,
}: FilterPresetsMenuProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/filter-presets')
      if (response.ok) {
        const data = await response.json()
        setPresets(data.presets || [])
      }
    } catch (err) {
      console.error('Error fetching presets:', err)
    }
  }

  const handleSavePreset = async () => {
    if (!saveName.trim()) {
      setError('Please enter a name')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/filter-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          filters: currentFilters,
          is_default: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save preset')
      }

      await fetchPresets()
      setSaveName('')
      setShowSaveForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePreset = async (id: string) => {
    try {
      const response = await fetch(`/api/filter-presets/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete preset')
      }

      await fetchPresets()
    } catch (err) {
      console.error('Error deleting preset:', err)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/filter-presets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to set default')
      }

      await fetchPresets()
    } catch (err) {
      console.error('Error setting default:', err)
    }
  }

  const hasActiveFilters =
    currentFilters.search ||
    currentFilters.tags.length > 0 ||
    currentFilters.statuses.length > 0 ||
    currentFilters.paymentStatus.length > 0 ||
    currentFilters.dateRange.start ||
    currentFilters.dateRange.end

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50"
      >
        <Star className="h-4 w-4" />
        Presets
        {presets.length > 0 && (
          <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-xs text-cyan-400">
            {presets.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-20 w-80 rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">
                  Filter Presets
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Save Current Filters */}
              {hasActiveFilters && !showSaveForm && (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="mb-3 flex w-full items-center gap-2 rounded border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20"
                >
                  <Save className="h-4 w-4" />
                  Save Current Filters
                </button>
              )}

              {/* Save Form */}
              {showSaveForm && (
                <div className="mb-3 space-y-2 rounded border border-slate-600 bg-slate-900/50 p-3">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePreset()
                      if (e.key === 'Escape') setShowSaveForm(false)
                    }}
                    placeholder="Preset name..."
                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-rose-400">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePreset}
                      disabled={isSaving}
                      className="flex-1 rounded bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSaveForm(false)
                        setError(null)
                        setSaveName('')
                      }}
                      className="rounded border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Preset List */}
              {presets.length === 0 ? (
                <div className="rounded bg-slate-900/50 p-6 text-center text-sm text-slate-500">
                  No saved presets yet
                </div>
              ) : (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="group flex items-center gap-2 rounded border border-slate-700 bg-slate-900/50 p-2 hover:border-slate-600 hover:bg-slate-900"
                    >
                      <button
                        onClick={() => {
                          onApplyPreset(preset.filters)
                          setIsOpen(false)
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {preset.name}
                          </span>
                          {preset.is_default && (
                            <span className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400">
                              <Check className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Actions */}
                      <div className="flex gap-1">
                        {!preset.is_default && (
                          <button
                            onClick={() => handleSetDefault(preset.id)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-cyan-400"
                            title="Set as default"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-rose-400"
                          title="Delete preset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
