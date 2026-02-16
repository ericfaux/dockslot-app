'use client'

import { useState } from 'react'
import { Search, X, Tag, Calendar, DollarSign, Users, Lock } from 'lucide-react'
import { BookingStatus } from '@/lib/db/types'

interface BookingFiltersProps {
  onFilterChange: (filters: BookingFilterState) => void
  availableTags?: string[]
  /** When true, only show the search bar and disable advanced filter controls */
  deckhandMode?: boolean
}

export interface BookingFilterState {
  search: string
  tags: string[]
  statuses: BookingStatus[]
  paymentStatus: string[]
  dateRange: {
    start: string | null
    end: string | null
  }
}

const STATUS_OPTIONS: { value: BookingStatus; label: string; color: string }[] = [
  { value: 'pending_deposit', label: 'Awaiting Deposit', color: 'text-amber-600' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-emerald-600' },
  { value: 'weather_hold', label: 'Weather Hold', color: 'text-amber-600' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'text-blue-600' },
  { value: 'completed', label: 'Completed', color: 'text-slate-400' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-rose-600' },
  { value: 'no_show', label: 'No Show', color: 'text-rose-600' },
  { value: 'expired', label: 'Expired', color: 'text-slate-500' },
]

const PAYMENT_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'fully_paid', label: 'Fully Paid' },
]

export default function BookingFilters({ onFilterChange, availableTags = [], deckhandMode = false }: BookingFiltersProps) {
  const [filters, setFilters] = useState<BookingFilterState>({
    search: '',
    tags: [],
    statuses: [],
    paymentStatus: [],
    dateRange: { start: null, end: null },
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilters = (updates: Partial<BookingFilterState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSearchChange = (value: string) => {
    updateFilters({ search: value })
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    updateFilters({ tags: newTags })
  }

  const toggleStatus = (status: BookingStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status]
    updateFilters({ statuses: newStatuses })
  }

  const togglePaymentStatus = (status: string) => {
    const newPaymentStatus = filters.paymentStatus.includes(status)
      ? filters.paymentStatus.filter((s) => s !== status)
      : [...filters.paymentStatus, status]
    updateFilters({ paymentStatus: newPaymentStatus })
  }

  const clearAllFilters = () => {
    const emptyFilters: BookingFilterState = {
      search: '',
      tags: [],
      statuses: [],
      paymentStatus: [],
      dateRange: { start: null, end: null },
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters =
    filters.search ||
    filters.tags.length > 0 ||
    filters.statuses.length > 0 ||
    filters.paymentStatus.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.tags.length +
    filters.statuses.length +
    filters.paymentStatus.length +
    (filters.dateRange.start ? 1 : 0)

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search bookings (guest name, email, phone)..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Filter Toggle & Clear */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (!deckhandMode) {
              setIsExpanded(!isExpanded)
            }
          }}
          className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
            deckhandMode ? 'text-slate-400 cursor-default' : 'text-cyan-600 hover:bg-white'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </span>
          {deckhandMode && (
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-600">
              <Lock className="h-2.5 w-2.5" />
              Captain
            </span>
          )}
        </button>
        {hasActiveFilters && !deckhandMode && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 rounded px-3 py-2 text-sm text-slate-400 hover:bg-white hover:text-slate-700"
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Expanded Filters - not available in deckhand mode */}
      {isExpanded && !deckhandMode && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-cyan-500/30 text-cyan-600 ring-1 ring-cyan-500'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Booking Status */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              Booking Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleStatus(option.value)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    filters.statuses.includes(option.value)
                      ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-500'
                      : `bg-slate-50 ${option.color} hover:bg-slate-100`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
              <DollarSign className="h-3.5 w-3.5" />
              Payment Status
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => togglePaymentStatus(option.value)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    filters.paymentStatus.includes(option.value)
                      ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-500'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateRange.start || ''}
                onChange={(e) =>
                  updateFilters({
                    dateRange: { ...filters.dateRange, start: e.target.value || null },
                  })
                }
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="date"
                value={filters.dateRange.end || ''}
                onChange={(e) =>
                  updateFilters({
                    dateRange: { ...filters.dateRange, end: e.target.value || null },
                  })
                }
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Pills - not available in deckhand mode */}
      {hasActiveFilters && !isExpanded && !deckhandMode && (
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-600"
            >
              <Tag className="h-3 w-3" />
              {tag}
              <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-cyan-200">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filters.statuses.map((status) => {
            const option = STATUS_OPTIONS.find((o) => o.value === status)
            return (
              <span
                key={status}
                className={`flex items-center gap-1 rounded bg-slate-100 px-3 py-1 text-xs font-medium ${option?.color}`}
              >
                {option?.label}
                <button onClick={() => toggleStatus(status)} className="ml-1 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
