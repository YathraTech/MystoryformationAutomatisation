'use client';

import { useState } from 'react';
import { CheckCircle2, FileText, TrendingUp, TrendingDown, Play, Pencil } from 'lucide-react';
import type { TestFormation } from '@/types/admin';
import QcmTestRunner from './QcmTestRunner';

interface Props {
  stagiaireId: number;
  testFinal: TestFormation | null;
  testInitial: TestFormation | null;
  onSaved: () => void;
}

type Mode = 'idle' | 'qcm_ce' | 'qcm_co';

export default function TestFinalSection({ stagiaireId, testFinal, testInitial, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');

  const [scoreCe, setScoreCe] = useState(testFinal?.scoreCe ?? 0);
  const [scoreCo, setScoreCo] = useState(testFinal?.scoreCo ?? 0);
  const [scoreEe, setScoreEe] = useState(testFinal?.scoreEe ?? 0);
  const [scoreEo, setScoreEo] = useState(testFinal?.scoreEo ?? 0);
  const [profilPedagogique, setProfilPedagogique] = useState<'Alphabétisation' | 'FLE'>(
    (testFinal?.profilPedagogique as 'Alphabétisation' | 'FLE') ?? (testInitial?.profilPedagogique as 'Alphabétisation' | 'FLE') ?? 'FLE'
  );
  const [dateTest, setDateTest] = useState(testFinal?.dateTest ?? new Date().toISOString().split('T')[0]);

  const [reponsesCe, setReponsesCe] = useState<{ question: number; reponse: string; correct: boolean }[] | null>(null);
  const [reponsesCo, setReponsesCo] = useState<{ question: number; reponse: string; correct: boolean }[] | null>(null);

  const ceAutoCompleted = reponsesCe !== null;
  const coAutoCompleted = reponsesCo !== null;

  const scoreGlobal = scoreCe + scoreCo + scoreEe + scoreEo;
  const niveauEstime =
    scoreGlobal >= 19 ? 'B2' : scoreGlobal >= 15 ? 'B1' : scoreGlobal >= 10 ? 'A2' : scoreGlobal >= 5 ? 'A1' : 'A0';

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeTest: 'final',
          dateTest,
          scoreCe,
          scoreCo,
          scoreEe,
          scoreEo,
          profilPedagogique,
          reponsesCe: reponsesCe || undefined,
          reponsesCo: reponsesCo || undefined,
        }),
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // QCM mode
  if (mode === 'qcm_ce') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Test final - Compréhension Écrite (CE)</h2>
        <QcmTestRunner
          competence="CE"
          onComplete={(score, details) => { setScoreCe(score); setReponsesCe(details); setMode('idle'); }}
          onCancel={() => setMode('idle')}
        />
      </div>
    );
  }
  if (mode === 'qcm_co') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Test final - Compréhension Orale (CO)</h2>
        <QcmTestRunner
          competence="CO"
          onComplete={(score, details) => { setScoreCo(score); setReponsesCo(details); setMode('idle'); }}
          onCancel={() => setMode('idle')}
        />
      </div>
    );
  }

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
          <input type="date" value={dateTest} onChange={(e) => setDateTest(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Profil</label>
          <select value={profilPedagogique} onChange={(e) => setProfilPedagogique(e.target.value as 'Alphabétisation' | 'FLE')}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
            <option value="Alphabétisation">Alphabétisation</option>
            <option value="FLE">FLE</option>
          </select>
        </div>
      </div>

      {/* CE + CO avec boutons QCM */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-blue-700">CE</label>
            {ceAutoCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input type="number" min={0} max={20} step={0.5} value={scoreCe}
                onChange={(e) => { setScoreCe(parseFloat(e.target.value) || 0); setReponsesCe(null); }}
                className="w-20 px-3 py-2 text-sm border border-blue-200 rounded-lg text-center font-bold bg-white" />
              <span className="text-sm text-blue-400">/20</span>
            </div>
            <button onClick={() => setMode('qcm_ce')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
              <Play className="h-3 w-3" /> QCM
            </button>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-purple-700">CO</label>
            {coAutoCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input type="number" min={0} max={20} step={0.5} value={scoreCo}
                onChange={(e) => { setScoreCo(parseFloat(e.target.value) || 0); setReponsesCo(null); }}
                className="w-20 px-3 py-2 text-sm border border-purple-200 rounded-lg text-center font-bold bg-white" />
              <span className="text-sm text-purple-400">/20</span>
            </div>
            <button onClick={() => setMode('qcm_co')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">
              <Play className="h-3 w-3" /> QCM
            </button>
          </div>
        </div>
      </div>

      {/* EE + EO manuels */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: 'scoreEe', label: 'EE', value: scoreEe, setter: setScoreEe },
          { key: 'scoreEo', label: 'EO', value: scoreEo, setter: setScoreEo },
        ].map(({ key, label, value, setter }) => {
          const initialScore = testInitial?.[key as keyof TestFormation] as number | undefined;
          const diff = initialScore != null ? value - initialScore : null;
          return (
            <div key={key} className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-medium text-amber-700">{label}</label>
                <Pencil className="h-3 w-3 text-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={20} step={0.5} value={value}
                  onChange={(e) => setter(parseFloat(e.target.value) || 0)}
                  className="w-20 px-3 py-2 text-sm border border-amber-200 rounded-lg text-center font-bold bg-white" />
                <span className="text-sm text-amber-400">/20</span>
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
          <h3 className="text-sm font-medium text-slate-700 mb-3">Comparaison initial vs final</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">Test initial</p>
              <p className="text-2xl font-bold text-slate-400">{testInitial.scoreGlobal}/80</p>
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
        <button disabled={saving} onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <FileText className="h-4 w-4" />
          {saving ? 'Enregistrement...' : testFinal ? 'Mettre à jour' : 'Enregistrer le test final'}
        </button>
      </div>
    </div>
  );
}
