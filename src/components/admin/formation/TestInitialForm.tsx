'use client';

import { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import type { TestFormation } from '@/types/admin';

interface Props {
  stagiaireId: number;
  existingTest: TestFormation | null;
  onSaved: () => void;
}

const PROFIL_OPTIONS = ['Alphabétisation', 'FLE'] as const;

export default function TestInitialForm({ stagiaireId, existingTest, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    scoreCe: existingTest?.scoreCe ?? 0,
    scoreCo: existingTest?.scoreCo ?? 0,
    scoreEe: existingTest?.scoreEe ?? 0,
    scoreEo: existingTest?.scoreEo ?? 0,
    profilPedagogique: existingTest?.profilPedagogique ?? 'FLE',
    dateTest: existingTest?.dateTest ?? new Date().toISOString().split('T')[0],
  });

  const scoreGlobal = form.scoreCe + form.scoreCo + form.scoreEe + form.scoreEo;
  const niveauEstime =
    scoreGlobal >= 19
      ? 'B2'
      : scoreGlobal >= 15
        ? 'B1'
        : scoreGlobal >= 10
          ? 'A2'
          : scoreGlobal >= 5
            ? 'A1'
            : 'A0';

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeTest: 'initial',
          ...form,
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
        <h2 className="text-lg font-semibold text-slate-900">Test initial</h2>
        {existingTest && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Enregistré
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date du test
          </label>
          <input
            type="date"
            value={form.dateTest}
            onChange={(e) => setForm({ ...form, dateTest: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Profil pédagogique
          </label>
          <select
            value={form.profilPedagogique}
            onChange={(e) => setForm({ ...form, profilPedagogique: e.target.value as 'Alphabétisation' | 'FLE' })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {PROFIL_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Scores par épreuve</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'scoreCe', label: 'Compréhension Écrite (CE)', auto: true },
            { key: 'scoreCo', label: 'Compréhension Orale (CO)', auto: true },
            { key: 'scoreEe', label: 'Expression Écrite (EE)', auto: false },
            { key: 'scoreEo', label: 'Expression Orale (EO)', auto: false },
          ].map(({ key, label, auto }) => (
            <div key={key} className="bg-slate-50 rounded-lg p-3">
              <label className="block text-xs text-slate-500 mb-1">
                {label}
                {auto && (
                  <span className="ml-1 text-[10px] text-blue-500">(correction auto)</span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={form[key as keyof typeof form]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center font-bold"
                />
                <span className="text-sm text-slate-400">/20</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Résultat */}
      <div className="mt-4 bg-blue-50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-700 font-medium">Score global</p>
          <p className="text-3xl font-bold text-blue-900">{scoreGlobal}/80</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-blue-700 font-medium">Niveau estimé</p>
          <p className="text-3xl font-bold text-blue-900">{niveauEstime}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          {saving ? 'Enregistrement...' : existingTest ? 'Mettre à jour' : 'Enregistrer le test'}
        </button>
      </div>
    </div>
  );
}
