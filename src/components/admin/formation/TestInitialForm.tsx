'use client';

import { useState } from 'react';
import { CheckCircle2, FileText, Play, Pencil, Settings } from 'lucide-react';
import Link from 'next/link';
import type { TestFormation } from '@/types/admin';
import QcmTestRunner from './QcmTestRunner';
import TestResultsDetail from './TestResultsDetail';

interface Props {
  stagiaireId: number;
  existingTest: TestFormation | null;
  onSaved: () => void;
}

type Mode = 'idle' | 'qcm_ce' | 'qcm_co' | 'manual';

const PROFIL_OPTIONS = ['Alphabétisation', 'FLE'] as const;

export default function TestInitialForm({ stagiaireId, existingTest, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');

  // Scores
  const [scoreCe, setScoreCe] = useState(existingTest?.scoreCe ?? 0);
  const [scoreCo, setScoreCo] = useState(existingTest?.scoreCo ?? 0);
  const [scoreEe, setScoreEe] = useState(existingTest?.scoreEe ?? 0);
  const [scoreEo, setScoreEo] = useState(existingTest?.scoreEo ?? 0);
  const [profilPedagogique, setProfilPedagogique] = useState<'Alphabétisation' | 'FLE'>(
    (existingTest?.profilPedagogique as 'Alphabétisation' | 'FLE') ?? 'FLE'
  );
  const [dateTest, setDateTest] = useState(
    existingTest?.dateTest ?? new Date().toISOString().split('T')[0]
  );

  // Résultats QCM détaillés
  const [reponsesCe, setReponsesCe] = useState<{ question: number; reponse: string; correct: boolean }[] | null>(
    existingTest?.reponsesCe ?? null
  );
  const [reponsesCo, setReponsesCo] = useState<{ question: number; reponse: string; correct: boolean }[] | null>(
    existingTest?.reponsesCo ?? null
  );

  // Indicateurs de test passé
  const ceAutoCompleted = reponsesCe !== null;
  const coAutoCompleted = reponsesCo !== null;

  const scoreGlobal = scoreCe + scoreCo + scoreEe + scoreEo;
  const niveauEstime =
    scoreGlobal >= 19 ? 'B2' : scoreGlobal >= 15 ? 'B1' : scoreGlobal >= 10 ? 'A2' : scoreGlobal >= 5 ? 'A1' : 'A0';

  const handleCeComplete = (score: number, details: { question: number; reponse: string; correct: boolean }[]) => {
    setScoreCe(score);
    setReponsesCe(details);
    setMode('idle');
  };

  const handleCoComplete = (score: number, details: { question: number; reponse: string; correct: boolean }[]) => {
    setScoreCo(score);
    setReponsesCo(details);
    setMode('idle');
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeTest: 'initial',
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

  // Mode QCM actif : afficher le runner
  if (mode === 'qcm_ce') {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Test initial - Compréhension Écrite (CE)
          </h2>
        </div>
        <QcmTestRunner
          competence="CE"
          typeTest="initial"
          onComplete={handleCeComplete}
          onCancel={() => setMode('idle')}
        />
      </div>
    );
  }

  if (mode === 'qcm_co') {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Test initial - Compréhension Orale (CO)
          </h2>
        </div>
        <QcmTestRunner
          competence="CO"
          typeTest="initial"
          onComplete={handleCoComplete}
          onCancel={() => setMode('idle')}
        />
      </div>
    );
  }

  // Mode normal
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Test initial</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/suivi-formation/qcm"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Settings className="h-3 w-3" />
            Gérer les questions
          </Link>
          {existingTest && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Enregistré
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date du test</label>
          <input
            type="date"
            value={dateTest}
            onChange={(e) => setDateTest(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Profil pédagogique</label>
          <select
            value={profilPedagogique}
            onChange={(e) => setProfilPedagogique(e.target.value as 'Alphabétisation' | 'FLE')}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {PROFIL_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scores par épreuve */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Scores par épreuve</h3>

        {/* CE — Correction automatique */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-medium text-blue-700">
                  Compréhension Écrite (CE)
                </label>
                <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                  Correction auto
                </span>
              </div>
              {ceAutoCompleted && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={scoreCe}
                  onChange={(e) => {
                    setScoreCe(parseFloat(e.target.value) || 0);
                    setReponsesCe(null); // Reset auto si modifié manuellement
                  }}
                  className="w-20 px-3 py-2 text-sm border border-blue-200 rounded-lg text-center font-bold bg-white"
                />
                <span className="text-sm text-blue-400">/20</span>
              </div>
              <button
                onClick={() => setMode('qcm_ce')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                <Play className="h-3 w-3" />
                {ceAutoCompleted ? 'Relancer' : 'Lancer QCM'}
              </button>
            </div>
            {ceAutoCompleted && reponsesCe && (
              <p className="text-[10px] text-blue-500 mt-2">
                {reponsesCe.filter((r) => r.correct).length}/{reponsesCe.length} bonnes réponses
              </p>
            )}
          </div>

          {/* CO — Correction automatique */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-medium text-purple-700">
                  Compréhension Orale (CO)
                </label>
                <span className="ml-2 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                  Correction auto
                </span>
              </div>
              {coAutoCompleted && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={scoreCo}
                  onChange={(e) => {
                    setScoreCo(parseFloat(e.target.value) || 0);
                    setReponsesCo(null);
                  }}
                  className="w-20 px-3 py-2 text-sm border border-purple-200 rounded-lg text-center font-bold bg-white"
                />
                <span className="text-sm text-purple-400">/20</span>
              </div>
              <button
                onClick={() => setMode('qcm_co')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"
              >
                <Play className="h-3 w-3" />
                {coAutoCompleted ? 'Relancer' : 'Lancer QCM'}
              </button>
            </div>
            {coAutoCompleted && reponsesCo && (
              <p className="text-[10px] text-purple-500 mt-2">
                {reponsesCo.filter((r) => r.correct).length}/{reponsesCo.length} bonnes réponses
              </p>
            )}
          </div>
        </div>

        {/* EE + EO — Correction manuelle */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-medium text-amber-700">
                Expression Écrite (EE)
              </label>
              <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
                Saisie manuelle
              </span>
              <Pencil className="h-3 w-3 text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={scoreEe}
                onChange={(e) => setScoreEe(parseFloat(e.target.value) || 0)}
                className="w-20 px-3 py-2 text-sm border border-amber-200 rounded-lg text-center font-bold bg-white"
              />
              <span className="text-sm text-amber-400">/20</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-medium text-amber-700">
                Expression Orale (EO)
              </label>
              <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
                Saisie manuelle
              </span>
              <Pencil className="h-3 w-3 text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={scoreEo}
                onChange={(e) => setScoreEo(parseFloat(e.target.value) || 0)}
                className="w-20 px-3 py-2 text-sm border border-amber-200 rounded-lg text-center font-bold bg-white"
              />
              <span className="text-sm text-amber-400">/20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Résultat global */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-700 font-medium">Score global</p>
          <p className="text-4xl font-bold text-blue-900">{scoreGlobal}<span className="text-xl text-blue-400">/80</span></p>
          <div className="flex gap-4 mt-1 text-xs text-blue-500">
            <span>CE: {scoreCe}</span>
            <span>CO: {scoreCo}</span>
            <span>EE: {scoreEe}</span>
            <span>EO: {scoreEo}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-blue-700 font-medium">Niveau estimé</p>
          <p className="text-4xl font-bold text-blue-900">{niveauEstime}</p>
          <p className="text-xs text-blue-500 mt-1">
            {ceAutoCompleted ? '✓ CE auto' : '○ CE manuel'} | {coAutoCompleted ? '✓ CO auto' : '○ CO manuel'}
          </p>
        </div>
      </div>

      {/* Détail des réponses (consultable) */}
      {existingTest && (
        <TestResultsDetail test={existingTest} type="initial" />
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          {saving ? 'Enregistrement...' : existingTest ? 'Mettre à jour' : 'Enregistrer le test'}
        </button>
      </div>
    </div>
  );
}
