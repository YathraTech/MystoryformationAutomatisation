'use client';

import { useState, useEffect, ElementType } from 'react';
import { useParams } from 'next/navigation';
import { GraduationCap, Check, AlertCircle, Loader2, BookOpen, FileText, Award } from 'lucide-react';

interface ExamenData {
  id: number;
  civilite: string;
  nom: string;
  prenom: string;
  diplome: string | null;
}

interface ExamType {
  id: number;
  code: string;
  label: string;
  description: string | null;
  icon: string;
  color: string;
  visible: boolean;
  ordre: number;
}

interface ExamOption {
  id: number;
  code: string;
  label: string;
  description: string | null;
  categorie: string | null;
}

// Map des icônes disponibles
const ICON_MAP: Record<string, ElementType> = {
  BookOpen,
  FileText,
  GraduationCap,
  Award,
};

// Options de motivation
const MOTIVATION_OPTIONS = [
  { value: 'nationalite_francaise', label: 'Accès à la nationalité française' },
  { value: 'carte_resident', label: 'Demande de carte de résident' },
  { value: 'titre_sejour', label: 'Demande de titre de séjour' },
  { value: 'autre', label: 'Autre(s)' },
];

export default function ExamenClientPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examen, setExamen] = useState<ExamenData | null>(null);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null);
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ExamOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedSelection, setSavedSelection] = useState<{ type: string; option: string } | null>(null);
  const [selectedMotivation, setSelectedMotivation] = useState<string>('');
  const [motivationAutre, setMotivationAutre] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both examen data and exam types
        const [examenRes, typesRes] = await Promise.all([
          fetch(`/api/examen/${token}`),
          fetch('/api/public/exam-types'),
        ]);

        if (!examenRes.ok) {
          if (examenRes.status === 404) {
            setError('Lien invalide ou expiré');
          } else {
            setError('Erreur lors du chargement');
          }
          return;
        }

        const examenData = await examenRes.json();
        setExamen(examenData);

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setExamTypes(typesData.types || []);
        }

        if (examenData.diplome) {
          // Parse saved diplome (format: "TYPE_CODE:OPTION_CODE")
          const parts = examenData.diplome.split(':');
          if (parts.length === 2) {
            setSavedSelection({ type: parts[0], option: parts[1] });
          } else {
            setSavedSelection({ type: examenData.diplome, option: '' });
          }
          setSubmitted(true);
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Fetch options when exam type is selected
  const handleSelectExamType = async (examType: ExamType) => {
    setSelectedExamType(examType);
    setSelectedOption(null);
    setExamOptions([]);
    setLoadingOptions(true);

    try {
      const res = await fetch(`/api/public/exam-types/${examType.id}/options`);
      if (res.ok) {
        const data = await res.json();
        setExamOptions(data.options || []);
      }
    } catch {
      console.error('Error fetching options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedExamType || !examen) return;

    // Si des options sont disponibles, une doit être sélectionnée
    if (examOptions.length > 0 && !selectedOption) return;

    // Motivation obligatoire
    if (!selectedMotivation) return;

    // Si "autre" sélectionné, le texte est obligatoire
    if (selectedMotivation === 'autre' && !motivationAutre.trim()) return;

    setSubmitting(true);
    try {
      // Format: "TYPE_CODE:OPTION_CODE" ou juste "TYPE_CODE" si pas d'options
      const diplome = selectedOption
        ? `${selectedExamType.code}:${selectedOption.code}`
        : selectedExamType.code;

      const res = await fetch(`/api/examen/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diplome,
          motivation: selectedMotivation,
          motivationAutre: selectedMotivation === 'autre' ? motivationAutre.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      setSavedSelection({
        type: selectedExamType.code,
        option: selectedOption?.code || '',
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedLabel = () => {
    if (!savedSelection) return '';
    const examType = examTypes.find((e) => e.code === savedSelection.type);
    if (savedSelection.option) {
      return `${examType?.label || savedSelection.type} - ${savedSelection.option}`;
    }
    return examType?.label || savedSelection.type;
  };

  const getIconComponent = (iconName: string): ElementType => {
    return ICON_MAP[iconName] || BookOpen;
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { selected: string; icon: string; text: string; desc: string }> = {
      blue: {
        selected: 'border-blue-500 bg-blue-50 ring-4 ring-blue-200',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-700',
        desc: 'text-blue-600',
      },
      emerald: {
        selected: 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-200',
        icon: 'bg-emerald-100 text-emerald-600',
        text: 'text-emerald-700',
        desc: 'text-emerald-600',
      },
      purple: {
        selected: 'border-purple-500 bg-purple-50 ring-4 ring-purple-200',
        icon: 'bg-purple-100 text-purple-600',
        text: 'text-purple-700',
        desc: 'text-purple-600',
      },
      orange: {
        selected: 'border-orange-500 bg-orange-50 ring-4 ring-orange-200',
        icon: 'bg-orange-100 text-orange-600',
        text: 'text-orange-700',
        desc: 'text-orange-600',
      },
      red: {
        selected: 'border-red-500 bg-red-50 ring-4 ring-red-200',
        icon: 'bg-red-100 text-red-600',
        text: 'text-red-700',
        desc: 'text-red-600',
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Erreur</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Choix enregistré !</h1>
          <p className="text-slate-500 mb-6">
            Votre choix d&apos;examen a été enregistré avec succès.
          </p>
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 mb-6">
            <p className="text-lg font-semibold text-blue-700">{getSelectedLabel()}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200">
            <p className="text-sm text-slate-600">
              Vous pouvez fermer cette page. Un membre de notre équipe vous contactera prochainement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Choisissez votre examen</h1>
          <p className="text-lg text-slate-500">
            Bonjour{' '}
            <span className="font-semibold text-slate-700">
              {examen?.prenom} {examen?.nom}
            </span>
          </p>
        </div>

        {/* Étape 1 : Sélection du type d'examen */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">1. Choisissez le type d&apos;examen</h2>
          <div className={`grid grid-cols-1 ${examTypes.length === 2 ? 'md:grid-cols-2' : examTypes.length >= 3 ? 'md:grid-cols-3' : ''} gap-4`}>
            {examTypes.map((exam) => {
              const isSelected = selectedExamType?.id === exam.id;
              const Icon = getIconComponent(exam.icon);
              const colorClasses = getColorClasses(exam.color);

              return (
                <button
                  key={exam.code}
                  type="button"
                  onClick={() => handleSelectExamType(exam)}
                  className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-lg ${
                    isSelected
                      ? colorClasses.selected
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Check mark for selected */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center">
                      <Check className={`h-4 w-4 ${colorClasses.text}`} />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      isSelected ? colorClasses.icon : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Label */}
                  <h3
                    className={`text-lg font-bold mb-1 ${
                      isSelected ? colorClasses.text : 'text-slate-800'
                    }`}
                  >
                    {exam.label}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-xs text-center leading-relaxed ${
                      isSelected ? colorClasses.desc : 'text-slate-500'
                    }`}
                  >
                    {exam.description || ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cas où aucun type d'examen n'est configuré */}
        {examTypes.length === 0 && (
          <div className="text-center py-8 bg-amber-50 rounded-2xl border border-amber-200 mb-8">
            <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
            <p className="text-amber-800">Aucun type d&apos;examen n&apos;est disponible pour le moment.</p>
          </div>
        )}

        {/* Étape 2 : Sélection de l'option d'examen */}
        {selectedExamType && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              2. Choisissez votre niveau visé / mention visée
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({selectedExamType.label})
              </span>
            </h2>

            {loadingOptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="ml-2 text-slate-500">Chargement des options...</span>
              </div>
            ) : examOptions.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {examOptions.map((option) => {
                  const isSelected = selectedOption?.id === option.id;
                  const colorClasses = getColorClasses(selectedExamType.color);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedOption(option)}
                      className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? colorClasses.selected
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                          <Check className={`h-3 w-3 ${colorClasses.text}`} />
                        </div>
                      )}
                      <span
                        className={`text-lg font-bold ${
                          isSelected ? colorClasses.text : 'text-slate-800'
                        }`}
                      >
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-xs text-slate-500 mt-1 text-center">
                          {option.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500">
                  Aucune option configurée pour {selectedExamType.label}.
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Vous pouvez confirmer directement.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Étape 3 : Motivation */}
        {selectedExamType && (examOptions.length === 0 || selectedOption) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              3. Quelle est votre motivation ?
              <span className="text-red-500 ml-1">*</span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {MOTIVATION_OPTIONS.map((option) => {
                const isSelected = selectedMotivation === option.value;
                const colorClasses = getColorClasses(selectedExamType?.color || 'blue');

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedMotivation(option.value)}
                    className={`relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? colorClasses.selected
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                        <Check className={`h-3 w-3 ${colorClasses.text}`} />
                      </div>
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? colorClasses.text : 'text-slate-700'
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Zone de texte si "Autre" sélectionné */}
            {selectedMotivation === 'autre' && (
              <div className="mt-4">
                <label htmlFor="motivationAutre" className="block text-sm font-medium text-slate-700 mb-2">
                  Précisez votre motivation <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="motivationAutre"
                  value={motivationAutre}
                  onChange={(e) => setMotivationAutre(e.target.value)}
                  placeholder="Décrivez votre motivation..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none text-slate-700"
                />
              </div>
            )}
          </div>
        )}

        {/* Récapitulatif */}
        {selectedExamType && (examOptions.length === 0 || selectedOption) && selectedMotivation && (
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 mb-6">
            <p className="text-sm text-blue-800 text-center font-medium">
              Votre sélection : <strong>{selectedExamType.label}</strong>
              {selectedOption && (
                <> - <strong>{selectedOption.label}</strong></>
              )}
            </p>
            <p className="text-xs text-blue-600 text-center mt-2">
              Motivation : <strong>
                {selectedMotivation === 'autre'
                  ? motivationAutre || 'Autre'
                  : MOTIVATION_OPTIONS.find(m => m.value === selectedMotivation)?.label}
              </strong>
            </p>
          </div>
        )}

        {/* Info box */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
          <p className="text-sm text-amber-800 text-center">
            <strong>Important :</strong> Votre choix sera définitif et servira de preuve pour votre inscription.
          </p>
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !selectedExamType ||
            (examOptions.length > 0 && !selectedOption) ||
            !selectedMotivation ||
            (selectedMotivation === 'autre' && !motivationAutre.trim()) ||
            submitting
          }
          className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {submitting ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              Validation en cours...
            </>
          ) : (
            <>
              <Check className="h-6 w-6" />
              Confirmer mon choix
            </>
          )}
        </button>
      </div>
    </div>
  );
}
