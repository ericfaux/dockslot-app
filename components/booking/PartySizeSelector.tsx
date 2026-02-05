// components/booking/PartySizeSelector.tsx
// Mobile-friendly party size selector with large tap targets (light theme)
// Visual grid of options instead of dropdown

'use client';

import { Users } from 'lucide-react';

interface PartySizeSelectorProps {
  value: number;
  onChange: (size: number) => void;
  maxSize: number;
  minSize?: number;
  className?: string;
}

export function PartySizeSelector({
  value,
  onChange,
  maxSize,
  minSize = 1,
  className = '',
}: PartySizeSelectorProps) {
  const options = Array.from(
    { length: maxSize - minSize + 1 },
    (_, i) => i + minSize
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-cyan-600" />
        <span className="text-sm font-medium text-slate-700">
          How many guests?
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {options.map((size) => {
          const isSelected = value === size;

          return (
            <button
              key={size}
              type="button"
              onClick={() => onChange(size)}
              className={`
                relative flex flex-col items-center justify-center
                rounded-xl border-2 py-4 px-3
                transition-all duration-200
                min-h-[72px]
                ${
                  isSelected
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
              aria-pressed={isSelected}
            >
              <span className="text-2xl font-bold">{size}</span>
              <span className="text-xs text-slate-500 mt-0.5">
                {size === 1 ? 'guest' : 'guests'}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-cyan-600 flex items-center justify-center">
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Maximum {maxSize} guests (USCG 6-pack limit)
      </p>
    </div>
  );
}
