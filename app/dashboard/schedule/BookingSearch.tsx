'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { BookingStatus } from '@/lib/db/types';

interface SearchResult {
  id: string;
  type: 'booking' | 'guest';
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  scheduledStart?: string;
  status?: BookingStatus;
  tripType?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_deposit: 'Pending',
  confirmed: 'Confirmed',
  weather_hold: 'Weather Hold',
  rescheduled: 'Rescheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  expired: 'Expired',
};

const STATUS_COLORS: Record<string, string> = {
  pending_deposit: 'bg-amber-500',
  confirmed: 'bg-blue-500',
  weather_hold: 'bg-orange-500',
  rescheduled: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-rose-500',
  no_show: 'bg-slate-500',
  expired: 'bg-slate-400',
};

interface BookingSearchProps {
  onSelectBooking?: (bookingId: string, scheduledStart?: string) => void;
}

export function BookingSearch({ onSelectBooking }: BookingSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&limit=8`
        );
        if (response.ok) {
          const data = await response.json();
          // Only show booking results on the schedule page
          const bookingResults = (data.results || []).filter(
            (r: SearchResult) => r.type === 'booking'
          );
          setResults(bookingResults);
          setIsOpen(bookingResults.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectBooking) {
      onSelectBooking(result.id, result.scheduledStart);
    } else {
      router.push(`/dashboard/schedule?booking=${result.id}`);
    }
  }, [onSelectBooking, router]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          event.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [results, selectedIndex, handleResultClick]
  );

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  const formatTime = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      return format(parseISO(dateStr), 'h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        {isLoading ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-600" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (e.target.value.length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search bookings by guest name..."
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                index === selectedIndex ? 'bg-cyan-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-50">
                <Calendar className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {result.guestName}
                  </span>
                  {result.status && (
                    <span className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[result.status] || 'bg-slate-400'}`} />
                      <span className="text-xs text-slate-600">
                        {STATUS_LABELS[result.status] || result.status}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {result.scheduledStart && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(result.scheduledStart)} {formatTime(result.scheduledStart)}
                    </span>
                  )}
                  {result.tripType && (
                    <span className="truncate">{result.tripType}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
          <div className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400">
            <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate
            {' '}<kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> select
          </div>
        </div>
      )}

      {/* No results state */}
      {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-slate-200 bg-white p-4 text-center shadow-lg">
          <p className="text-sm text-slate-400">No bookings found</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Try searching by guest name, email, or phone
          </p>
        </div>
      )}
    </div>
  );
}
