'use client';

import { useState, useCallback } from 'react';
import type { InscriptionCompleteData } from '@/types';

export interface InscriptionSubmitResult {
  success: boolean;
  uploadToken?: string;
  stagiaireId?: number;
  [key: string]: unknown;
}

interface UseFormSubmitReturn {
  submit: (data: InscriptionCompleteData, lieu?: string) => Promise<InscriptionSubmitResult | null>;
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

  const submit = useCallback(async (data: InscriptionCompleteData, lieu?: string): Promise<InscriptionSubmitResult | null> => {
    setIsSubmitting(true);
    setIsError(false);
    setError(null);

    try {
      const payload = lieu ? { ...data, lieu } : data;
      const response = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Une erreur est survenue');
      }

      setIsSuccess(true);
      return result as InscriptionSubmitResult;
    } catch (err) {
      setIsError(true);
      setError(
        err instanceof Error ? err.message : 'Une erreur inattendue est survenue'
      );
      return null;
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
