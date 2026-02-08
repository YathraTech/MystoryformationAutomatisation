'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || props.name;

    return (
      <div className="space-y-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            'flex cursor-pointer items-start gap-3',
            props.disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className="peer sr-only"
              aria-invalid={!!error}
              aria-describedby={error ? `${checkboxId}-error` : undefined}
              {...props}
            />
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
                'peer-checked:border-blue-600 peer-checked:bg-blue-600',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2',
                error ? 'border-red-300' : 'border-slate-300'
              )}
            >
              <Check className="hidden h-3.5 w-3.5 text-white peer-checked:block" />
            </div>
          </div>
          {label && (
            <span className="text-sm text-slate-600 select-none">{label}</span>
          )}
        </label>
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="text-xs text-red-500 pl-8"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
