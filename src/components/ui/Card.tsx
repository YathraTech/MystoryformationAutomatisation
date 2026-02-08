'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
}

export function Card({ className, selected, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4 transition-all cursor-pointer shadow-sm',
        selected
          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
        className
      )}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (props.onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          props.onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}
