'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ProgressBar, Alert } from '@/components/ui';
import { useMultiStepForm } from '@/hooks/useMultiStepForm';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import {
  inscriptionCompleteSchema,
  stepSchemas,
} from '@/lib/validations/inscription.schema';
import { FORM_STEPS } from '@/lib/utils/constants';
import type { InscriptionCompleteData } from '@/types';

import { StepPersonalInfo } from './StepPersonalInfo';
import { StepCPFInfo } from './StepCPFInfo';
import { StepFormationChoice } from './StepFormationChoice';
import { StepDisponibilites } from './StepDisponibilites';
import { StepRecap } from './StepRecap';
import { FormNavigation } from './FormNavigation';

const STORAGE_KEY = 'cpf-inscription-form';

const defaultValues: InscriptionCompleteData = {
  civilite: '' as InscriptionCompleteData['civilite'],
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  dateNaissance: '',
  adresse: '',
  codePostal: '',
  ville: '',
  numeroCPF: '',
  numeroSecuriteSociale: '',
  modeFinancement: '' as InscriptionCompleteData['modeFinancement'],
  langue: '',
  niveauActuel: '' as InscriptionCompleteData['niveauActuel'],
  objectif: '' as InscriptionCompleteData['objectif'],
  formationId: '',
  joursDisponibles: [],
  creneauxHoraires: [],
  dateDebutSouhaitee: '',
  commentaires: '',
  acceptCGU: false,
  acceptRGPD: false,
};

export function InscriptionForm() {
  const router = useRouter();
  const { currentStep, totalSteps, isFirstStep, isLastStep, nextStep, prevStep, goToStep } =
    useMultiStepForm({ totalSteps: 5 });

  const {
    value: savedData,
    setValue: saveData,
    removeValue: clearSavedData,
    isLoaded,
  } = useLocalStorage<Partial<InscriptionCompleteData>>(STORAGE_KEY, {});

  const { submit, isSubmitting, isError, error } = useFormSubmit();

  const methods = useForm<InscriptionCompleteData>({
    resolver: zodResolver(inscriptionCompleteSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, getValues, reset, watch } = methods;

  // Restore saved data once on initial load
  const hasRestored = useRef(false);
  useEffect(() => {
    if (isLoaded && !hasRestored.current) {
      hasRestored.current = true;
      if (Object.keys(savedData).length > 0) {
        reset({ ...defaultValues, ...savedData });
      }
    }
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save form data on change (writes to localStorage, no state update)
  useEffect(() => {
    const subscription = watch((data) => {
      saveData(data as Partial<InscriptionCompleteData>);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveData]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const schema = stepSchemas[currentStep - 1];
    const fields = Object.keys(schema.shape) as Array<keyof InscriptionCompleteData>;
    const result = await trigger(fields);
    return result;
  }, [currentStep, trigger]);

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      nextStep();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    prevStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToStep = (step: number) => {
    goToStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: InscriptionCompleteData) => {
    await submit(data);
    clearSavedData();
    router.push(
      `/inscription/confirmation?nom=${encodeURIComponent(data.nom)}&prenom=${encodeURIComponent(data.prenom)}&email=${encodeURIComponent(data.email)}&formation=${encodeURIComponent(data.formationId)}`
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-8">
        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          labels={FORM_STEPS.map((s) => s.shortTitle)}
        />

        {isError && error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
            {currentStep === 1 && <StepPersonalInfo />}
            {currentStep === 2 && <StepCPFInfo />}
            {currentStep === 3 && <StepFormationChoice />}
            {currentStep === 4 && <StepDisponibilites />}
            {currentStep === 5 && <StepRecap onGoToStep={handleGoToStep} />}

            <FormNavigation
              onPrev={handlePrev}
              onNext={handleNext}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              isSubmitting={isSubmitting}
            />
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
