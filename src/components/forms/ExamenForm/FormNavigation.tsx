'use client';

import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui';

interface FormNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
}

export function FormNavigation({
  onPrev,
  onNext,
  isFirstStep,
  isLastStep,
  isSubmitting,
}: FormNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
      {!isFirstStep ? (
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Précédent
        </Button>
      ) : (
        <div />
      )}

      {isLastStep ? (
        <Button
          type="submit"
          isLoading={isSubmitting}
          leftIcon={!isSubmitting ? <Check className="h-4 w-4" /> : undefined}
        >
          Valider mon inscription
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Suivant
        </Button>
      )}
    </div>
  );
}
