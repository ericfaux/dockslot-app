'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Star, X } from 'lucide-react'
import { BookingFilterState } from '../schedule/BookingFilters'

interface FilterPreset {
  id: string
  name: string
  filters: Pick<BookingFilterState, 'statuses' | 'paymentStatus' | 'dateRange'>
}

interface FilterPresetsMenuProps {
  captainId: string
  currentFilters: BookingFilterState
  onApplyPreset: (filters: BookingFilterState) => void
}

function getStorageKey(captainId: string) {
  return `dockslot_filter_presets_${captainId}`
}

function loadPresets(captainId: string): FilterPreset[] {
  try {
    const raw = localStorage.getItem(getStorageKey(captainId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePresets(captainId: string, presets: FilterPreset[]) {
  localStorage.setItem(getStorageKey(captainId), JSON.stringify(presets))
}

export default function FilterPresetsMenu({
  captainId,
  currentFilters,
  onApplyPreset,
}: FilterPresetsMenuProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPresets(loadPresets(captainId))
  }, [captainId])

  const persistPresets = useCallback((updated: FilterPreset[]) => {
    setPresets(updated)
    savePresets(captainId, updated)
  }, [captainId])

  const handleSavePreset = () => {
    if (!saveName.trim()) {
      setError('Please enter a name')
      return
    }

    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      filters: {
        statuses: currentFilters.statuses,
        paymentStatus: currentFilters.paymentStatus,
        dateRange: currentFilters.dateRange,
      },
    }

    persistPresets([...presets, newPreset])
    setSaveName('')
    setShowSaveForm(false)
    setError(null)
  }

  const handleDeletePreset = (id: string) => {
    persistPresets(presets.filter((p) => p.id !== id))
  }

  const handleApplyPreset = (preset: FilterPreset) => {
    onApplyPreset({
      search: '',
      tags: [],
      statuses: preset.filters.statuses,
      paymentStatus: preset.filters.paymentStatus,
      dateRange: preset.filters.dateRange,
    })
    setIsOpen(false)
  }

  const hasActiveFilters =
    currentFilters.statuses.length > 0 ||
    currentFilters.paymentStatus.length > 0 ||
    currentFilters.dateRange.start ||
    currentFilters.dateRange.end

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        <Star className="h-4 w-4" />
        Presets
        {presets.length > 0 && (
          <span className="rounded-full bg-cyan-50 px-1.5 py-0.5 text-xs text-cyan-600">
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
          <div className="absolute right-0 top-12 z-20 w-80 rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Filter Presets
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Save Current Filters */}
              {hasActiveFilters && !showSaveForm && (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="mb-3 flex w-full items-center gap-2 rounded border border-cyan-500/50 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-600 hover:bg-cyan-100"
                >
                  <Save className="h-4 w-4" />
                  Save Current Filters as Preset
                </button>
              )}

              {/* Save Form */}
              {showSaveForm && (
                <div className="mb-3 space-y-2 rounded border border-slate-300 bg-white p-3">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePreset()
                      if (e.key === 'Escape') setShowSaveForm(false)
                    }}
                    placeholder='e.g. "Unpaid This Week"'
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-rose-600">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePreset}
                      className="flex-1 rounded bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSaveForm(false)
                        setError(null)
                        setSaveName('')
                      }}
                      className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Preset List */}
              {presets.length === 0 ? (
                <div className="rounded bg-white p-6 text-center text-sm text-slate-500">
                  No saved presets yet
                </div>
              ) : (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="group flex items-center gap-2 rounded border border-slate-200 bg-white p-2 hover:border-slate-300"
                    >
                      <button
                        onClick={() => handleApplyPreset(preset)}
                        className="flex-1 text-left"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {preset.name}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="rounded p-1 text-slate-400 opacity-0 hover:bg-slate-100 hover:text-rose-600 group-hover:opacity-100"
                        title="Delete preset"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
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
