'use client';

import { cn } from '@/lib/utils/cn';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label?: string;
  options: readonly RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  error,
  columns = 1,
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={cn('space-y-2', className)}>
      {label && (
        <legend className="text-xs font-medium text-slate-700">
          {label}
        </legend>
      )}
      <div
        className={cn(
          'grid gap-3',
          columns === 1 && 'grid-cols-1',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3'
        )}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <div
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border px-3 py-2.5 text-center transition-all',
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <span className="text-xs font-semibold">{option.label}</span>
                {option.description && (
                  <span className="mt-0.5 text-[10px] text-slate-500">
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
