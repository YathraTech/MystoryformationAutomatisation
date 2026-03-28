'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import Link from 'next/link';
import { ClipboardCheck, Clock, ChevronRight, Loader2, CheckCircle2, Send, Mail, RefreshCw, Check } from 'lucide-react';
import type { FeuilleAppelExamen, FeuilleAppelSummary } from '@/types/admin';

function CentreBadge({ lieu }: { lieu: string | null | undefined }) {
  if (!lieu) return null;
  const colors = lieu === 'Gagny'
    ? 'bg-blue-50 text-blue-600'
    : 'bg-purple-50 text-purple-600';
  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${colors}`}>
      {lieu}
    </span>
  );
}

function formatDateFr(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ===================== Feuille du jour =====================
function FeuilleActuelle({
  examens: initialExamens,
  dateExamen,
  isAdmin,
}: {
  examens: FeuilleAppelExamen[];
  dateExamen: string;
  isAdmin: boolean;
}) {
  const [examens, setExamens] = useState<FeuilleAppelExamen[]>(initialExamens);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendResult, setResendResult] = useState<{ id: number; success: boolean } | null>(null);

  useEffect(() => {
    setExamens(initialExamens);
  }, [initialExamens]);

  const filled = examens.filter((e) => e.resultat !== 'a_venir').length;
  const allEmailsSent = examens.length > 0 && examens.every((e) => e.resultatEmailSent);

  const handleResultat = useCallback(async (id: number, resultat: FeuilleAppelExamen['resultat']) => {
    const previous = examens.map((e) => ({ ...e }));
    setExamens((prev) => prev.map((e) => e.id === id ? { ...e, resultat } : e));

    try {
      const res = await fetch(`/api/admin/examens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultat }),
      });
      if (!res.ok) throw new Error('Erreur');
    } catch {
      setExamens(previous);
    }
  }, [examens]);

  const handleValidate = useCallback(async () => {
    setValidating(true);
    try {
      const res = await fetch(`/api/admin/feuilles-appel/${dateExamen}/send-resultats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setValidated(true);
        setExamens((prev) => prev.map((e) => ({ ...e, resultatEmailSent: true })));
      }
    } catch {
      // silently fail
    } finally {
      setValidating(false);
    }
  }, [dateExamen]);

  const handleResend = useCallback(async (examenId: number) => {
    setResendingId(examenId);
    setResendResult(null);
    try {
      const res = await fetch(`/api/admin/feuilles-appel/${dateExamen}/send-resultats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examenIds: [examenId] }),
      });
      if (res.ok) {
        setExamens((prev) => prev.map((e) => e.id === examenId ? { ...e, resultatEmailSent: true } : e));
        setResendResult({ id: examenId, success: true });
      } else {
        setResendResult({ id: examenId, success: false });
      }
    } catch {
      setResendResult({ id: examenId, success: false });
    } finally {
      setResendingId(null);
      setTimeout(() => setResendResult(null), 3000);
    }
  }, [dateExamen]);

  return (
    <div className="bg-white rounded-xl border-2 border-orange-200 overflow-hidden">
      {/* Header */}
      <div className="bg-orange-50 border-b border-orange-200 px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-orange-600" />
            <div>
              <h2 className="text-lg font-semibold text-orange-800">Feuille d&apos;appel du jour</h2>
              <p className="text-xs text-orange-600">{formatDateFr(dateExamen)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-orange-700">
              {filled}/{examens.length} rempli{filled > 1 ? 's' : ''}
            </span>
            {allEmailsSent && (
              <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 font-medium flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Emails envoyés
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Liste des candidats */}
      <div className="divide-y divide-slate-100">
        {examens.map((examen) => (
          <div key={examen.id} className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 min-w-0">
              {examen.inscriptionId ? (
                <Link
                  href={`/admin/clients/${examen.inscriptionId}`}
                  className="text-sm font-medium text-slate-800 hover:text-blue-700 hover:underline"
                >
                  {examen.prenom} {examen.nom}
                </Link>
              ) : (
                <span className="text-sm font-medium text-slate-800">
                  {examen.prenom} {examen.nom}
                </span>
              )}
              <p className="text-xs text-slate-500">
                {examen.diplome || 'Diplôme non choisi'}
                {examen.heureExamen && ` — ${examen.heureExamen}`}
              </p>
            </div>

            {isAdmin && examen.lieu && <CentreBadge lieu={examen.lieu} />}

            {/* Bouton envoi individuel / indicateur email */}
            {examen.resultat !== 'a_venir' && (
              <div className="flex items-center gap-1.5 shrink-0">
                {examen.resultatEmailSent ? (
                  <>
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                    </span>
                    <button
                      onClick={() => handleResend(examen.id)}
                      disabled={resendingId === examen.id}
                      className="text-xs text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                      title="Renvoyer le résultat par email"
                    >
                      {resendingId === examen.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleResend(examen.id)}
                    disabled={resendingId === examen.id}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
                    title="Envoyer le résultat par email"
                  >
                    {resendingId === examen.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Envoyer
                  </button>
                )}
                {resendResult?.id === examen.id && (
                  <span className={`text-[10px] ${resendResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                    {resendResult.success ? 'Envoyé !' : 'Erreur'}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleResultat(examen.id, examen.resultat === 'reussi' ? 'a_venir' : 'reussi')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  examen.resultat === 'reussi'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                Réussi
              </button>
              <button
                onClick={() => handleResultat(examen.id, examen.resultat === 'echoue' ? 'a_venir' : 'echoue')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  examen.resultat === 'echoue'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                Échoué
              </button>
              <button
                onClick={() => handleResultat(examen.id, examen.resultat === 'absent' ? 'a_venir' : 'absent')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  examen.resultat === 'absent'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-700'
                }`}
              >
                Absent
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton envoi groupé — envoie les résultats non encore envoyés */}
      {examens.some((e) => e.resultat !== 'a_venir' && !e.resultatEmailSent) && !validated && (
        <div className="px-5 py-4 border-t border-orange-200 bg-orange-50/50">
          <button
            onClick={handleValidate}
            disabled={validating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {validating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {validating
              ? 'Envoi des résultats...'
              : `Envoyer tous les résultats non envoyés (${examens.filter((e) => e.resultat !== 'a_venir' && !e.resultatEmailSent).length})`}
          </button>
        </div>
      )}
      {allEmailsSent && (
        <div className="px-5 py-4 border-t border-emerald-200 bg-emerald-50 text-center">
          <p className="text-sm font-medium text-emerald-700 flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            Tous les résultats ont été envoyés par email
          </p>
        </div>
      )}
    </div>
  );
}

// ===================== Historique =====================
function HistoriqueSection({ history }: { history: FeuilleAppelSummary[] }) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Aucune feuille d&apos;appel passée</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700">Historique des feuilles d&apos;appel</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {history.map((feuille) => (
          <Link
            key={feuille.dateExamen}
            href={`/admin/feuilles-appel/${feuille.dateExamen}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {formatDateShort(feuille.dateExamen)}
              </p>
              <p className="text-xs text-slate-500">
                {feuille.totalCandidats} candidat{feuille.totalCandidats > 1 ? 's' : ''}
                {feuille.reussi > 0 && <span className="text-green-600"> — {feuille.reussi} réussi{feuille.reussi > 1 ? 's' : ''}</span>}
                {feuille.echoue > 0 && <span className="text-red-600"> — {feuille.echoue} échoué{feuille.echoue > 1 ? 's' : ''}</span>}
                {feuille.absent > 0 && <span className="text-orange-600"> — {feuille.absent} absent{feuille.absent > 1 ? 's' : ''}</span>}
                {feuille.aVenir > 0 && <span className="text-slate-400"> — {feuille.aVenir} en attente</span>}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ===================== Page principale =====================
interface FeuilleAppelResponse {
  current: {
    examens: FeuilleAppelExamen[];
    dateExamen: string;
    summary: FeuilleAppelSummary;
  } | null;
  history: FeuilleAppelSummary[];
}

export default function FeuillesAppelPage() {
  const { role } = useAdminAuth();
  const isAdmin = role === 'admin';
  const [data, setData] = useState<FeuilleAppelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/feuilles-appel');
        if (!res.ok) throw new Error('Erreur réseau');
        const json = await res.json();
        setData(json);
      } catch {
        setError('Impossible de charger le suivi des examens');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Suivi des examens</h1>
        <p className="text-sm text-slate-500 mt-1">Suivi des résultats d&apos;examens par date</p>
      </div>

      {/* Feuille du jour */}
      {data?.current ? (
        <FeuilleActuelle
          examens={data.current.examens}
          dateExamen={data.current.dateExamen}
          isAdmin={isAdmin}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <ClipboardCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucun examen en cours aujourd&apos;hui</p>
        </div>
      )}

      {/* Historique */}
      {data?.history && (
        <HistoriqueSection history={data.history} />
      )}
    </div>
  );
}
