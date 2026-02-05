// components/booking/ProgressIndicator.tsx
// Mobile-friendly booking progress indicator (light theme)
// Shows current step with labels and visual progress bar

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
          <span className="text-sm text-cyan-700 font-medium">
            {steps[currentStep - 1]?.shortLabel || steps[currentStep - 1]?.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-600 transition-all duration-300 ease-out rounded-full"
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
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full
                    text-sm font-semibold transition-all
                    ${isCompleted ? 'bg-cyan-600 text-white' : ''}
                    ${isCurrent ? 'bg-cyan-600 text-white ring-4 ring-cyan-100' : ''}
                    ${isUpcoming ? 'bg-slate-200 text-slate-400' : ''}
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
                    ${isCurrent ? 'text-cyan-700' : ''}
                    ${isCompleted ? 'text-slate-600' : ''}
                    ${isUpcoming ? 'text-slate-400' : ''}
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
                    ${stepNum < currentStep ? 'bg-cyan-600' : 'bg-slate-200'}
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
