'use client';

import { useState } from 'react';
import { CheckCircle2, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import type { TestFormation } from '@/types/admin';

interface Props {
  stagiaireId: number;
  testFinal: TestFormation | null;
  testInitial: TestFormation | null;
  onSaved: () => void;
}

export default function TestFinalSection({ stagiaireId, testFinal, testInitial, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    scoreCe: testFinal?.scoreCe ?? 0,
    scoreCo: testFinal?.scoreCo ?? 0,
    scoreEe: testFinal?.scoreEe ?? 0,
    scoreEo: testFinal?.scoreEo ?? 0,
    profilPedagogique: testFinal?.profilPedagogique ?? testInitial?.profilPedagogique ?? 'FLE',
    dateTest: testFinal?.dateTest ?? new Date().toISOString().split('T')[0],
  });

  const scoreGlobal = form.scoreCe + form.scoreCo + form.scoreEe + form.scoreEo;
  const niveauEstime =
    scoreGlobal >= 19 ? 'B2' : scoreGlobal >= 15 ? 'B1' : scoreGlobal >= 10 ? 'A2' : scoreGlobal >= 5 ? 'A1' : 'A0';

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeTest: 'final', ...form }),
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
        <h2 className="text-lg font-semibold text-slate-900">Test final</h2>
        {testFinal && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Enregistré
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date du test</label>
          <input
            type="date"
            value={form.dateTest}
            onChange={(e) => setForm({ ...form, dateTest: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Profil</label>
          <select
            value={form.profilPedagogique}
            onChange={(e) => setForm({ ...form, profilPedagogique: e.target.value as 'Alphabétisation' | 'FLE' })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            <option value="Alphabétisation">Alphabétisation</option>
            <option value="FLE">FLE</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'scoreCe', label: 'CE', auto: true },
          { key: 'scoreCo', label: 'CO', auto: true },
          { key: 'scoreEe', label: 'EE', auto: false },
          { key: 'scoreEo', label: 'EO', auto: false },
        ].map(({ key, label, auto }) => {
          const initialScore = testInitial?.[key as keyof TestFormation] as number | undefined;
          const currentScore = form[key as keyof typeof form] as number;
          const diff = initialScore != null ? currentScore - initialScore : null;

          return (
            <div key={key} className="bg-slate-50 rounded-lg p-3">
              <label className="block text-xs text-slate-500 mb-1">
                {label}
                {auto && <span className="ml-1 text-[10px] text-blue-500">(auto)</span>}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={currentScore}
                  onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-center font-bold"
                />
                <span className="text-sm text-slate-400">/20</span>
              </div>
              {diff !== null && (
                <div className={`mt-1 flex items-center gap-1 text-xs ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {diff >= 0 ? '+' : ''}{diff} pts
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparaison */}
      {testInitial && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Comparaison initial vs final
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">Test initial</p>
              <p className="text-2xl font-bold text-slate-400">
                {testInitial.scoreGlobal}/80
              </p>
              <p className="text-sm text-slate-400">{testInitial.niveauEstime}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Test final</p>
              <p className="text-2xl font-bold text-slate-900">{scoreGlobal}/80</p>
              <p className="text-sm font-medium text-blue-600">{niveauEstime}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          {saving ? 'Enregistrement...' : testFinal ? 'Mettre à jour' : 'Enregistrer le test final'}
        </button>
      </div>
    </div>
  );
}
