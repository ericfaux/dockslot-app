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

interface QuickActionsProviderProps {
  children: React.ReactNode
}

export function QuickActionsProvider({ children }: QuickActionsProviderProps) {
  const router = useRouter()

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
    setShowBlockTime(true)
  }, [])

  const handleQuickNote = useCallback(() => {
    setShowQuickNote(true)
  }, [])

  const handleShowSearch = useCallback(() => {
    setShowSearch(true)
  }, [])

  const handleShowShortcuts = useCallback(() => {
    setShowShortcuts(true)
  }, [])

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

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onNewBooking: handleNewBooking,
    onBlockTime: handleBlockTime,
    onShowSearch: handleShowSearch,
    onShowShortcutsHelp: handleShowShortcuts,
  })

  return (
    <>
      {children}

      {/* Floating Action Button */}
      <FloatingActionButton
        onNewBooking={handleNewBooking}
        onBlockTime={handleBlockTime}
        onQuickNote={handleQuickNote}
        onShowShortcuts={handleShowShortcuts}
      />

      {/* Modals */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <GlobalSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      <QuickNoteModal
        isOpen={showQuickNote}
        onClose={() => setShowQuickNote(false)}
      />

      <BlackoutModal
        isOpen={showBlockTime}
        onClose={() => setShowBlockTime(false)}
        onSubmit={handleBlockTimeSubmit}
        isPending={isBlockingTime}
      />
    </>
  )
}
