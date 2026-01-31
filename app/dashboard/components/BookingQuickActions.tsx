'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  DollarSign,
  CloudRain,
  CheckCircle,
  Copy,
  Mail,
  FileText,
  Navigation,
} from 'lucide-react'

interface BookingQuickActionsProps {
  bookingId: string
  bookingStatus: string
  guestEmail: string
  guestName: string
  onAction: (action: string) => void
}

export default function BookingQuickActions({
  bookingId,
  bookingStatus,
  guestEmail,
  guestName,
  onAction,
}: BookingQuickActionsProps) {
  const [showMenu, setShowMenu] = useState(false)

  // Keyboard shortcut: Cmd/Ctrl + K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowMenu(!showMenu)
      }
      if (e.key === 'Escape') {
        setShowMenu(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showMenu])

  const actions = [
    {
      id: 'email',
      label: 'Email Guest',
      icon: Mail,
      shortcut: 'E',
      color: 'text-blue-400',
      action: () => {
        window.location.href = `mailto:${guestEmail}?subject=Your DockSlot Booking`
        onAction('email')
      },
    },
    {
      id: 'sms',
      label: 'Text Guest',
      icon: MessageSquare,
      shortcut: 'S',
      color: 'text-cyan-400',
      action: () => {
        // Future: integrate SMS
        alert('SMS integration coming soon!')
        onAction('sms')
      },
    },
    {
      id: 'balance',
      label: 'Request Balance',
      icon: DollarSign,
      shortcut: 'B',
      color: 'text-emerald-400',
      show: bookingStatus === 'confirmed',
      action: () => {
        onAction('balance')
      },
    },
    {
      id: 'weather',
      label: 'Weather Hold',
      icon: CloudRain,
      shortcut: 'W',
      color: 'text-amber-400',
      show: ['confirmed', 'rescheduled'].includes(bookingStatus),
      action: () => {
        onAction('weather')
      },
    },
    {
      id: 'complete',
      label: 'Complete Trip',
      icon: CheckCircle,
      shortcut: 'C',
      color: 'text-emerald-400',
      show: ['confirmed', 'rescheduled'].includes(bookingStatus),
      action: () => {
        onAction('complete')
      },
    },
    {
      id: 'duplicate',
      label: 'Duplicate Booking',
      icon: Copy,
      shortcut: 'D',
      color: 'text-purple-400',
      action: () => {
        onAction('duplicate')
      },
    },
    {
      id: 'report',
      label: 'Trip Report',
      icon: FileText,
      shortcut: 'R',
      color: 'text-slate-400',
      show: bookingStatus === 'completed',
      action: () => {
        onAction('report')
      },
    },
    {
      id: 'navigate',
      label: 'View on Calendar',
      icon: Navigation,
      shortcut: 'V',
      color: 'text-cyan-400',
      action: () => {
        window.location.href = `/dashboard/schedule?booking=${bookingId}`
        onAction('navigate')
      },
    },
  ]

  const visibleActions = actions.filter((a) => a.show !== false)

  // Keyboard shortcuts for individual actions
  useEffect(() => {
    if (!showMenu) return

    const handleActionKey = (e: KeyboardEvent) => {
      const action = visibleActions.find(
        (a) => a.shortcut.toLowerCase() === e.key.toLowerCase()
      )
      if (action) {
        e.preventDefault()
        action.action()
        setShowMenu(false)
      }
    }

    window.addEventListener('keydown', handleActionKey)
    return () => window.removeEventListener('keydown', handleActionKey)
  }, [showMenu, visibleActions])

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
      >
        <MessageSquare className="h-4 w-4" />
        Quick Actions
        <kbd className="rounded bg-slate-700 px-1.5 py-0.5 text-xs font-mono text-slate-400">
          ⌘K
        </kbd>
      </button>

      {/* Quick Actions Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-slate-200">
                Quick Actions
              </h3>
              <p className="text-xs text-slate-500">
                {guestName} • Press key or click action
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {visibleActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action()
                      setShowMenu(false)
                    }}
                    className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition-colors hover:bg-slate-800"
                  >
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <span className="flex-1 text-sm text-slate-200">
                      {action.label}
                    </span>
                    <kbd className="rounded bg-slate-800 px-2 py-1 font-mono text-xs text-slate-400">
                      {action.shortcut}
                    </kbd>
                  </button>
                )
              })}
            </div>
            <div className="border-t border-slate-700 p-3 text-center text-xs text-slate-500">
              Press <kbd className="rounded bg-slate-800 px-1.5 py-0.5">Esc</kbd> to close
            </div>
          </div>
        </>
      )}
    </>
  )
}
