'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, ClipboardCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Inscription } from '@/types/admin';
import type { Examen } from '@/lib/data/examens';
import { getPlanningColorForExamType, type PlanningColorSet } from '@/lib/utils/exam-colors';

interface PlanningEvent {
  id: number;
  type: 'formation' | 'tef' | 'civique';
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date: string;
  heure: string | null;
  details: string;
  diplome: string | null;
  inscriptionId: number | null;
  isPartenaireCandidat: boolean;
  // Cas session de cours générée (multi-créneaux) : on encode session+stagiaire
  // dans la clé pour éviter les collisions React.
  keySuffix?: string;
}

interface FormationSessionDTO {
  sessionId: number;
  stagiaireId: number;
  inscriptionId: number | null;
  date: string;
  horaire: string;
  agence: string;
  nom: string;
  prenom: string;
  email: string;
  formatriceNom: string | null;
}

const FORMATION_COLOR: PlanningColorSet = { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', legendBg: 'bg-emerald-100', legendBorder: 'border-emerald-300' };
const PARTENAIRE_COLOR: PlanningColorSet = { bg: 'bg-violet-50', border: 'border-violet-400', icon: 'text-violet-600', legendBg: 'bg-violet-100', legendBorder: 'border-violet-300' };

interface ExamTypeInfo {
  code: string;
  label: string;
  color: string;
}

function getEventColor(event: PlanningEvent, examTypes: ExamTypeInfo[]): PlanningColorSet {
  if (event.isPartenaireCandidat) return PARTENAIRE_COLOR;
  if (event.type === 'formation') return FORMATION_COLOR;

  const diplome = event.diplome || '';
  const prefix = diplome.split(':')[0];

  const matchedType = examTypes.find(t => t.code === prefix);
  if (matchedType) return getPlanningColorForExamType(matchedType.color);

  return getPlanningColorForExamType('blue');
}

// Catégorie d'un événement utilisée par les filtres et la légende.
// Aligné sur getEventColor : partenaire écrase tout, sinon formation, sinon code examen.
const FORMATION_CATEGORY = 'formation';
const PARTENAIRE_CATEGORY = 'partenaire';

function getEventCategory(event: PlanningEvent): string {
  if (event.isPartenaireCandidat) return PARTENAIRE_CATEGORY;
  if (event.type === 'formation') return FORMATION_CATEGORY;
  const diplome = event.diplome || '';
  const prefix = diplome.split(':')[0];
  return prefix || 'autre';
}

interface ExamenSlot {
  date: string;
  count: number;
  maxPlaces: number;
  jour: 'lundi' | 'vendredi';
}

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateISO(date: Date): string {
  // Use local date to avoid UTC timezone shift
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatWeekRange(dates: Date[]): string {
  const start = dates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const end = dates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${start} - ${end}`;
}

export default function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [examTypes, setExamTypes] = useState<ExamTypeInfo[]>([]);
  const [examenSlots, setExamenSlots] = useState<ExamenSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Filtres : null = aucun filtre initialisé (tout visible). Sinon, set des catégories actives.
  const [activeFilters, setActiveFilters] = useState<Set<string> | null>(null);

  const weekDates = getWeekDates(currentDate);

  // Charger les créneaux d'examens
  const fetchExamenSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/examens/slots');
      if (res.ok) {
        const data = await res.json();
        setExamenSlots(data.slots || []);
      }
    } catch {
      console.error('Erreur chargement slots examens');
    }
  }, []);

  // Obtenir le slot pour une date donnée
  const getSlotForDate = (date: Date): ExamenSlot | undefined => {
    const dateStr = formatDateISO(date);
    return examenSlots.find(s => s.date === dateStr);
  };

  const fetchPlanning = useCallback(async () => {
    setLoading(true);
    setError('');

    const startDate = formatDateISO(weekDates[0]);
    const endDate = formatDateISO(weekDates[6]);

    try {
      const res = await fetch(`/api/admin/planning?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error('Erreur de chargement');

      const data = await res.json();

      setExamTypes(data.examTypes || []);

      const planningEvents: PlanningEvent[] = [];

      // Map formations (inscriptions with date_formation, sans planning multi-créneaux généré)
      (data.formations as Inscription[]).forEach((ins) => {
        if (ins.dateFormation) {
          planningEvents.push({
            id: ins.rowIndex,
            type: 'formation',
            nom: ins.nom,
            prenom: ins.prenom,
            email: ins.email,
            telephone: ins.telephone,
            date: ins.dateFormation,
            heure: ins.heureFormation,
            details: ins.formationNom,
            diplome: null,
            inscriptionId: ins.rowIndex,
            isPartenaireCandidat: false,
          });
        }
      });

      // Map formation sessions (cours_sessions générés par stagiaire)
      ((data.formationSessions || []) as FormationSessionDTO[]).forEach((s) => {
        const heureDebut = s.horaire.match(/(\d{1,2})[h:](\d{2})?/);
        const heure = heureDebut
          ? `${heureDebut[1].padStart(2, '0')}:${heureDebut[2] || '00'}`
          : null;
        planningEvents.push({
          id: s.stagiaireId,
          type: 'formation',
          nom: s.nom,
          prenom: s.prenom,
          email: s.email,
          telephone: '',
          date: s.date,
          heure,
          details: s.horaire,
          diplome: null,
          inscriptionId: s.inscriptionId,
          isPartenaireCandidat: false,
          keySuffix: `s${s.sessionId}`,
        });
      });

      // Map examens (enrichis avec inscriptionId par l'API)
      (data.examens as (Examen & { inscriptionId?: number | null; isPartenaireCandidat?: boolean })[]).forEach((ex) => {
        if (ex.dateExamen) {
          // Déterminer le type d'examen (TEF ou Civique) via le diplome ou typeExamen
          const diplome = (ex.diplome || '').toUpperCase();
          const isCivique = diplome.startsWith('CIVIQUE') || ex.typeExamen === 'Civique';
          const eventType: 'tef' | 'civique' = isCivique ? 'civique' : 'tef';

          planningEvents.push({
            id: ex.id,
            type: eventType,
            nom: ex.nom,
            prenom: ex.prenom,
            email: ex.email,
            telephone: ex.telephone,
            date: ex.dateExamen,
            heure: ex.heureExamen,
            details: ex.diplome || 'Examen',
            diplome: ex.diplome || null,
            inscriptionId: ex.inscriptionId || null,
            isPartenaireCandidat: ex.isPartenaireCandidat || false,
          });
        }
      });

      setEvents(planningEvents);
    } catch {
      setError('Impossible de charger le planning');
    } finally {
      setLoading(false);
    }
  }, [weekDates]);

  useEffect(() => {
    fetchPlanning();
    fetchExamenSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateISO(date);
    return events.filter((e) => {
      if (e.date !== dateStr) return false;
      if (activeFilters && !activeFilters.has(getEventCategory(e))) return false;
      return true;
    });
  };

  // Liste des catégories disponibles pour la légende/filtres :
  // examTypes (dynamiques) + Formation + Partenaire
  const filterCategories: { key: string; label: string; colors: PlanningColorSet }[] = [
    ...examTypes.map((t) => ({
      key: t.code,
      label: t.label,
      colors: getPlanningColorForExamType(t.color),
    })),
    { key: FORMATION_CATEGORY, label: 'Formation', colors: FORMATION_COLOR },
    { key: PARTENAIRE_CATEGORY, label: 'Partenaire', colors: PARTENAIRE_COLOR },
  ];

  const isCategoryActive = (key: string): boolean =>
    activeFilters === null || activeFilters.has(key);

  const toggleCategory = (key: string) => {
    setActiveFilters((prev) => {
      const base = prev ?? new Set(filterCategories.map((c) => c.key));
      const next = new Set(base);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const showAll = () => setActiveFilters(null);
  const showOnly = (key: string) => setActiveFilters(new Set([key]));

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Planning</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={goToPreviousWeek}
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextWeek}
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="text-center text-lg font-semibold text-slate-700">
        {formatWeekRange(weekDates)}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header - Days of week */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekDates.map((date, i) => {
              const slot = getSlotForDate(date);
              const isExamDay = slot !== undefined;
              const dateStr = formatDateISO(date);

              // Examens du jour : recompté à partir des events affichés (mise à jour live)
              const examenCount = events.filter(
                (e) => e.date === dateStr && (e.type === 'tef' || e.type === 'civique'),
              ).length;
              const examenMax = slot?.maxPlaces ?? 15;
              const isFull = isExamDay && examenCount >= examenMax;

              // Stagiaires en formation du jour, dédupliqué par identité métier
              // (un même stagiaire peut avoir plusieurs créneaux le même jour).
              // On utilise stagiaireId pour les sessions (keySuffix présent),
              // sinon rowIndex de l'inscription. L'email n'est pas fiable car
              // plusieurs personnes peuvent partager une adresse en données réelles.
              const formationKeys = new Set<string>();
              events.forEach((e) => {
                if (e.date === dateStr && e.type === 'formation') {
                  const key = e.keySuffix ? `stag-${e.id}` : `ins-${e.id}`;
                  formationKeys.add(key);
                }
              });
              const formationCount = formationKeys.size;

              return (
                <div
                  key={i}
                  className={`px-3 py-3 text-center border-r border-slate-200 last:border-r-0 ${
                    isToday(date) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`text-xs font-medium uppercase ${isToday(date) ? 'text-blue-700' : 'text-slate-500'}`}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold mt-0.5 ${isToday(date) ? 'text-blue-700' : 'text-slate-800'}`}>
                    {date.getDate()}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                    {/* Examens : visible les jours d'examens (lundi/vendredi) */}
                    {isExamDay && (
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 ${
                          isFull ? 'text-red-700' : 'text-amber-700'
                        }`}
                        title="Examens planifiés ce jour"
                      >
                        <ClipboardCheck className="h-3 w-3" />
                        {examenCount}/{examenMax}
                      </div>
                    )}
                    {/* Stagiaires en formation : visible si au moins 1 */}
                    {formationCount > 0 && (
                      <div
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
                        title="Stagiaires en formation ce jour"
                      >
                        <GraduationCap className="h-3 w-3" />
                        {formationCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Body - Events */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDates.map((date, i) => {
              const dayEvents = getEventsForDate(date);
              return (
                <div
                  key={i}
                  className={`border-r border-slate-200 last:border-r-0 p-2 ${
                    isToday(date) ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => {
                      const colors = getEventColor(event, examTypes);

                      return (
                      <div
                        key={`${event.type}-${event.id}-${event.keySuffix || ''}`}
                        className={`rounded-md px-2 py-1.5 text-xs flex items-center gap-1.5 border ${colors.bg} ${colors.border}`}
                      >
                        {event.type === 'formation' ? (
                          <GraduationCap className={`h-3 w-3 ${colors.icon} shrink-0`} />
                        ) : (
                          <ClipboardCheck className={`h-3 w-3 ${colors.icon} shrink-0`} />
                        )}

                        {event.heure && (
                          <span className="text-slate-500 shrink-0">{event.heure.slice(0, 5)}</span>
                        )}

                        {event.inscriptionId ? (
                          <Link
                            href={`/admin/clients/${event.inscriptionId}`}
                            className="font-medium text-slate-800 hover:text-blue-600 hover:underline truncate"
                            title={`${event.prenom} ${event.nom} - Voir fiche`}
                          >
                            {event.prenom} {event.nom}
                          </Link>
                        ) : (
                          <span className="font-medium text-slate-800 truncate">
                            {event.prenom} {event.nom}
                          </span>
                        )}
                      </div>
                      );
                    })}

                    {dayEvents.length === 0 && (
                      <div className="text-center text-slate-300 py-4 text-xs">-</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres / Légende — clique pour activer/désactiver, double-clic pour isoler */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="text-xs uppercase tracking-wide text-slate-500 mr-1">Filtrer :</span>
        {filterCategories.map((cat) => {
          const active = isCategoryActive(cat.key);
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => toggleCategory(cat.key)}
              onDoubleClick={() => showOnly(cat.key)}
              title={`Cliquer pour ${active ? 'masquer' : 'afficher'} • Double-clic pour isoler`}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-all ${
                active
                  ? `${cat.colors.legendBg} ${cat.colors.legendBorder} text-slate-800 hover:brightness-95`
                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
              }`}
            >
              <span
                className={`w-3 h-3 rounded ${
                  active ? `${cat.colors.legendBg} border ${cat.colors.legendBorder}` : 'bg-slate-200 border border-slate-300'
                }`}
              />
              {cat.label}
            </button>
          );
        })}
        {activeFilters !== null && (
          <button
            type="button"
            onClick={showAll}
            className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            Tout afficher
          </button>
        )}
      </div>
    </div>
  );
}
