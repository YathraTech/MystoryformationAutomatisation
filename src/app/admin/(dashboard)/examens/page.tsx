'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatHeure } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';
import { AlertCircle, Calendar, Send, Mail, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { Examen, ExamenResultat } from '@/lib/data/examens';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type ExamenWithInscription = Examen & { inscriptionId?: number | null; examenSeul?: boolean };

type FilterType = 'tous' | 'a_planifier' | 'a_venir' | 'a_replanifier' | 'termines' | 'absent';

const FILTER_TABS: { value: FilterType; label: string; color: string }[] = [
  { value: 'tous', label: 'Tous', color: 'bg-slate-100 text-slate-700' },
  { value: 'a_planifier', label: 'À planifier', color: 'bg-amber-100 text-amber-700' },
  { value: 'a_venir', label: 'À venir', color: 'bg-blue-100 text-blue-700' },
  { value: 'a_replanifier', label: 'À replanifier', color: 'bg-red-100 text-red-700' },
  { value: 'termines', label: 'Suivi des résultats', color: 'bg-green-100 text-green-700' },
  { value: 'absent', label: 'Absents', color: 'bg-orange-100 text-orange-700' },
];

const RESULTAT_LABELS: Record<ExamenResultat, { label: string; color: string }> = {
  a_venir: { label: 'À venir', color: 'bg-slate-100 text-slate-600' },
  reussi: { label: 'Réussi', color: 'bg-green-100 text-green-700' },
  echoue: { label: 'Échoué', color: 'bg-red-100 text-red-700' },
  absent: { label: 'Absent', color: 'bg-orange-100 text-orange-700' },
};

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

export default function ExamensPage() {
  const router = useRouter();
  const { role } = useAdminAuth();
  const isAdmin = role === 'admin';
  const [examens, setExamens] = useState<ExamenWithInscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('tous');
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [relanceOpen, setRelanceOpen] = useState(false);
  const [relanceSending, setRelanceSending] = useState(false);
  const [relanceMsg, setRelanceMsg] = useState('');

  const fetchExamens = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/examens');
      if (res.ok) {
        const data = await res.json();
        setExamens(data.examens);
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExamens();
    fetch('/api/admin/staff')
      .then((res) => res.ok ? res.json() : [])
      .then((data: { id: string; prenom: string; nom: string }[]) => {
        const map: Record<string, string> = {};
        (Array.isArray(data) ? data : []).forEach((s) => { map[s.id] = `${s.prenom} ${s.nom}`; });
        setStaffMap(map);
      })
      .catch(() => {});
  }, [fetchExamens]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredExamens = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return examens.filter((examen) => {
      switch (filter) {
        case 'a_planifier':
          return !examen.dateExamen;
        case 'a_venir':
          if (!examen.dateExamen) return false;
          const examDate = new Date(examen.dateExamen);
          return examDate >= today && examen.resultat === 'a_venir';
        case 'a_replanifier':
          return examen.resultat === 'echoue';
        case 'termines':
          return examen.resultat === 'reussi';
        case 'absent':
          return examen.resultat === 'absent';
        default:
          return true;
      }
    });
  }, [examens, filter]);

  const getFilterCount = useCallback((filterType: FilterType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return examens.filter((examen) => {
      switch (filterType) {
        case 'a_planifier':
          return !examen.dateExamen;
        case 'a_venir':
          if (!examen.dateExamen) return false;
          const examDate = new Date(examen.dateExamen);
          return examDate >= today && examen.resultat === 'a_venir';
        case 'a_replanifier':
          return examen.resultat === 'echoue';
        case 'termines':
          return examen.resultat === 'reussi';
        case 'absent':
          return examen.resultat === 'absent';
        default:
          return true;
      }
    }).length;
  }, [examens]);

  // Candidats ayant passé leur examen (réussi ou échoué), dédupliqués par email.
  // Ce sont les destinataires de la relance "plateforme partenaire" (PrepCivique.fr).
  const relanceTargets = useMemo(() => {
    const map = new Map<string, ExamenWithInscription>();
    for (const examen of examens) {
      if (examen.resultat !== 'reussi' && examen.resultat !== 'echoue') continue;
      if (!examen.email) continue;
      const key = examen.email.toLowerCase();
      if (!map.has(key)) map.set(key, examen);
    }
    return Array.from(map.values());
  }, [examens]);

  const handleRelance = useCallback(async () => {
    setRelanceSending(true);
    setRelanceMsg('');
    try {
      const res = await fetch('/api/admin/examens/relance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidats: relanceTargets.map((examen) => ({
            email: examen.email,
            prenom: examen.prenom,
            nom: examen.nom,
            resultat: examen.resultat,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRelanceMsg(data.message || `Relance envoyée à ${data.sent} candidat(s)`);
        setRelanceOpen(false);
      } else {
        setRelanceMsg(data.error || "Erreur lors de l'envoi de la relance");
      }
    } catch {
      setRelanceMsg("Erreur lors de l'envoi de la relance");
    } finally {
      setRelanceSending(false);
    }
  }, [relanceTargets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Candidats d&apos;examens</h1>
        <Link
          href="/admin/planning"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Voir le planning
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filtres + relance partenaire */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TABS.map((tab) => {
            const count = getFilterCount(tab.value);
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? tab.color + ' ring-2 ring-offset-1 ring-slate-300'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/50' : 'bg-slate-100'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { setRelanceMsg(''); setRelanceOpen(true); }}
          disabled={relanceTargets.length === 0}
          title="Inviter les candidats ayant passé leur examen à rejoindre notre plateforme partenaire"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
          Relance partenaire
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {relanceTargets.length}
          </span>
        </button>
      </div>

      {relanceMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {relanceMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_180px_100px_80px_120px] border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
          <div className="px-4 py-3">Candidat</div>
          <div className="px-4 py-3">Diplôme</div>
          <div className="px-4 py-3">Date</div>
          <div className="px-4 py-3">Heure</div>
          <div className="px-4 py-3">Résultat</div>
        </div>

        {/* Body */}
        <div className="divide-y divide-slate-100">
          {filteredExamens.map((examen) => (
            <div
              key={examen.id}
              onClick={() => {
                if (examen.inscriptionId) {
                  router.push(`/admin/clients/${examen.inscriptionId}`);
                }
              }}
              className={`grid grid-cols-[1fr_180px_100px_80px_120px] transition-colors ${
                examen.inscriptionId
                  ? 'cursor-pointer hover:bg-blue-50'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 text-sm">
                    {examen.prenom} {examen.nom}
                  </span>
                  {isAdmin && <CentreBadge lieu={examen.lieu} />}
                  {examen.examenSeul && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Examen seul
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <a
                    href={`aircall://call/${examen.telephone?.replace(/\s/g, '')}`}
                    className="text-blue-600 hover:underline"
                    title="Appeler avec Aircall"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {examen.telephone}
                  </a>
                  {examen.commercialId && staffMap[examen.commercialId] && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>{staffMap[examen.commercialId]}</span>
                    </>
                  )}
                  {examen.lieu && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>{examen.lieu}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="px-4 py-3.5 text-sm text-slate-600 flex items-center">
                {examen.diplome || <span className="text-slate-300">Non défini</span>}
              </div>

              <div className="px-4 py-3.5 text-sm text-slate-600 flex items-center">
                {formatDate(examen.dateExamen)}
              </div>

              <div className="px-4 py-3.5 text-sm text-slate-600 flex items-center">
                {formatHeure(examen.heureExamen) || '-'}
              </div>

              <div className="px-4 py-3.5 flex items-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${RESULTAT_LABELS[examen.resultat].color}`}>
                  {RESULTAT_LABELS[examen.resultat].label}
                </span>
              </div>
            </div>
          ))}

          {filteredExamens.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400">
              {filter === 'tous' ? 'Aucun examen' : 'Aucun examen dans cette catégorie'}
            </div>
          )}
        </div>
      </div>

      {/* Modale de confirmation de relance partenaire */}
      {relanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-sky-600" />
                <h2 className="text-base font-semibold text-slate-800">Relance plateforme partenaire</h2>
              </div>
              <button
                onClick={() => setRelanceOpen(false)}
                disabled={relanceSending}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3 text-sm text-slate-600">
              <p>
                Un email d&apos;invitation à rejoindre notre plateforme partenaire{' '}
                <strong>PrepCivique.fr</strong> va être envoyé à{' '}
                <strong className="text-slate-800">{relanceTargets.length} candidat(s)</strong>{' '}
                ayant passé leur examen (réussi ou échoué).
              </p>
              <p className="text-xs text-slate-400">
                Les doublons d&apos;adresses email sont automatiquement ignorés.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                onClick={() => setRelanceOpen(false)}
                disabled={relanceSending}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRelance}
                disabled={relanceSending || relanceTargets.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                {relanceSending ? 'Envoi en cours...' : 'Envoyer la relance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
