import { cn } from '@/lib/utils/cn';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium text-slate-700"
        >
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
