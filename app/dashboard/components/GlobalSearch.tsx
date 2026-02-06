'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  User,
  Calendar,
  Hash,
  Loader2,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { STATUS_LABELS } from '@/components/calendar/types'
import { BookingStatus } from '@/lib/db/types'

interface SearchResult {
  id: string
  type: 'booking' | 'guest'
  guestName: string
  guestEmail?: string
  guestPhone?: string
  scheduledStart?: string
  status?: BookingStatus
  tripType?: string
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&limit=10`
        )
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => clearTimeout(searchTimeout)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          event.preventDefault()
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
          }
          break
        case 'Escape':
          event.preventDefault()
          onClose()
          break
      }
    },
    [results, selectedIndex, onClose]
  )

  const handleResultClick = (result: SearchResult) => {
    onClose()
    if (result.type === 'booking') {
      router.push(`/dashboard/schedule?booking=${result.id}`)
    } else {
      router.push(`/dashboard/guests/${result.id}`)
    }
  }

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return ''
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy')
    } catch {
      return ''
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]">
        <div
          className="pointer-events-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-4">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
            ) : (
              <Search className="h-5 w-5 text-slate-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search guests, booking IDs, dates..."
              className="flex-1 bg-transparent py-4 text-slate-900 placeholder-slate-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="rounded bg-slate-100 px-2 py-1 text-xs font-mono text-slate-400">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {query.length >= 2 && !isLoading && results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-slate-400">No results found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Try searching by guest name, email, phone, or booking ID
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-cyan-50'
                        : 'hover:bg-white'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        result.type === 'booking'
                          ? 'bg-cyan-50'
                          : 'bg-purple-50'
                      }`}
                    >
                      {result.type === 'booking' ? (
                        <Calendar className="h-5 w-5 text-cyan-600" />
                      ) : (
                        <User className="h-5 w-5 text-purple-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700 truncate">
                          {result.guestName}
                        </span>
                        {result.status && (
                          <span className="text-xs text-slate-500">
                            {STATUS_LABELS[result.status]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        {result.scheduledStart && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(result.scheduledStart)}
                          </span>
                        )}
                        {result.tripType && (
                          <span className="truncate">{result.tripType}</span>
                        )}
                        {result.guestPhone && (
                          <span className="truncate">{result.guestPhone}</span>
                        )}
                      </div>
                    </div>

                    {/* Type badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 capitalize">
                        {result.type}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length > 0 && query.length < 2 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Type at least 2 characters to search
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                  Enter
                </kbd>
                Open
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
              to search anywhere
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
