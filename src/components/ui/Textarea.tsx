'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, showCount, maxLength, id, value, ...props }, ref) => {
    const textareaId = id || props.name;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="text-xs font-medium text-slate-700"
            >
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[10px] text-slate-400">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          className={cn(
            'block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-sm resize-none',
            'focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-200',
            props.disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          rows={4}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
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

Textarea.displayName = 'Textarea';
