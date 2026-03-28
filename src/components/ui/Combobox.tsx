'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ComboboxProps {
  label?: string;
  error?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  maxSuggestions?: number;
}

export function Combobox({
  label,
  error,
  options,
  value,
  onChange,
  placeholder,
  leftIcon,
  disabled,
  className,
  maxSuggestions = 8,
}: ComboboxProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on input
  const filterOptions = useCallback(
    (query: string) => {
      if (query.length < 1) {
        setFilteredOptions(options.slice(0, maxSuggestions));
        return;
      }
      const queryLower = query.toLowerCase();
      const results = options
        .filter((opt) => opt.toLowerCase().includes(queryLower))
        .slice(0, maxSuggestions);
      setFilteredOptions(results);
    },
    [options, maxSuggestions]
  );

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    filterOptions(val);
    setShowSuggestions(true);
  };

  const handleSelect = (option: string) => {
    onChange(option);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    filterOptions(value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            'block w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 pr-9 text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-sm',
            'focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-200',
            leftIcon && 'pl-9',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-expanded={showSuggestions}
          role="combobox"
          aria-autocomplete="list"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
          <ChevronDown className={cn('h-4 w-4 transition-transform', showSuggestions && 'rotate-180')} />
        </div>

        {showSuggestions && filteredOptions.length > 0 && (
          <div
            className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
          >
            {filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                role="option"
                aria-selected={option === value}
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0',
                  option === value && 'bg-blue-50 text-blue-700 font-medium'
                )}
              >
                <p className="text-sm text-slate-800">{option}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
