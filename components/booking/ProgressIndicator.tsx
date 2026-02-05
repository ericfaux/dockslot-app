// components/booking/ProgressIndicator.tsx
// Mobile-friendly booking progress indicator
// Shows current step with labels and visual progress bar

'use client';

import { Check } from 'lucide-react';

export interface Step {
  label: string;
  shortLabel?: string; // For mobile
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
          <span className="text-sm font-medium text-slate-100">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-cyan-400">
            {steps[currentStep - 1]?.shortLabel || steps[currentStep - 1]?.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
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
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full
                    text-sm font-semibold transition-all
                    ${isCompleted ? 'bg-cyan-500 text-slate-900' : ''}
                    ${isCurrent ? 'bg-cyan-500 text-slate-900 ring-4 ring-cyan-500/30' : ''}
                    ${isUpcoming ? 'bg-slate-700 text-slate-400' : ''}
                  `}
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
                    ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-0.5 w-12 mx-3 transition-colors
                    ${stepNum < currentStep ? 'bg-cyan-500' : 'bg-slate-700'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
