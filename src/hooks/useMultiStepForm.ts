'use client';

import { useState, useCallback } from 'react';

interface UseMultiStepFormProps {
  totalSteps: number;
  initialStep?: number;
}

interface UseMultiStepFormReturn {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

export function useMultiStepForm({
  totalSteps,
  initialStep = 1,
}: UseMultiStepFormProps): UseMultiStepFormReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const reset = useCallback(() => {
    setCurrentStep(1);
  }, []);

  return {
    currentStep,
    totalSteps,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    progress: Math.round((currentStep / totalSteps) * 100),
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}
