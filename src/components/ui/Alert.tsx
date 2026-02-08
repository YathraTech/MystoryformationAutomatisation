'use client';

import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <Info className="h-4 w-4 text-blue-600" />,
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <XCircle className="h-4 w-4 text-red-600" />,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1">
          {title && (
            <p className={cn('text-sm font-semibold', config.text)}>
              {title}
            </p>
          )}
          <div className={cn('text-sm', config.text, title && 'mt-1')}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              'flex-shrink-0 rounded p-0.5 transition-colors hover:bg-black/5',
              config.text
            )}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
