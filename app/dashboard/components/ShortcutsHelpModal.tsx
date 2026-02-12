'use client'

import { X, Keyboard } from 'lucide-react'
import { KEYBOARD_SHORTCUTS } from './KeyboardShortcuts'

interface ShortcutsHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  if (!isOpen) return null

  // Group shortcuts by category
  const groupedShortcuts = KEYBOARD_SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {} as Record<string, typeof KEYBOARD_SHORTCUTS>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                <Keyboard className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm text-slate-400">
                  Speed up your workflow
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 p-4">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5"
                    >
                      <span className="text-sm text-slate-600">
                        {shortcut.description}
                      </span>
                      <kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-cyan-600">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <p className="text-center text-xs text-slate-500">
              Press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-cyan-600">?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
