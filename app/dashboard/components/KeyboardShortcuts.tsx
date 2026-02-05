'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcutsProps {
  onNewBooking?: () => void
  onBlockTime?: () => void
  onShowSearch?: () => void
  onShowShortcutsHelp?: () => void
}

export function useKeyboardShortcuts({
  onNewBooking,
  onBlockTime,
  onShowSearch,
  onShowShortcutsHelp,
}: KeyboardShortcutsProps) {
  const router = useRouter()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('[role="dialog"]')
      ) {
        return
      }

      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        onShowSearch?.()
        return
      }

      // Single key shortcuts (no modifier)
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault()
          onNewBooking?.()
          break
        case 'b':
          event.preventDefault()
          onBlockTime?.()
          break
        case 't':
          event.preventDefault()
          router.push('/dashboard/schedule')
          break
        case 's':
          event.preventDefault()
          onShowSearch?.()
          break
        case '?':
          event.preventDefault()
          onShowShortcutsHelp?.()
          break
      }
    },
    [router, onNewBooking, onBlockTime, onShowSearch, onShowShortcutsHelp]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Shortcut definitions for the help modal
export const KEYBOARD_SHORTCUTS = [
  {
    key: 'N',
    description: 'New booking',
    category: 'Quick Actions',
  },
  {
    key: 'B',
    description: 'Block time',
    category: 'Quick Actions',
  },
  {
    key: 'T',
    description: "Jump to today's schedule",
    category: 'Navigation',
  },
  {
    key: 'S',
    description: 'Open search',
    category: 'Navigation',
  },
  {
    key: '⌘/Ctrl + K',
    description: 'Global search',
    category: 'Navigation',
  },
  {
    key: '?',
    description: 'Show shortcuts help',
    category: 'Help',
  },
  {
    key: 'Esc',
    description: 'Close dialogs/menus',
    category: 'Help',
  },
]
