'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStats } from '@/hooks/useStats';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import StatusBadge from '@/components/admin/StatusBadge';
import RevenueChart from '@/components/admin/RevenueChart';
import Link from 'next/link';
import type { CommercialRevenue, FeuilleAppelData, FeuilleAppelExamen } from '@/types/admin';
import { GraduationCap, BookOpen, Eye, EyeOff, Trophy, Sparkles, PartyPopper, Users, MapPin, Target, Crown, ShieldCheck, TrendingUp, TrendingDown, ClipboardCheck, RefreshCw, Check } from 'lucide-react';

// États des examens pour le tableau de bord (2 états uniquement + absent)
function getExamenEtat(examen: { resultat: string; diplome: string | null; configured?: boolean }): { label: string; color: string } {
  if (examen.resultat === 'absent') {
    return { label: 'Absent', color: 'bg-orange-100 text-orange-700' };
  }
  // Traité = configuration complète OU résultat connu (réussi/échoué)
  if (examen.configured || examen.resultat === 'reussi' || examen.resultat === 'echoue') {
    return { label: 'Traité', color: 'bg-emerald-100 text-emerald-700' };
  }
  // À compléter = configuration incomplète
  return { label: 'À compléter', color: 'bg-amber-100 text-amber-700' };
}

const formatEur = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

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

// ===================== Feuille d'appel =====================
function FeuilleAppelSection({ feuilleAppel, isAdmin, onValidated }: { feuilleAppel: FeuilleAppelData; isAdmin: boolean; onValidated?: () => void }) {
  const [examens, setExamens] = useState<FeuilleAppelExamen[]>(feuilleAppel.examens);
  const [countdown, setCountdown] = useState('');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  // Sync when feuilleAppel prop changes
  useEffect(() => {
    setExamens(feuilleAppel.examens);
  }, [feuilleAppel.examens]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date(feuilleAppel.deadline);
      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('Deadline dépassée');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h${String(minutes).padStart(2, '0')} restantes`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [feuilleAppel.deadline]);

  const filled = examens.filter((e) => e.resultat !== 'a_venir').length;

  const handleResultat = useCallback(async (id: number, resultat: FeuilleAppelExamen['resultat']) => {
    // Optimistic update
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
      // Revert on error
      setExamens(previous);
    }
  }, [examens]);

  const allFilled = examens.length > 0 && examens.every((e) => e.resultat !== 'a_venir');

  const handleValidate = useCallback(async () => {
    setValidating(true);
    try {
      const res = await fetch(`/api/admin/feuilles-appel/${feuilleAppel.dateExamen}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setValidated(true);
        onValidated?.();
      }
    } catch {
      // silently fail
    } finally {
      setValidating(false);
    }
  }, [feuilleAppel.dateExamen, onValidated]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-orange-200 overflow-hidden">
      {/* Header */}
      <div className="bg-orange-50 border-b border-orange-200 px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-orange-600" />
            <div>
              <h2 className="text-lg font-semibold text-orange-800">Feuille d&apos;appel</h2>
              <p className="text-xs text-orange-600">{formatDate(feuilleAppel.dateExamen)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-orange-700">
              {filled}/{examens.length} rempli{filled > 1 ? 's' : ''}
            </span>
            <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-3 py-1 font-medium">
              {countdown}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des candidats */}
      <div className="divide-y divide-slate-100">
        {examens.map((examen) => (
          <div key={examen.id} className="flex items-center gap-3 px-5 py-3">
            {/* Nom + Diplôme */}
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

            {/* Badge centre (admin only) */}
            {isAdmin && examen.lieu && <CentreBadge lieu={examen.lieu} />}

            {/* Boutons résultat */}
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

      {/* Bouton Valider l'appel */}
      {allFilled && !validated && (
        <div className="px-5 py-4 border-t border-orange-200 bg-orange-50/50">
          <button
            onClick={handleValidate}
            disabled={validating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {validating ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {validating ? 'Validation...' : 'Valider l\u2019appel'}
          </button>
        </div>
      )}
      {validated && (
        <div className="px-5 py-4 border-t border-emerald-200 bg-emerald-50 text-center">
          <p className="text-sm font-medium text-emerald-700 flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            Feuille d&apos;appel validée
          </p>
        </div>
      )}
    </div>
  );
}

// Liste compacte des commerciaux triée par CA + mise en avant de l'utilisateur connecté
function CommercialList({ commercials, currentUserId }: { commercials: CommercialRevenue[]; currentUserId: string | null }) {
  const sorted = [...commercials].sort((a, b) => b.currentMonth - a.currentMonth);

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Users className="h-3 w-3" />
          Classement commerciaux
        </h4>
      </div>
      <div className="divide-y divide-slate-100">
        {sorted.map((cr, index) => {
          const hasObj = cr.objectifCa !== null && cr.objectifCa > 0;
          const atteint = hasObj && cr.currentMonth >= cr.objectifCa!;
          const pct = hasObj ? Math.min(cr.progression, 100) : 0;
          const isCurrentUser = currentUserId !== null && cr.commercialId === currentUserId;
          const isAdmin = cr.role === 'admin';

          return (
            <div
              key={cr.commercialId}
              className={`flex items-center gap-2 px-3 py-2 ${isCurrentUser ? 'bg-blue-50 border-l-2 border-l-blue-500' : isAdmin ? 'bg-violet-50/50' : ''}`}
            >
              {/* Rang */}
              <span className={`text-xs font-bold w-5 text-center shrink-0 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                {index === 0 ? <Crown className="h-3.5 w-3.5 mx-auto" /> : `${index + 1}`}
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isCurrentUser ? 'text-blue-800 font-semibold' : isAdmin ? 'text-violet-800 font-semibold' : 'text-slate-700'}`}>
                  {isAdmin && <ShieldCheck className="h-3 w-3 inline-block mr-0.5 -mt-0.5 text-violet-500" />}
                  {cr.prenom} {cr.nom}
                  {isAdmin && <span className="text-[9px] text-violet-400 ml-1">Admin</span>}
                  {isCurrentUser && <span className="text-[9px] text-blue-500 ml-1">(vous)</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-bold ${atteint ? 'text-emerald-600' : isCurrentUser ? 'text-blue-700' : 'text-slate-800'}`}>
                  {formatEur(cr.currentMonth)}
                </p>
                {cr.byMonth && cr.byMonth.length > 0 && (() => {
                  const prevMonth = cr.byMonth![cr.byMonth!.length - 1];
                  const diff = cr.currentMonth - prevMonth.montant;
                  const up = diff >= 0;
                  return (
                    <p className={`text-[9px] flex items-center justify-end gap-0.5 ${up ? 'text-emerald-500' : 'text-red-400'}`}>
                      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {prevMonth.label.split(' ')[0]}: {formatEur(prevMonth.montant)}
                    </p>
                  );
                })()}
                {hasObj && (
                  <p className="text-[10px] text-slate-400 flex items-center justify-end gap-0.5">
                    <Target className="h-2.5 w-2.5" />
                    {formatEur(cr.objectifCa!)}
                  </p>
                )}
              </div>
              {hasObj && (
                <div className="w-10 shrink-0">
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${atteint ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className={`text-[9px] text-center mt-0.5 font-medium ${atteint ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {cr.progression}%
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { stats, loading, refreshing, error, refresh } = useStats();
  const { id: currentUserId } = useAdminAuth();
  const [showRevenue, setShowRevenue] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{error || 'Erreur de chargement'}</p>
      </div>
    );
  }

  // Stats formations (seulement ceux avec une vraie formation)
  const formationInscriptions = stats.recentInscriptions.filter(
    (ins) => ins.formationNom && !ins.formationNom.toLowerCase().includes('examen')
  );
  const totalFormations = stats.totalFormations || stats.totalInscriptions || 1;
  const fStatus = stats.formationsByStatus || stats.byStatus;
  const enAttente = fStatus['En attente'] || 0;
  const validees = fStatus['Validee'] || 0;
  const refusees = fStatus['Refusee'] || 0;

  const pctFormationValidees = (validees / totalFormations) * 100;
  const pctFormationAttente = (enAttente / totalFormations) * 100;
  const pctFormationRefusees = (refusees / totalFormations) * 100;

  // Stats examens (2 états: Traité et À compléter)
  const exStats = stats.examenStats || { total: 0, aPlanifier: 0, aVenir: 0, termines: 0, incomplets: 0 };
  const totalExamens = exStats.total || 1;
  const examenTraites = exStats.termines;
  const examenACompleter = exStats.total - exStats.termines;

  const pctExamenTraites = (examenTraites / totalExamens) * 100;
  const pctExamenACompleter = (examenACompleter / totalExamens) * 100;

  const isAdmin = !stats.userLieu;
  const goalReached = stats.revenue.currentMonth >= stats.revenue.previousMonth && stats.revenue.previousMonth > 0;
  const surpassPercent = stats.revenue.previousMonth > 0
    ? Math.round(((stats.revenue.currentMonth - stats.revenue.previousMonth) / stats.revenue.previousMonth) * 100)
    : 0;

  // ===================== Bloc CA avec blur (réutilisé) =====================
  const revenueBlurProps = {
    onMouseDown: () => setShowRevenue(true),
    onMouseUp: () => setShowRevenue(false),
    onMouseLeave: () => setShowRevenue(false),
    onTouchStart: () => setShowRevenue(true),
    onTouchEnd: () => setShowRevenue(false),
  };

  // ===================== Bloc Examens récents =====================
  const recentExamensBlock = (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-800">Examens</h2>
        </div>
        <Link href="/admin/examens" className="text-xs text-blue-700 hover:underline">
          Voir tout
        </Link>
      </div>
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-end gap-4">
          <div className="shrink-0">
            <p className="text-4xl font-extrabold text-slate-800">{exStats.total}</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-200">
              {pctExamenTraites > 0 && (
                <div className="bg-emerald-500" style={{ width: `${pctExamenTraites}%` }} />
              )}
              {pctExamenACompleter > 0 && (
                <div className="bg-amber-400" style={{ width: `${pctExamenACompleter}%` }} />
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Traité <strong>{examenTraites}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                À compléter <strong>{examenACompleter}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Dernières inscriptions
        </h3>
        {!stats.recentExamens || stats.recentExamens.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Aucune inscription</p>
        ) : (
          <div className="space-y-3">
            {stats.recentExamens.map((examen) => {
              const etat = getExamenEtat(examen);
              const content = (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {examen.prenom} {examen.nom}
                    </p>
                    <p className="text-xs text-slate-500">
                      {examen.diplome || 'Diplôme non choisi'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isAdmin && <CentreBadge lieu={examen.lieu} />}
                    <span className="text-xs text-slate-400">
                      {new Date(examen.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${etat.color}`}>
                      {etat.label}
                    </span>
                  </div>
                </>
              );

              return examen.inscriptionId ? (
                <Link
                  key={examen.id}
                  href={`/admin/clients/${examen.inscriptionId}`}
                  className="flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <div key={examen.id} className="flex items-center justify-between py-1">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ===================== Bloc Formations récentes =====================
  const recentFormationsBlock = (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Formations</h2>
        </div>
        <Link href="/admin/clients" className="text-xs text-blue-700 hover:underline">
          Voir tout
        </Link>
      </div>
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-end gap-4">
          <div className="shrink-0">
            <p className="text-4xl font-extrabold text-slate-800">{stats.totalFormations ?? stats.totalInscriptions}</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-200">
              {pctFormationValidees > 0 && (
                <div className="bg-emerald-500" style={{ width: `${pctFormationValidees}%` }} />
              )}
              {pctFormationAttente > 0 && (
                <div className="bg-amber-400" style={{ width: `${pctFormationAttente}%` }} />
              )}
              {pctFormationRefusees > 0 && (
                <div className="bg-red-400" style={{ width: `${pctFormationRefusees}%` }} />
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Validées <strong>{validees}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                En attente <strong>{enAttente}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Refusées <strong>{refusees}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Dernières inscriptions
        </h3>
        {formationInscriptions.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Aucune inscription</p>
        ) : (
          <div className="space-y-3">
            {formationInscriptions.slice(0, 5).map((ins) => (
              <Link
                key={ins.rowIndex}
                href={`/admin/clients/${ins.rowIndex}`}
                className="flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {ins.prenom} {ins.nom}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-[180px]">
                    {ins.formationNom}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isAdmin && <CentreBadge lieu={ins.lieu} />}
                  <StatusBadge status={ins.statut} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ===================== VUE COMMERCIAL =====================
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>

        {stats.feuilleAppel && stats.feuilleAppel.examens.length > 0 && (
          <FeuilleAppelSection feuilleAppel={stats.feuilleAppel} isAdmin={false} onValidated={refresh} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:items-start">
          {/* ===== COLONNE GAUCHE — CA + Stats + Commerciaux ===== */}
          <div
            className={`relative select-none rounded-2xl ${goalReached ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
            {...revenueBlurProps}
          >
            {/* Bannière de victoire */}
            {goalReached && (
              <div className="mb-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-xl p-2.5 shadow-lg animate-pulse">
                <div className="flex items-center justify-center gap-2">
                  <PartyPopper className="h-4 w-4 text-amber-800 animate-bounce" />
                  <Trophy className="h-5 w-5 text-amber-700" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-amber-900">Objectif atteint !</p>
                    <p className="text-[10px] text-amber-800">
                      {surpassPercent > 0 ? `+${surpassPercent}% vs mois dernier` : 'Bravo !'}
                    </p>
                  </div>
                  <Trophy className="h-5 w-5 text-amber-700" />
                  <Sparkles className="h-4 w-4 text-amber-800 animate-bounce" style={{ animationDelay: '0.1s' }} />
                </div>
              </div>
            )}

            {/* Contenu flouté */}
            <div className={`transition-all duration-200 space-y-2 ${!showRevenue ? 'blur-md' : ''}`}>
              {/* En-tête centre */}
              {stats.userLieu && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-700">Centre de {stats.userLieu}</span>
                </div>
              )}

              {/* 1. Diagramme CA compact */}
              <RevenueChart revenue={stats.revenue} title={stats.userLieu ? `CA ${stats.userLieu}` : undefined} compact />

              {/* 2. Stats en ligne horizontale */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center">
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Examens</p>
                  <p className="text-base font-bold text-slate-800">{stats.totalExamens}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center">
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Traités</p>
                  <p className="text-base font-bold text-emerald-600">{examenTraites}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center">
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">À faire</p>
                  <p className="text-base font-bold text-amber-500">{examenACompleter}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center">
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Formations</p>
                  <p className="text-base font-bold text-blue-600">{stats.totalFormations ?? stats.totalInscriptions}</p>
                </div>
              </div>

              {/* 3. Classement des commerciaux (scrollable) */}
              {stats.commercialRevenues && stats.commercialRevenues.length > 0 && (
                <div className="max-h-52 overflow-y-auto">
                  <CommercialList commercials={stats.commercialRevenues} currentUserId={currentUserId} />
                </div>
              )}
            </div>

            {/* Overlay blur */}
            {!showRevenue && (
              <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
                <div className={`flex flex-col items-center gap-2 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border ${goalReached ? 'bg-amber-100/90 border-amber-300' : 'bg-white/80 border-slate-200'}`}>
                  {goalReached ? (
                    <>
                      <Trophy className="h-8 w-8 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">Objectif atteint ! Maintenir pour voir</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-8 w-8 text-slate-500" />
                      <span className="text-sm font-medium text-slate-600">Maintenir pour voir</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {showRevenue && (
              <div className={`absolute top-4 right-4 flex items-center gap-2 rounded-full px-3 py-1.5 ${goalReached ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                {goalReached ? (
                  <>
                    <Trophy className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Champion !</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Visible</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ===== COLONNE DROITE — Examens + Formations récents ===== */}
          <div className="space-y-4">
            {recentExamensBlock}
            {recentFormationsBlock}
          </div>
        </div>
      </div>
    );
  }

  // ===================== VUE ADMIN =====================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {stats.feuilleAppel && stats.feuilleAppel.examens.length > 0 && (
        <FeuilleAppelSection feuilleAppel={stats.feuilleAppel} isAdmin={true} onValidated={refresh} />
      )}

      {/* Chiffre d'affaires - Section avec flou */}
      {stats.revenue && (
        <div
          className={`relative select-none rounded-2xl ${goalReached ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
          {...revenueBlurProps}
        >
          {/* Bannière de victoire */}
          {goalReached && (
            <div className="mb-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-xl p-4 shadow-lg animate-pulse">
              <div className="flex items-center justify-center gap-3">
                <PartyPopper className="h-6 w-6 text-amber-800 animate-bounce" />
                <Trophy className="h-8 w-8 text-amber-700" />
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-900">Objectif atteint !</p>
                  <p className="text-sm text-amber-800">
                    {surpassPercent > 0 ? `+${surpassPercent}% par rapport au mois dernier` : 'Bravo à toute l\'équipe !'}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-amber-700" />
                <Sparkles className="h-6 w-6 text-amber-800 animate-bounce" style={{ animationDelay: '0.1s' }} />
              </div>
            </div>
          )}

          {/* Contenu flouté */}
          <div className={`transition-all duration-200 ${!showRevenue ? 'blur-md' : ''}`}>
            {stats.revenueByCentre && stats.revenueByCentre.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stats.revenueByCentre.map((centreData) => {
                  const cs = centreData.examenStats;

                  return (
                    <div key={centreData.centre} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-slate-700">Centre de {centreData.centre}</span>
                      </div>

                      <RevenueChart revenue={centreData.revenue} title={`CA ${centreData.centre}`} />

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Examens</p>
                          <p className="text-xl font-bold text-slate-800">{cs.totalExamens}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Traités</p>
                          <p className="text-xl font-bold text-emerald-600">{cs.examenTraites}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">À compléter</p>
                          <p className="text-xl font-bold text-amber-500">{cs.examenACompleter}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Formations</p>
                          <p className="text-xl font-bold text-blue-600">{cs.totalFormations ?? cs.totalInscriptions}</p>
                        </div>
                      </div>

                      {centreData.commercialRevenues.length > 0 && (
                        <CommercialList commercials={centreData.commercialRevenues} currentUserId={currentUserId} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overlay blur */}
          {!showRevenue && (
            <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
              <div className={`flex flex-col items-center gap-2 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border ${goalReached ? 'bg-amber-100/90 border-amber-300' : 'bg-white/80 border-slate-200'}`}>
                {goalReached ? (
                  <>
                    <Trophy className="h-8 w-8 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Objectif atteint ! Maintenir pour voir</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-8 w-8 text-slate-500" />
                    <span className="text-sm font-medium text-slate-600">Maintenir pour voir</span>
                  </>
                )}
              </div>
            </div>
          )}

          {showRevenue && (
            <div className={`absolute top-4 right-4 flex items-center gap-2 rounded-full px-3 py-1.5 ${goalReached ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {goalReached ? (
                <>
                  <Trophy className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">Champion !</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Visible</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Examens + Formations récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recentExamensBlock}
        {recentFormationsBlock}
      </div>
    </div>
  );
}
