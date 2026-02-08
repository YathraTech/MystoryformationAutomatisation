'use client';

import { useState, useCallback } from 'react';
import type { InscriptionCompleteData } from '@/types';

interface UseFormSubmitReturn {
  submit: (data: InscriptionCompleteData) => Promise<void>;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  reset: () => void;
}

export function useFormSubmit(): UseFormSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (data: InscriptionCompleteData) => {
    setIsSubmitting(true);
    setIsError(false);
    setError(null);

    try {
      const response = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Une erreur est survenue');
      }

      setIsSuccess(true);
    } catch (err) {
      setIsError(true);
      setError(
        err instanceof Error ? err.message : 'Une erreur inattendue est survenue'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }, []);

  return { submit, isSubmitting, isSuccess, isError, error, reset };
}
