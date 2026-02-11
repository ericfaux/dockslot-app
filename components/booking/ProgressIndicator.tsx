// components/booking/ProgressIndicator.tsx
// Mobile-friendly booking progress indicator (light theme)
// Shows current step with labels and visual progress bar
// Uses CSS variables from BrandedLayout for accent color

'use client';

import { Check } from 'lucide-react';

export interface Step {
  label: string;
  shortLabel?: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number; // 1-indexed
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className = '' }: ProgressIndicatorProps) {
  return (
    <div className={className}>
      {/* Mobile: Simple text indicator */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-900">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--brand-accent, #0e7490)' }}>
            {steps[currentStep - 1]?.shortLabel || steps[currentStep - 1]?.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out rounded-full"
            style={{
              backgroundColor: 'var(--brand-accent, #0891b2)',
              width: `${(currentStep / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden sm:flex items-center justify-center">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full
                    text-sm font-semibold transition-all
                    ${isUpcoming ? 'bg-slate-200 text-slate-400' : ''}
                  `}
                  style={
                    isCompleted || isCurrent
                      ? {
                          backgroundColor: 'var(--brand-accent, #0891b2)',
                          color: 'white',
                          ...(isCurrent ? { boxShadow: '0 0 0 4px var(--brand-accent-light, #ecfeff)' } : {}),
                        }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isCompleted ? 'text-slate-600' : ''}
                    ${isUpcoming ? 'text-slate-400' : ''}
                  `}
                  style={isCurrent ? { color: 'var(--brand-accent, #0e7490)' } : undefined}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className="h-0.5 w-12 mx-3 transition-colors"
                  style={{
                    backgroundColor: stepNum < currentStep
                      ? 'var(--brand-accent, #0891b2)'
                      : undefined,
                  }}
                >
                  {stepNum >= currentStep && (
                    <div className="h-full bg-slate-200" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
