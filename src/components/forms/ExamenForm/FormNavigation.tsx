'use client';

import { ArrowLeft, ArrowRight, Check, Pencil } from 'lucide-react';
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
  // Page récapitulative (dernière étape) : boutons Modifier et Valider
  if (isLastStep) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          leftIcon={<Pencil className="h-4 w-4" />}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Modifier les informations
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          leftIcon={!isSubmitting ? <Check className="h-4 w-4" /> : undefined}
          className="w-full sm:w-auto sm:flex-1 order-1 sm:order-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        >
          Valider l&apos;inscription
        </Button>
      </div>
    );
  }

  // Autres étapes : navigation standard
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

      <Button
        type="button"
        onClick={onNext}
        rightIcon={<ArrowRight className="h-4 w-4" />}
      >
        Suivant
      </Button>
    </div>
  );
}
