'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  X,
  CalendarPlus,
  CalendarX,
  StickyNote,
  Keyboard,
} from 'lucide-react'

interface FABAction {
  id: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
}

interface FloatingActionButtonProps {
  onNewBooking?: () => void
  onBlockTime?: () => void
  onQuickNote?: () => void
  onShowShortcuts?: () => void
}

export function FloatingActionButton({
  onNewBooking,
  onBlockTime,
  onQuickNote,
  onShowShortcuts,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Handle clicks outside FAB to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleNewBooking = useCallback(() => {
    setIsOpen(false)
    if (onNewBooking) {
      onNewBooking()
    } else {
      // Navigate to manual booking page
      router.push('/dashboard/bookings/new')
    }
  }, [onNewBooking, router])

  const handleBlockTime = useCallback(() => {
    setIsOpen(false)
    if (onBlockTime) {
      onBlockTime()
    }
  }, [onBlockTime])

  const handleQuickNote = useCallback(() => {
    setIsOpen(false)
    if (onQuickNote) {
      onQuickNote()
    }
  }, [onQuickNote])

  const handleShowShortcuts = useCallback(() => {
    setIsOpen(false)
    if (onShowShortcuts) {
      onShowShortcuts()
    }
  }, [onShowShortcuts])

  // Build actions list, filtering out gated features when handlers are undefined
  const actions: FABAction[] = [
    {
      id: 'new-booking',
      icon: <CalendarPlus className="h-5 w-5" />,
      label: 'New Booking',
      shortcut: 'N',
      onClick: handleNewBooking,
    },
    ...(onBlockTime
      ? [
          {
            id: 'block-time',
            icon: <CalendarX className="h-5 w-5" />,
            label: 'Block Time',
            shortcut: 'B',
            onClick: handleBlockTime,
          },
        ]
      : []),
    ...(onQuickNote
      ? [
          {
            id: 'quick-note',
            icon: <StickyNote className="h-5 w-5" />,
            label: 'Quick Note',
            onClick: handleQuickNote,
          },
        ]
      : []),
    ...(onShowShortcuts
      ? [
          {
            id: 'shortcuts',
            icon: <Keyboard className="h-5 w-5" />,
            label: 'Shortcuts',
            shortcut: '?',
            onClick: handleShowShortcuts,
          },
        ]
      : []),
  ]

  return (
    <div
      ref={fabRef}
      className="fixed bottom-6 right-6 z-40 md:top-20 md:bottom-auto md:right-6 flex flex-col-reverse md:flex-col items-end gap-3 pointer-events-none"
    >
      {/* Action buttons - shown when expanded */}
      <div
        className={`flex flex-col-reverse md:flex-col gap-3 transition-all duration-200 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 md:-translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="group flex items-center gap-3 rounded-full bg-white py-3 pl-4 pr-5 shadow-lg border border-slate-200 transition-all duration-150 hover:bg-slate-100 hover:border-cyan-300 hover:shadow-cyan-500/10 active:scale-95"
            style={{
              transitionDelay: isOpen ? `${index * 30}ms` : '0ms',
            }}
          >
            <div className="text-cyan-600 transition-colors group-hover:text-cyan-600">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
              {action.label}
            </span>
            {action.shortcut && (
              <kbd className="ml-1 rounded bg-white px-1.5 py-0.5 text-xs font-mono text-slate-400">
                {action.shortcut}
              </kbd>
            )}
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <div className="relative flex items-center gap-3 pointer-events-auto">
        {/* Tooltip label - visible on hover when closed */}
        {!isOpen && (
          <div className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 opacity-0 shadow-lg transition-opacity group-hover/fab:opacity-100 md:block">
            Quick Actions
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group/fab relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95 ${
            isOpen
              ? 'bg-slate-100 border border-slate-300 rotate-45'
              : 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-cyan-500/25 hover:shadow-cyan-500/40'
          }`}
          aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={isOpen}
          title={isOpen ? 'Close' : 'Quick Actions'}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-slate-600 -rotate-45" />
          ) : (
            <Plus className="h-7 w-7 text-slate-900" />
          )}

          {/* Pulse animation when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-cyan-400 opacity-0 group-hover/fab:animate-ping" />
          )}
        </button>
      </div>
    </div>
  )
}
