'use client';

import { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import type { Evaluation, TestFormation, AnalyseBesoin, StagiaireFormation } from '@/types/admin';

interface Props {
  stagiaireId: number;
  existingEval: Evaluation | null;
  testInitial: TestFormation | null;
  analyse: AnalyseBesoin | null;
  stagiaire: StagiaireFormation;
  onSaved: () => void;
}

export default function EvaluationInitialeForm({
  stagiaireId, existingEval, testInitial, analyse, stagiaire, onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [recueil, setRecueil] = useState({
    scolarisationFrance: existingEval?.scolarisationFrance ?? false,
    scolarisationEtranger: existingEval?.scolarisationEtranger ?? false,
    alphabetisation: existingEval?.alphabetisation ?? false,
    coursFrancais: existingEval?.coursFrancais ?? false,
    coursFrancaisDetail: existingEval?.coursFrancaisDetail ?? '',
    diplomesLangues: existingEval?.diplomesLangues ?? '',
    anglais: existingEval?.anglais ?? false,
    languesParlees: existingEval?.languesParlees ?? '',
    usageOrdinateur: existingEval?.usageOrdinateur ?? true,
    maitriseClavier: existingEval?.maitriseClavier ?? true,
    smartphoneTablette: existingEval?.smartphoneTablette ?? false,
    ordinateurMaison: existingEval?.ordinateurMaison ?? false,
    accesInternet: existingEval?.accesInternet ?? false,
    utilisationBoiteMail: existingEval?.utilisationBoiteMail ?? false,
    sessionOrdinateur: existingEval?.sessionOrdinateur ?? false,
    motivation: existingEval?.motivation ?? '',
    apresFormation: existingEval?.apresFormation ?? '',
    besoinsVieQuotidienne: existingEval?.besoinsVieQuotidienne ?? 0,
    besoinsVieProfessionnelle: existingEval?.besoinsVieProfessionnelle ?? 0,
    certificationVisee: existingEval?.certificationVisee ?? true,
    certificationViseeDetail: existingEval?.certificationViseeDetail ?? 'TEF IRN',
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeEvaluation: 'initiale',
          recueil,
          signatureIntervenant: stagiaire.commercialeNom,
        }),
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Évaluation initiale</h2>
        {existingEval && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Générée
          </span>
        )}
      </div>

      {/* Résultats test (auto) */}
      {testInitial && (
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-700 mb-2">
            Résultats du test initial (automatique)
          </h3>
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { label: 'CE', score: testInitial.scoreCe },
              { label: 'CO', score: testInitial.scoreCo },
              { label: 'EE', score: testInitial.scoreEe },
              { label: 'EO', score: testInitial.scoreEo },
              { label: 'Global', score: testInitial.scoreGlobal },
            ].map(({ label, score }) => (
              <div key={label} className="bg-white rounded-lg p-2">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">
                  {score}/{label === 'Global' ? 80 : 20}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center mt-2 text-sm font-medium text-blue-700">
            Niveau: {testInitial.niveauEstime} | Profil: {testInitial.profilPedagogique}
          </p>
        </div>
      )}

      {/* Page 1: Recueil d'informations */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-700">
          Recueil d'informations complémentaires
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'scolarisationFrance', label: 'Scolarisation en France' },
            { key: 'scolarisationEtranger', label: 'Scolarisation à l\'étranger' },
            { key: 'alphabetisation', label: 'Alphabétisation' },
            { key: 'coursFrancais', label: 'Cours de français suivis' },
            { key: 'anglais', label: 'Parle anglais' },
            { key: 'usageOrdinateur', label: 'Usage ordinateur' },
            { key: 'maitriseClavier', label: 'Maîtrise du clavier' },
            { key: 'smartphoneTablette', label: 'Smartphone / tablette' },
            { key: 'ordinateurMaison', label: 'Ordinateur à la maison' },
            { key: 'accesInternet', label: 'Accès internet' },
            { key: 'utilisationBoiteMail', label: 'Utilise boîte mail' },
            { key: 'sessionOrdinateur', label: 'Session ordinateur' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={recueil[key as keyof typeof recueil] as boolean}
                onChange={(e) =>
                  setRecueil({ ...recueil, [key]: e.target.checked })
                }
                className="rounded border-slate-300"
              />
              {label}
            </label>
          ))}
        </div>

        {recueil.coursFrancais && (
          <input
            type="text"
            placeholder="Précisez (où, quand)"
            value={recueil.coursFrancaisDetail}
            onChange={(e) => setRecueil({ ...recueil, coursFrancaisDetail: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Diplômes de langues</label>
            <input
              type="text"
              placeholder="DELF, DALF, TCF..."
              value={recueil.diplomesLangues}
              onChange={(e) => setRecueil({ ...recueil, diplomesLangues: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Langues parlées / écrites</label>
            <input
              type="text"
              value={recueil.languesParlees}
              onChange={(e) => setRecueil({ ...recueil, languesParlees: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Motivation : pourquoi apprendre le français ? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={recueil.motivation}
            onChange={(e) => setRecueil({ ...recueil, motivation: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Besoins vie quotidienne (0-5)
            </label>
            <input
              type="number"
              min={0}
              max={5}
              value={recueil.besoinsVieQuotidienne}
              onChange={(e) =>
                setRecueil({ ...recueil, besoinsVieQuotidienne: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Besoins vie professionnelle (0-5)
            </label>
            <input
              type="number"
              min={0}
              max={5}
              value={recueil.besoinsVieProfessionnelle}
              onChange={(e) =>
                setRecueil({ ...recueil, besoinsVieProfessionnelle: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          {saving ? 'Génération...' : existingEval ? 'Mettre à jour' : 'Générer l\'évaluation initiale'}
        </button>
      </div>
    </div>
  );
}
