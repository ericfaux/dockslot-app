'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FloatingActionButton } from './FloatingActionButton'
import { useKeyboardShortcuts } from './KeyboardShortcuts'
import { ShortcutsHelpModal } from './ShortcutsHelpModal'
import { GlobalSearch } from './GlobalSearch'
import { QuickNoteModal } from './QuickNoteModal'
import { BlackoutModal } from '../schedule/BlackoutModal'
import { createBlackout } from '@/app/actions/blackout'
import { useSubscription } from '@/lib/subscription/context'
import { canUseFeature } from '@/lib/subscription/gates'

interface QuickActionsProviderProps {
  children: React.ReactNode
}

export function QuickActionsProvider({ children }: QuickActionsProviderProps) {
  const router = useRouter()
  const { tier } = useSubscription()
  const hasKeyboardShortcuts = canUseFeature(tier, 'keyboard_shortcuts')
  const hasQuickNote = canUseFeature(tier, 'quick_note')
  const hasQuickBlock = canUseFeature(tier, 'quick_block')

  // Modal states
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showQuickNote, setShowQuickNote] = useState(false)
  const [showBlockTime, setShowBlockTime] = useState(false)
  const [isBlockingTime, setIsBlockingTime] = useState(false)

  // Action handlers
  const handleNewBooking = useCallback(() => {
    router.push('/dashboard/bookings/new')
  }, [router])

  const handleBlockTime = useCallback(() => {
    if (hasQuickBlock) setShowBlockTime(true)
  }, [hasQuickBlock])

  const handleQuickNote = useCallback(() => {
    if (hasQuickNote) setShowQuickNote(true)
  }, [hasQuickNote])

  const handleShowSearch = useCallback(() => {
    setShowSearch(true)
  }, [])

  const handleShowShortcuts = useCallback(() => {
    if (hasKeyboardShortcuts) setShowShortcuts(true)
  }, [hasKeyboardShortcuts])

  // Handle blackout submission
  const handleBlockTimeSubmit = useCallback(
    async (startDate: Date, endDate: Date | null, reason?: string) => {
      setIsBlockingTime(true)
      try {
        const result = await createBlackout({
          startDate,
          endDate: endDate || undefined,
          reason,
        })

        if (result.success) {
          setShowBlockTime(false)
          // Refresh schedule if on schedule page
          router.refresh()
        } else {
          console.error('Failed to create blackout:', result.error)
        }
      } catch (error) {
        console.error('Error creating blackout:', error)
      } finally {
        setIsBlockingTime(false)
      }
    },
    [router]
  )

  // Register keyboard shortcuts only for Captain+ users
  useKeyboardShortcuts(
    hasKeyboardShortcuts
      ? {
          onNewBooking: handleNewBooking,
          onBlockTime: handleBlockTime,
          onShowSearch: handleShowSearch,
          onShowShortcutsHelp: handleShowShortcuts,
        }
      : {
          // Deckhand: no keyboard shortcuts registered
          onNewBooking: () => {},
          onBlockTime: () => {},
          onShowSearch: () => {},
          onShowShortcutsHelp: () => {},
        }
  )

  return (
    <>
      {children}

      {/* Floating Action Button */}
      <FloatingActionButton
        onNewBooking={handleNewBooking}
        onBlockTime={hasQuickBlock ? handleBlockTime : undefined}
        onQuickNote={hasQuickNote ? handleQuickNote : undefined}
        onShowShortcuts={hasKeyboardShortcuts ? handleShowShortcuts : undefined}
      />

      {/* Modals — only render for Captain+ */}
      {hasKeyboardShortcuts && (
        <ShortcutsHelpModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}

      <GlobalSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      {hasQuickNote && (
        <QuickNoteModal
          isOpen={showQuickNote}
          onClose={() => setShowQuickNote(false)}
        />
      )}

      {hasQuickBlock && (
        <BlackoutModal
          isOpen={showBlockTime}
          onClose={() => setShowBlockTime(false)}
          onSubmit={handleBlockTimeSubmit}
          isPending={isBlockingTime}
        />
      )}
    </>
  )
}
