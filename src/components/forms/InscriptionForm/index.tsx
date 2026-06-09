'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
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
import { StepFormationChoice } from './StepFormationChoice';
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
  nationalite: '',
  villeNaissance: '',
  paysNaissance: '',
  langueMaternelle: '',
  typePieceIdentite: '' as InscriptionCompleteData['typePieceIdentite'],
  numeroPasseport: '',
  numeroCni: '',
  pieceIdentite: '',
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
    useMultiStepForm({ totalSteps: 3 });

  const {
    value: savedData,
    setValue: saveData,
    removeValue: clearSavedData,
    isLoaded,
  } = useLocalStorage<Partial<InscriptionCompleteData>>(STORAGE_KEY, {});

  const { submit, isSubmitting, isError, error } = useFormSubmit();

  // Détection admin pour sélecteur de centre
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedLieu, setSelectedLieu] = useState<string>('');

  // Pièces d'identité (gérées hors react-hook-form, uploadées après création)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role === 'admin') setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  const methods = useForm<InscriptionCompleteData>({
    resolver: zodResolver(inscriptionCompleteSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, getValues, reset, watch, setError } = methods;

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
    if (!result) return false;

    // Étape 1 : validation conditionnelle de la pièce d'identité
    if (currentStep === 1) {
      const values = getValues();
      if (values.typePieceIdentite === 'passeport' && (!values.numeroPasseport || values.numeroPasseport.length < 2)) {
        setError('numeroPasseport', { message: 'Le numéro de passeport est requis' });
        return false;
      }
      if (values.typePieceIdentite === 'cni' && (!values.numeroCni || values.numeroCni.length < 2)) {
        setError('numeroCni', { message: 'Le numéro de carte d\'identité est requis' });
        return false;
      }
      if (values.typePieceIdentite && pendingFiles.length === 0) {
        setError('pieceIdentite', { message: 'Veuillez fournir une photo de votre pièce d\'identité' });
        return false;
      }
    }

    return true;
  }, [currentStep, trigger, getValues, setError, pendingFiles]);

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
    setUploadProgress(null);
    const result = await submit(data, isAdmin && selectedLieu ? selectedLieu : undefined);
    // En cas d'erreur, submit renvoie null et l'Alert affiche le message
    if (!result) return;

    // Upload des pièces d'identité (2e temps) via le jeton d'upload
    if (result.uploadToken && pendingFiles.length > 0) {
      try {
        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i];
          setUploadProgress(`Upload ${i + 1}/${pendingFiles.length} fichier(s)...`);

          const uploadRes = await fetch('/api/inscription/upload-piece-identite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uploadToken: result.uploadToken,
              fileName: file.name,
              contentType: file.type,
            }),
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({}));
            throw new Error(err.error || `Erreur upload ${file.name}`);
          }
          const { signedUrl } = await uploadRes.json();

          const putRes = await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type, 'x-upsert': 'true' },
            body: file,
          });
          if (!putRes.ok) {
            throw new Error(`Erreur lors de l'envoi du fichier ${file.name}`);
          }
        }
      } catch (uploadError) {
        // L'inscription est déjà créée : on n'annule pas, on log seulement.
        console.error('[Inscription] Upload pièce identité échoué:', uploadError);
      } finally {
        setUploadProgress(null);
      }
    }

    setPendingFiles([]);
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

        {uploadProgress && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            {uploadProgress}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Sélecteur de centre pour les admins */}
          {isAdmin && (
            <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <label className="block text-sm font-semibold text-violet-800 mb-2">
                Attribuer à un centre de formation
              </label>
              <select
                value={selectedLieu}
                onChange={(e) => setSelectedLieu(e.target.value)}
                className="w-full rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">— Aucun centre (non attribué) —</option>
                <option value="Gagny">Centre de Gagny</option>
                <option value="Sarcelles">Centre de Sarcelles</option>
              </select>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
            {currentStep === 1 && (
              <StepPersonalInfo
                pendingFiles={pendingFiles}
                onFilesChange={setPendingFiles}
              />
            )}
            {currentStep === 2 && <StepFormationChoice />}
            {currentStep === 3 && <StepRecap onGoToStep={handleGoToStep} />}

            <FormNavigation
              onPrev={handlePrev}
              onNext={handleNext}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              isSubmitting={isSubmitting || !!uploadProgress}
            />
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
