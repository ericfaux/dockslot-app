// components/booking/StickyBottomCTA.tsx
// Sticky bottom CTA container for mobile booking flow (light theme)
// Ensures primary action is always accessible without scrolling

'use client';

import { ReactNode } from 'react';

interface StickyBottomCTAProps {
  children: ReactNode;
  className?: string;
  showSummary?: boolean;
  summaryContent?: ReactNode;
}

export function StickyBottomCTA({
  children,
  className = '',
  showSummary = false,
  summaryContent,
}: StickyBottomCTAProps) {
  return (
    <>
      {/* Spacer to prevent content from being hidden behind sticky CTA */}
      <div className="h-24 sm:h-0" aria-hidden="true" />

      {/* Sticky container */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          border-t border-slate-200 bg-white/95 backdrop-blur-lg shadow-[0_-4px_16px_rgba(0,0,0,0.06)]
          sm:relative sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none sm:shadow-none
          ${className}
        `}
      >
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-0 sm:py-0">
          {/* Optional summary row */}
          {showSummary && summaryContent && (
            <div className="mb-3 sm:hidden">
              {summaryContent}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {children}
          </div>
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white/95 sm:hidden" />
      </div>
    </>
  );
}

// Pre-styled primary button for use within StickyBottomCTA
interface CTAButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function CTAButton({
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  children,
  variant = 'primary',
  className = '',
}: CTAButtonProps) {
  const baseStyles = `
    flex-1 flex items-center justify-center gap-2
    rounded-xl px-6 py-4 font-semibold text-base
    transition-all duration-200
    min-h-[52px]
    disabled:cursor-not-allowed disabled:opacity-50
  `;

  const variantStyles = {
    primary: `
      text-white
      active:scale-[0.98]
    `,
    secondary: `
      border border-slate-300 bg-white text-slate-700
      hover:bg-slate-50
      active:scale-[0.98]
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={variant === 'primary' ? { backgroundColor: 'var(--brand-accent, #0891b2)' } : undefined}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
