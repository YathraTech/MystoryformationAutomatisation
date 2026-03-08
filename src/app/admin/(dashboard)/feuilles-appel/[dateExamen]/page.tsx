'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, Trash2, Loader2, Send, Mail, RefreshCw, Check } from 'lucide-react';
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

interface FeuilleDetailData {
  examens: FeuilleAppelExamen[];
  dateExamen: string;
  summary: FeuilleAppelSummary;
}

export default function FeuilleAppelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAdminAuth();
  const isAdmin = role === 'admin';

  const dateExamen = params.dateExamen as string;

  const [data, setData] = useState<FeuilleDetailData | null>(null);
  const [examens, setExamens] = useState<FeuilleAppelExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendResult, setResendResult] = useState<{ id: number; success: boolean } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/feuilles-appel/${dateExamen}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Aucun examen trouvé pour cette date');
          } else {
            throw new Error('Erreur réseau');
          }
          return;
        }
        const json = await res.json();
        setData(json);
        setExamens(json.examens);
      } catch {
        setError('Impossible de charger la feuille d\'appel');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateExamen]);

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

  const allFilled = examens.length > 0 && examens.every((e) => e.resultat !== 'a_venir');
  const allEmailsSent = examens.length > 0 && examens.every((e) => e.resultatEmailSent);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/feuilles-appel/${dateExamen}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur');
      router.push('/admin/feuilles-appel');
    } catch {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/feuilles-appel"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux feuilles d&apos;appel
        </Link>
        <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center text-sm">
          {error}
        </div>
      </div>
    );
  }

  const filled = examens.filter((e) => e.resultat !== 'a_venir').length;

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Link
        href="/admin/feuilles-appel"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux feuilles d&apos;appel
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-orange-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Feuille d&apos;appel — {formatDateFr(dateExamen)}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span>{examens.length} candidat{examens.length > 1 ? 's' : ''}</span>
                <span className="text-slate-300">|</span>
                <span>{filled}/{examens.length} rempli{filled > 1 ? 's' : ''}</span>
                {data?.summary && (
                  <>
                    {data.summary.reussi > 0 && <span className="text-green-600">{data.summary.reussi} réussi{data.summary.reussi > 1 ? 's' : ''}</span>}
                    {data.summary.echoue > 0 && <span className="text-red-600">{data.summary.echoue} échoué{data.summary.echoue > 1 ? 's' : ''}</span>}
                    {data.summary.absent > 0 && <span className="text-orange-600">{data.summary.absent} absent{data.summary.absent > 1 ? 's' : ''}</span>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bouton supprimer */}
          <div className="relative">
            {showConfirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Archiver tous les examens ?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Archivage...' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            )}
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

              {/* Indicateur email + bouton renvoyer */}
              {examen.resultat !== 'a_venir' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {examen.resultatEmailSent ? (
                    <>
                      <span className="text-xs text-emerald-600"><Mail className="h-3 w-3" /></span>
                      <button
                        onClick={() => handleResend(examen.id)}
                        disabled={resendingId === examen.id}
                        className="text-xs text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Renvoyer le résultat par email"
                      >
                        {resendingId === examen.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </button>
                      {resendResult?.id === examen.id && (
                        <span className={`text-[10px] ${resendResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                          {resendResult.success ? 'Envoyé !' : 'Erreur'}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="text-[10px]">Non envoyé</span>
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

        {/* Bouton Valider — envoie les emails */}
        {allFilled && !validated && !allEmailsSent && (
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50">
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
              {validating ? 'Envoi des résultats...' : 'Valider et envoyer les résultats par email'}
            </button>
          </div>
        )}
        {(validated || allEmailsSent) && (
          <div className="px-5 py-4 border-t border-emerald-200 bg-emerald-50 text-center">
            <p className="text-sm font-medium text-emerald-700 flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Résultats envoyés par email
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
