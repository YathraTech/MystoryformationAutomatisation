'use client';

import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  label?: string;
  options: readonly CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
  columns?: 2 | 3;
  className?: string;
}

export function CheckboxGroup({
  label,
  options,
  values,
  onChange,
  error,
  columns = 2,
  className,
}: CheckboxGroupProps) {
  const handleToggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

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
          columns === 2 ? 'grid-cols-2' : 'grid-cols-3'
        )}
      >
        {options.map((option) => {
          const isSelected = values.includes(option.value);
          return (
            <label
              key={option.value}
              className="cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option.value)}
                className="peer sr-only"
              />
              <div
                className={cn(
                  'flex items-center justify-center rounded-lg border py-2.5 text-center transition-all',
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                {isSelected && <Check className="mr-1.5 h-3.5 w-3.5" />}
                <span className="text-xs font-semibold">{option.label}</span>
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
