import { cn } from '@/lib/utils/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('mx-auto max-w-5xl px-6', className)}>
      {children}
    </div>
  );
}
