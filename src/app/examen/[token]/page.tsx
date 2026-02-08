'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GraduationCap, Check, AlertCircle, Loader2 } from 'lucide-react';

type DiplomeValue = 'A1' | 'A2' | 'B1' | 'B2' | 'carte_pluriannuelle' | 'carte_residence' | 'naturalisation';

interface ExamenData {
  id: number;
  civilite: string;
  nom: string;
  prenom: string;
  diplome: DiplomeValue | null;
}

const DIPLOMES: { value: DiplomeValue; label: string; category: 'niveau' | 'carte' }[] = [
  { value: 'A1', label: 'A1', category: 'niveau' },
  { value: 'A2', label: 'A2', category: 'niveau' },
  { value: 'B1', label: 'B1', category: 'niveau' },
  { value: 'B2', label: 'B2', category: 'niveau' },
  { value: 'carte_pluriannuelle', label: 'Carte pluriannuelle', category: 'carte' },
  { value: 'carte_residence', label: 'Carte de résidence', category: 'carte' },
  { value: 'naturalisation', label: 'Naturalisation', category: 'carte' },
];

export default function ExamenClientPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examen, setExamen] = useState<ExamenData | null>(null);
  const [selectedDiplome, setSelectedDiplome] = useState<DiplomeValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchExamen = async () => {
      try {
        const res = await fetch(`/api/examen/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Lien invalide ou expiré');
          } else {
            setError('Erreur lors du chargement');
          }
          return;
        }

        const data = await res.json();
        setExamen(data);

        if (data.diplome) {
          setSelectedDiplome(data.diplome);
          setSubmitted(true);
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchExamen();
  }, [token]);

  const handleSubmit = async () => {
    if (!selectedDiplome || !examen) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/examen/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diplome: selectedDiplome }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  const niveaux = DIPLOMES.filter(d => d.category === 'niveau');
  const cartes = DIPLOMES.filter(d => d.category === 'carte');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Erreur</h1>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Choix enregistré !
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            Votre choix de diplôme a été enregistré avec succès.
          </p>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-4">
            <p className="text-sm text-blue-700">
              <strong>Diplôme choisi :</strong>{' '}
              {DIPLOMES.find(d => d.value === selectedDiplome)?.label}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
            <p className="text-sm text-slate-600">
              Vous pouvez patienter, un membre de notre équipe vous prendra en charge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Choix du diplôme
          </h1>
          <p className="text-sm text-slate-500">
            Bonjour <strong>{examen?.prenom} {examen?.nom}</strong>, veuillez sélectionner le diplôme que vous souhaitez passer.
          </p>
        </div>

        {/* Selection card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="space-y-6">
            {/* Niveaux de langue */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Niveau de langue</p>
              <div className="flex flex-wrap gap-3">
                {niveaux.map((diplome) => {
                  const isSelected = selectedDiplome === diplome.value;
                  return (
                    <button
                      key={diplome.value}
                      type="button"
                      onClick={() => setSelectedDiplome(diplome.value)}
                      className={`flex items-center justify-center min-w-[70px] px-5 py-3.5 rounded-xl border-2 text-lg font-bold transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {diplome.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Types de cartes */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Objectif administratif</p>
              <div className="space-y-2">
                {cartes.map((diplome) => {
                  const isSelected = selectedDiplome === diplome.value;
                  return (
                    <button
                      key={diplome.value}
                      type="button"
                      onClick={() => setSelectedDiplome(diplome.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                        {diplome.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info box */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Important :</strong> Votre choix sera définitif et servira de preuve pour votre inscription à l&apos;examen.
              </p>
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedDiplome || submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Valider mon choix
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
