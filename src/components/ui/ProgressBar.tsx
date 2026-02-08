'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function ProgressBar({ currentStep, totalSteps, labels }: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Mobile: simple progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-700">
            Étape {currentStep} / {totalSteps}
          </span>
          <span className="text-xs text-slate-500">
            {labels[currentStep - 1]}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: step indicators */}
      <div className="hidden sm:flex items-center justify-between">
        {labels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all',
                    isCompleted && 'bg-blue-600 text-white',
                    isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100',
                    !isCompleted && !isCurrent && 'bg-slate-100 text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-[10px] font-medium whitespace-nowrap',
                    isCurrent ? 'text-blue-700' : 'text-slate-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    'mx-2 h-px flex-1',
                    isCompleted ? 'bg-blue-600' : 'bg-slate-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
