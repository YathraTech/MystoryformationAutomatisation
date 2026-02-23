'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProgressBar, Alert } from '@/components/ui';
import { useMultiStepForm } from '@/hooks/useMultiStepForm';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, ExternalLink } from 'lucide-react';

import { StepPersonalInfo } from './StepPersonalInfo';
import { StepRecap } from './StepRecap';
import { FormNavigation } from './FormNavigation';

const STORAGE_KEY = 'cpf-examen-form';

// Regex
const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
const postalCodeRegex = /^\d{5}$/;

// Sources de connaissance
export const SOURCES_CONNAISSANCE = [
  { value: 'google', label: 'Google' },
  { value: 'bouche_a_oreille', label: 'Bouche-à-oreille' },
  { value: 'reseaux_sociaux', label: 'Réseaux sociaux' },
  { value: 'autre', label: 'Autre' },
];

// Agences
export const AGENCES = [
  { value: 'Gagny', label: 'Gagny' },
  { value: 'Sarcelles', label: 'Sarcelles' },
];

// Schéma de validation pour l'étape 1 (informations personnelles)
const step1Schema = z.object({
  civilite: z.enum(['M.', 'Mme', 'Autre'], { message: 'Veuillez sélectionner une civilité' }),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
  telephone: z.string().min(1, 'Le téléphone est requis').regex(phoneRegex, 'Numéro invalide (format: 06 12 34 56 78 ou +33 6 12 34 56 78)'),
  adresse: z.string().min(5, 'Adresse requise'),
  codePostal: z.string().regex(postalCodeRegex, 'Code postal invalide (5 chiffres)'),
  ville: z.string().min(2, 'Ville requise'),
  nationalite: z.string().min(2, 'Nationalité requise'),
  lieuNaissance: z.string().min(2, 'Pays de naissance requis'),
  dateNaissance: z.string().min(1, 'La date de naissance est requise'),
  langueMaternelle: z.string().min(2, 'Langue maternelle requise'),
  agence: z.string().min(1, 'Agence souhaitée requise'),
  sourceConnaissance: z.string().optional(),
  pieceIdentite: z.string().optional(),
  numeroPasseport: z.string().optional(),
  numeroCni: z.string().optional(),
});

// Schéma complet (étape 2 = récap, pas de champs supplémentaires)
const examenCompleteSchema = step1Schema;

export type ExamenFormData = z.infer<typeof examenCompleteSchema>;

const stepSchemas = [step1Schema];

const FORM_STEPS = [
  { shortTitle: 'Informations' },
  { shortTitle: 'Récapitulatif' },
];

const defaultValues: ExamenFormData = {
  civilite: '' as ExamenFormData['civilite'],
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  nationalite: '',
  lieuNaissance: '',
  dateNaissance: '',
  langueMaternelle: '',
  agence: '',
  sourceConnaissance: '',
  pieceIdentite: '',
  numeroPasseport: '',
  numeroCni: '',
};

interface SubmissionResult {
  id: number;
  token: string;
  clientUrl: string;
  data: ExamenFormData; // Données soumises pour le récap
}

interface ExamenFormProps {
  forcedAgence?: string;
}

export function ExamenForm({ forcedAgence }: ExamenFormProps = {}) {
  const { currentStep, totalSteps, isFirstStep, isLastStep, nextStep, prevStep, reset: resetStep } =
    useMultiStepForm({ totalSteps: 2 }); // 2 étapes : Infos, Récap

  const {
    value: savedData,
    setValue: saveData,
    removeValue: clearSavedData,
    isLoaded,
  } = useLocalStorage<Partial<ExamenFormData>>(STORAGE_KEY, {});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const formDefaults = forcedAgence
    ? { ...defaultValues, agence: forcedAgence }
    : defaultValues;

  const methods = useForm<ExamenFormData>({
    resolver: zodResolver(examenCompleteSchema),
    defaultValues: formDefaults,
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, reset, watch, getValues } = methods;

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

  // Auto-save form data on change
  useEffect(() => {
    const subscription = watch((data) => {
      saveData(data as Partial<ExamenFormData>);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveData]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const schema = stepSchemas[currentStep - 1];
    if (!schema) return true;
    const fields = Object.keys(schema.shape) as Array<keyof ExamenFormData>;
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

  const onSubmit = async (data: ExamenFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/examen/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la soumission');
      }

      const result = await res.json();
      setSubmissionResult({ ...result, data }); // Inclure les données pour le récap
      clearSavedData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (submissionResult?.clientUrl) {
      await navigator.clipboard.writeText(submissionResult.clientUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Afficher le résultat après soumission réussie
  if (submissionResult) {
    const { data: submittedData } = submissionResult;
    const civiliteLabel = submittedData.civilite === 'M.' ? 'Monsieur' : submittedData.civilite === 'Mme' ? 'Madame' : 'Autre';

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Inscription enregistrée !
            </h2>
            <p className="text-sm text-slate-500">
              Le client doit maintenant choisir son diplôme via le lien ci-dessous.
            </p>
          </div>

          {/* Récapitulatif */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Récapitulatif</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Nom :</span>{' '}
                <span className="font-medium text-slate-800">{civiliteLabel} {submittedData.prenom} {submittedData.nom}</span>
              </div>
              <div>
                <span className="text-slate-500">Date de naissance :</span>{' '}
                <span className="font-medium text-slate-800">
                  {submittedData.dateNaissance ? new Date(submittedData.dateNaissance).toLocaleDateString('fr-FR') : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Email :</span>{' '}
                <span className="font-medium text-slate-800">{submittedData.email}</span>
              </div>
              <div>
                <span className="text-slate-500">Téléphone :</span>{' '}
                <span className="font-medium text-slate-800">{submittedData.telephone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500">Adresse :</span>{' '}
                <span className="font-medium text-slate-800">{submittedData.adresse}, {submittedData.codePostal} {submittedData.ville}</span>
              </div>
            </div>
          </div>

          {/* QR Code et Lien */}
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* QR Code */}
            <div className="p-4 bg-white border-2 border-slate-200 rounded-xl shrink-0">
              <QRCodeSVG
                value={submissionResult.clientUrl}
                size={150}
                level="H"
                includeMargin
              />
            </div>

            {/* Lien */}
            <div className="flex-1 w-full space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Lien à partager avec le client
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={submissionResult.clientUrl}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copier
                    </>
                  )}
                </button>
              </div>

              <a
                href={submissionResult.clientUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir le lien
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSubmissionResult(null);
                reset(defaultValues);
                resetStep(); // Retour à l'étape 1
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Nouvelle inscription
            </button>
          </div>

          {/* Partenaire PrepCivique */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 flex items-center gap-4">
            <a
              href="https://prepcivique.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <img
                src="/prepcivique-logo.png"
                alt="PrepCivique"
                className="h-8"
              />
            </a>
            <p className="text-xs text-slate-600">
              En vous inscrivant chez notre partenaire, obtenez des <strong className="text-blue-700">promotions</strong> et
              accédez à l&apos;un des <strong className="text-blue-700">meilleurs entraînements</strong> pour votre examen.
            </p>
          </div>
        </div>
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

        {submitError && (
          <Alert variant="error" title="Erreur">
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
            {currentStep === 1 && <StepPersonalInfo hideAgence={!!forcedAgence} />}
            {currentStep === 2 && <StepRecap data={getValues()} />}

            <div className="mt-6">
              <FormNavigation
                onPrev={handlePrev}
                onNext={handleNext}
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </form>

        <PrepCiviqueBanner />
      </div>
    </FormProvider>
  );
}

function PrepCiviqueBanner() {
  return (
    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 flex items-center gap-4">
      <a
        href="https://prepcivique.fr"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 hover:opacity-80 transition-opacity"
      >
        <img
          src="/prepcivique-logo.png"
          alt="PrepCivique"
          className="h-8"
        />
      </a>
      <p className="text-xs text-slate-600">
        En vous inscrivant chez notre partenaire, obtenez des <strong className="text-blue-700">promotions</strong> et
        accédez à l&apos;un des <strong className="text-blue-700">meilleurs entraînements</strong> pour votre examen.
      </p>
    </div>
  );
}
