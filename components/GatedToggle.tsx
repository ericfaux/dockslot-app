'use client'

interface GatedToggleProps {
  feature?: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  label: string
  description?: string
}

/**
 * GatedToggle - Previously gated toggle behind subscription tiers.
 * Now renders the toggle directly since all features are available.
 */
export function GatedToggle({
  enabled,
  onToggle,
  label,
  description,
}: GatedToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
          enabled ? 'bg-cyan-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
