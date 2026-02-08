'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  minDate?: string;
  maxDate?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, minDate, maxDate, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="date"
          id={inputId}
          min={minDate}
          max={maxDate}
          className={cn(
            'block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 transition-all shadow-sm',
            'focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-200',
            props.disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
