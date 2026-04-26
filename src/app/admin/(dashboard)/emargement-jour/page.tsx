'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  GraduationCap,
} from 'lucide-react';

interface EmargementEntry {
  emargementId: number;
  sessionId: number;
  stagiaireId: number;
  date: string;
  horaire: string;
  heureDebut: string;   // "09:30"
  heureFin: string;     // "12:30"
  agence: string;
  formatriceNom: string | null;
  dureeHeures: number;
  nom: string;
  prenom: string;
  email: string;
  present: boolean;
  retard: boolean;
  justificatifRecu: boolean;
}

type StatutChoix = 'present' | 'retard' | 'absent' | 'absent_justifie';

function getStatut(e: EmargementEntry): StatutChoix {
  if (e.present && e.retard) return 'retard';
  if (e.present) return 'present';
  if (e.justificatifRecu) return 'absent_justifie';
  return 'absent';
}

const STATUT_CONFIG: Record<StatutChoix, { label: string; color: string; activeColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  present: {
    label: 'Présent',
    color: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    activeColor: 'bg-emerald-600 border-emerald-600 text-white',
    icon: CheckCircle2,
  },
  retard: {
    label: 'Retard',
    color: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    activeColor: 'bg-amber-500 border-amber-500 text-white',
    icon: Clock,
  },
  absent: {
    label: 'Absent',
    color: 'border-red-200 text-red-700 hover:bg-red-50',
    activeColor: 'bg-red-600 border-red-600 text-white',
    icon: XCircle,
  },
  absent_justifie: {
    label: 'Absent justifié',
    color: 'border-slate-300 text-slate-700 hover:bg-slate-50',
    activeColor: 'bg-slate-700 border-slate-700 text-white',
    icon: FileCheck2,
  },
};

function statutToFields(statut: StatutChoix): { present: boolean; retard: boolean; justificatifRecu: boolean } {
  switch (statut) {
    case 'present': return { present: true, retard: false, justificatifRecu: false };
    case 'retard': return { present: true, retard: true, justificatifRecu: false };
    case 'absent': return { present: false, retard: false, justificatifRecu: false };
    case 'absent_justifie': return { present: false, retard: false, justificatifRecu: true };
  }
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Heure courante de Paris (h, m) pour décider si un demi-jour est "actif"
function getNowParis(): { hour: number; minute: number } {
  const now = new Date();
  const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  return { hour: paris.getHours(), minute: paris.getMinutes() };
}

export default function EmargementJourPage() {
  const [date, setDate] = useState(() => formatDateISO(new Date()));
  const [entries, setEntries] = useState<EmargementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/emargement-jour?date=${date}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      setError('Impossible de charger les émargements du jour');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const updateStatut = async (entry: EmargementEntry, statut: StatutChoix) => {
    setSavingId(entry.emargementId);
    const fields = statutToFields(statut);

    // Optimistic update
    setEntries((prev) =>
      prev.map((e) =>
        e.emargementId === entry.emargementId ? { ...e, ...fields } : e,
      ),
    );

    try {
      const res = await fetch(`/api/admin/cours-sessions/${entry.sessionId}/emargements`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emargementId: entry.emargementId,
          stagiaireId: entry.stagiaireId,
          ...fields,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback
      setEntries((prev) =>
        prev.map((e) =>
          e.emargementId === entry.emargementId ? entry : e,
        ),
      );
      setError('La sauvegarde a échoué. Réessayez.');
    } finally {
      setSavingId(null);
    }
  };

  const goToPreviousDay = () => {
    const [y, m, d] = date.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setDate(formatDateISO(prev));
  };
  const goToNextDay = () => {
    const [y, m, d] = date.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    setDate(formatDateISO(next));
  };
  const goToToday = () => setDate(formatDateISO(new Date()));

  // Découpage matin (début < 12:00) / après-midi (>= 12:00)
  const matin = entries.filter((e) => {
    const h = parseInt(e.heureDebut.split(':')[0] || '0', 10);
    return h < 12;
  });
  const apresMidi = entries.filter((e) => {
    const h = parseInt(e.heureDebut.split(':')[0] || '0', 10);
    return h >= 12;
  });

  const isToday = date === formatDateISO(new Date());
  const now = useMemo(() => getNowParis(), []);
  // Activation : matin actif dès 8h, après-midi dès 13h, sinon lecture seule
  const matinActif = !isToday || now.hour >= 8;
  const apresMidiActif = !isToday || now.hour >= 13;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Émargement du jour</h1>
          <p className="text-sm text-slate-500 mt-1 capitalize">{formatDateLong(date)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={goToPreviousDay}
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Jour précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextDay}
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Jour suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={fetchEntries}
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          <GraduationCap className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Aucune session de formation prévue ce jour.</p>
        </div>
      ) : (
        <>
          <DemiJourSection
            titre="Matin"
            icon={Sun}
            actif={matinActif}
            entries={matin}
            savingId={savingId}
            onUpdate={updateStatut}
            inactiveMessage="L'émargement du matin sera activé à partir de 8h."
          />
          <DemiJourSection
            titre="Après-midi"
            icon={Moon}
            actif={apresMidiActif}
            entries={apresMidi}
            savingId={savingId}
            onUpdate={updateStatut}
            inactiveMessage="L'émargement de l'après-midi sera activé à partir de 13h."
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// Section d'un demi-jour : regroupe les sessions par horaire
// ============================================================
function DemiJourSection({
  titre,
  icon: Icon,
  actif,
  entries,
  savingId,
  onUpdate,
  inactiveMessage,
}: {
  titre: string;
  icon: React.ComponentType<{ className?: string }>;
  actif: boolean;
  entries: EmargementEntry[];
  savingId: number | null;
  onUpdate: (entry: EmargementEntry, statut: StatutChoix) => void;
  inactiveMessage: string;
}) {
  // Grouper par (horaire + agence)
  const groupes = entries.reduce<Record<string, EmargementEntry[]>>((acc, e) => {
    const key = `${e.horaire}__${e.agence}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const total = entries.length;
  const presents = entries.filter((e) => e.present && !e.retard).length;
  const retards = entries.filter((e) => e.present && e.retard).length;
  const absents = entries.filter((e) => !e.present && !e.justificatifRecu).length;
  const justifies = entries.filter((e) => !e.present && e.justificatifRecu).length;

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white p-2 border border-slate-200">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{titre}</h2>
            <p className="text-xs text-slate-500">
              {total} stagiaire{total > 1 ? 's' : ''} · {presents} présent{presents > 1 ? 's' : ''}
              {retards > 0 && ` · ${retards} retard${retards > 1 ? 's' : ''}`}
              {absents > 0 && ` · ${absents} absent${absents > 1 ? 's' : ''}`}
              {justifies > 0 && ` · ${justifies} justifié${justifies > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {!actif && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            En attente d&apos;activation
          </span>
        )}
      </header>

      {total === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">Aucune session ce demi-jour.</div>
      ) : !actif ? (
        <div className="p-6 text-sm text-slate-500 bg-slate-50/50 border-t border-slate-100">
          {inactiveMessage} <span className="text-slate-400">(les sessions sont visibles ci-dessous en lecture seule)</span>
          <ReadOnlyList groupes={groupes} />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {Object.entries(groupes).map(([key, group]) => {
            const [horaire, agence] = key.split('__');
            return (
              <div key={key} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <span className="font-semibold text-slate-700">{horaire}</span>
                  {agence && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Building2 className="h-3 w-3" /> {agence}
                    </span>
                  )}
                  {group[0]?.formatriceNom && (
                    <span className="text-xs text-slate-400">— {group[0].formatriceNom}</span>
                  )}
                </div>

                <ul className="space-y-2">
                  {group.map((e) => {
                    const statut = getStatut(e);
                    const saving = savingId === e.emargementId;
                    return (
                      <li key={e.emargementId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/suivi-formation/${e.stagiaireId}`}
                            className="text-sm font-medium text-slate-800 hover:text-blue-600 hover:underline"
                          >
                            {e.prenom} {e.nom}
                          </Link>
                          <div className="text-xs text-slate-400">{e.email}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {(['present', 'retard', 'absent', 'absent_justifie'] as StatutChoix[]).map((s) => {
                            const cfg = STATUT_CONFIG[s];
                            const StatutIcon = cfg.icon;
                            const isActive = statut === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => onUpdate(e, s)}
                                disabled={saving}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                                  isActive ? cfg.activeColor : `bg-white ${cfg.color}`
                                }`}
                              >
                                <StatutIcon className="h-3.5 w-3.5" />
                                {cfg.label}
                              </button>
                            );
                          })}
                          {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400 ml-1" />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ReadOnlyList({ groupes }: { groupes: Record<string, EmargementEntry[]> }) {
  return (
    <div className="mt-3 space-y-2">
      {Object.entries(groupes).map(([key, group]) => {
        const [horaire, agence] = key.split('__');
        return (
          <div key={key} className="text-xs text-slate-500">
            <span className="font-medium text-slate-600">{horaire}</span>
            {agence && <span className="ml-2 text-slate-400">{agence}</span>}
            <span className="ml-2 text-slate-400">— {group.length} stagiaire{group.length > 1 ? 's' : ''}</span>
          </div>
        );
      })}
    </div>
  );
}
