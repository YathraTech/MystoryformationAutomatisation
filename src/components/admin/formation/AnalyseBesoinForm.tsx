'use client';

import { useState } from 'react';
import { CheckCircle2, Save, Sparkles, UserCheck } from 'lucide-react';
import type { AnalyseBesoin, TestFormation, StagiaireFormation, Inscription } from '@/types/admin';

const NIVEAUX_ORDRE = ['A0', 'A1', 'A2', 'B1', 'B2'] as const;

// Barème CECRL indicatif (heures cumulées par niveau)
const HOURS_PER_LEVEL_GAP: Record<number, number> = {
  0: 30,
  1: 80,
  2: 150,
  3: 250,
  4: 400,
};

function estimateHours(niveauActuel: string | null | undefined, niveauVise: string): number | null {
  if (!niveauVise) return null;
  const currentIdx = NIVEAUX_ORDRE.indexOf((niveauActuel || 'A0') as typeof NIVEAUX_ORDRE[number]);
  const targetIdx = NIVEAUX_ORDRE.indexOf(niveauVise as typeof NIVEAUX_ORDRE[number]);
  if (targetIdx === -1) return null;
  const gap = Math.max(0, targetIdx - Math.max(0, currentIdx));
  return HOURS_PER_LEVEL_GAP[gap] ?? null;
}

interface Props {
  stagiaireId: number;
  existingAnalyse: AnalyseBesoin | null;
  testInitial: TestFormation | null;
  stagiaire: StagiaireFormation;
  inscription?: Inscription | null;
  onSaved: () => void;
}

// Mapping des valeurs du formulaire public (étape 1) vers celles de l'analyse besoin
function mapModeFinancementFromInscription(m: string | undefined | null): string {
  if (!m) return '';
  if (m === 'CPF') return 'CPF';
  if (m === 'Entreprise' || m === 'PoleEmploi') return 'Mixte';
  // Personnel, Autre, autres valeurs → fonds propres
  return 'Fonds propres';
}

const OBJECTIFS = [
  'Carte de résidence longue durée',
  'Naturalisation',
  'Améliorer français pro',
  'Emploi',
  'Mobilité pro',
  'Maintien résidence',
];

const SITUATIONS = [
  'Salarié', 'Demandeur d\'emploi', 'Indépendant', 'Étudiant',
  'Retraité', 'Sans activité', 'Chef d\'entreprise', 'Autre',
];

const DISPONIBILITES = [
  '1x/sem (3h)', '2x/sem (6h)', '3x/sem (9h)', '4x/sem (12h)',
];

const CERTIFICATIONS = ['TEF IRN', 'LEVEL TEL', 'LE ROBERT'];

export default function AnalyseBesoinForm({
  stagiaireId, existingAnalyse, testInitial, stagiaire, inscription, onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const inscriptionModeFinancement = mapModeFinancementFromInscription(inscription?.modeFinancement);
  const [form, setForm] = useState({
    objectifFormation: existingAnalyse?.objectifFormation ?? [],
    niveauEstime: existingAnalyse?.niveauEstime ?? testInitial?.niveauEstime ?? '',
    methodePositionnement: existingAnalyse?.methodePositionnement ?? 'Test',
    situationProfessionnelle: existingAnalyse?.situationProfessionnelle ?? '',
    disponibilites: existingAnalyse?.disponibilites ?? [],
    situationHandicap: existingAnalyse?.situationHandicap ?? false,
    situationHandicapDetail: existingAnalyse?.situationHandicapDetail ?? '',
    dureeEstimeeFormation: existingAnalyse?.dureeEstimeeFormation ?? '',
    niveauVise: existingAnalyse?.niveauVise ?? '',
    typeCertificationVisee: existingAnalyse?.typeCertificationVisee ?? [],
    modeFinancement:
      existingAnalyse?.modeFinancement ?? inscriptionModeFinancement ?? '',
    commentaires: existingAnalyse?.commentaires ?? '',
  });

  const toggleArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/analyse-besoin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          commercialeNom: stagiaire.commercialeNom,
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
        <h2 className="text-lg font-semibold text-slate-900">Fiche d&apos;analyse de besoin</h2>
        {existingAnalyse && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Enregistrée
          </span>
        )}
      </div>

      {/* Section 1: Infos pré-remplies */}
      <div className="mb-6 bg-slate-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Informations du bénéficiaire</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">Nom:</span> <span className="font-medium">{stagiaire.nom}</span></div>
          <div><span className="text-slate-500">Prénom:</span> <span className="font-medium">{stagiaire.prenom}</span></div>
          <div><span className="text-slate-500">Date de naissance:</span> <span className="font-medium">{new Date(stagiaire.dateNaissance).toLocaleDateString('fr-FR')}</span></div>
          <div><span className="text-slate-500">Contact:</span> <span className="font-medium">{stagiaire.email} / {stagiaire.telephone}</span></div>
        </div>
      </div>

      {/* Section 2: Objectif */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-2">
          Objectif de la formation <span className="text-red-500">*</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {OBJECTIFS.map((obj) => (
            <label key={obj} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.objectifFormation.includes(obj)}
                onChange={() =>
                  setForm({ ...form, objectifFormation: toggleArray(form.objectifFormation, obj) })
                }
                className="rounded border-slate-300"
              />
              {obj}
            </label>
          ))}
        </div>
      </div>

      {/* Section 3: Niveau */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Niveau estimé (pré-rempli depuis test)
          </label>
          <input
            type="text"
            value={form.niveauEstime}
            readOnly
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Méthode de positionnement <span className="text-red-500">*</span>
          </label>
          <select
            value={form.methodePositionnement}
            onChange={(e) => setForm({ ...form, methodePositionnement: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            <option value="Test">Test</option>
            <option value="Attestation de niveau">Attestation de niveau</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Section 4: Situation */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Situation du bénéficiaire</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Situation professionnelle <span className="text-red-500">*</span>
            </label>
            <select
              value={form.situationProfessionnelle}
              onChange={(e) => setForm({ ...form, situationProfessionnelle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">Sélectionner</option>
              {SITUATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Disponibilités <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1">
              {DISPONIBILITES.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.disponibilites.includes(d)}
                    onChange={() =>
                      setForm({ ...form, disponibilites: toggleArray(form.disponibilites, d) })
                    }
                    className="rounded border-slate-300"
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.situationHandicap}
              onChange={(e) => setForm({ ...form, situationHandicap: e.target.checked })}
              className="rounded border-slate-300"
            />
            Situation de handicap
          </label>
          {form.situationHandicap && (
            <textarea
              placeholder="Précisez..."
              value={form.situationHandicapDetail}
              onChange={(e) => setForm({ ...form, situationHandicapDetail: e.target.value })}
              className="mt-2 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              rows={2}
            />
          )}
        </div>
      </div>

      {/* Section 5: Analyse */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Analyse du besoin</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Durée estimée (heures) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.dureeEstimeeFormation}
              onChange={(e) => setForm({ ...form, dureeEstimeeFormation: e.target.value })}
              placeholder="Ex: 60"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />

            {/* Estimation automatique (CECRL) */}
            {(() => {
              const auto = estimateHours(form.niveauEstime, form.niveauVise);
              if (auto === null) {
                return (
                  <p className="mt-1.5 text-[11px] text-slate-400 italic">
                    Renseignez le niveau visé pour voir l&apos;estimation automatique.
                  </p>
                );
              }
              return (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, dureeEstimeeFormation: String(auto) })}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-md px-2 py-1 transition-colors"
                  title="Utiliser cette valeur"
                >
                  <Sparkles className="h-3 w-3" />
                  Estimation auto : <strong>{auto}h</strong>
                  <span className="text-indigo-400">
                    ({form.niveauEstime || 'A0'} → {form.niveauVise})
                  </span>
                </button>
              );
            })()}

            {/* Sélection faite par l'inscrit au moment de l'inscription */}
            {stagiaire.heuresPrevues && stagiaire.heuresPrevues > 0 && (
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, dureeEstimeeFormation: String(stagiaire.heuresPrevues) })
                }
                className="mt-1 ml-0 inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-md px-2 py-1 transition-colors"
                title="Utiliser cette valeur"
              >
                <UserCheck className="h-3 w-3" />
                Choix de l&apos;inscrit : <strong>{stagiaire.heuresPrevues}h</strong>
              </button>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Niveau visé <span className="text-red-500">*</span>
            </label>
            <select
              value={form.niveauVise}
              onChange={(e) => setForm({ ...form, niveauVise: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">Sélectionner</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Certification visée <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1">
              {CERTIFICATIONS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.typeCertificationVisee.includes(c)}
                    onChange={() =>
                      setForm({
                        ...form,
                        typeCertificationVisee: toggleArray(form.typeCertificationVisee, c),
                      })
                    }
                    className="rounded border-slate-300"
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Mode de financement <span className="text-red-500">*</span>
            </label>
            <select
              value={form.modeFinancement}
              onChange={(e) => setForm({ ...form, modeFinancement: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">Sélectionner</option>
              <option value="CPF">CPF</option>
              <option value="Fonds propres">Fonds propres</option>
              <option value="Mixte">Mixte</option>
            </select>
            {inscription?.modeFinancement && (
              <p className="mt-1.5 text-[11px] text-slate-500">
                Choix à l&apos;inscription : <strong>{inscription.modeFinancement}</strong>
                {inscriptionModeFinancement && (
                  <> → mappé en <strong>{inscriptionModeFinancement}</strong></>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-slate-500 mb-1">Commentaires</label>
          <textarea
            value={form.commentaires}
            onChange={(e) => setForm({ ...form, commentaires: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement...' : existingAnalyse ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
