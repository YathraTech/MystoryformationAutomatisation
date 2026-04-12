'use client';

import { useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import type { AnalyseBesoin, TestFormation, StagiaireFormation } from '@/types/admin';

interface Props {
  stagiaireId: number;
  existingAnalyse: AnalyseBesoin | null;
  testInitial: TestFormation | null;
  stagiaire: StagiaireFormation;
  onSaved: () => void;
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
  stagiaireId, existingAnalyse, testInitial, stagiaire, onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
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
    modeFinancement: existingAnalyse?.modeFinancement ?? '',
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
        <h2 className="text-lg font-semibold text-slate-900">Fiche d'analyse de besoin</h2>
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
