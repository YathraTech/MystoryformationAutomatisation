'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ClipboardCheck, AlertCircle, Users } from 'lucide-react';
import { getPlanningColorForExamType } from '@/lib/utils/exam-colors';

interface PlanningExamen {
  id: number;
  date: string | null;
  heure: string | null;
  diplome: string | null;
  typeExamen: string | null;
  lieu: string | null;
  isOwnCandidat: boolean;
  nom: string | null;
  prenom: string | null;
}

interface ExamenSlot {
  date: string;
  count: number;
  maxPlaces: number;
  jour: string;
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatWeekRange(dates: Date[]): string {
  const start = dates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const end = dates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${start} - ${end}`;
}

const OTHER_COLOR = { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-400' };

interface ExamTypeInfo {
  code: string;
  label: string;
  color: string;
}

function getOwnCandidatColor(diplome: string | null, examTypes: ExamTypeInfo[]) {
  const prefix = (diplome || '').split(':')[0];
  const matchedType = examTypes.find(t => t.code === prefix);
  if (matchedType) {
    const c = getPlanningColorForExamType(matchedType.color);
    return { bg: c.bg, border: c.border, icon: c.icon };
  }
  return { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600' };
}

export default function PartenairePlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [examens, setExamens] = useState<PlanningExamen[]>([]);
  const [examTypes, setExamTypes] = useState<ExamTypeInfo[]>([]);
  const [examenSlots, setExamenSlots] = useState<ExamenSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const weekDates = getWeekDates(currentDate);

  const fetchExamenSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/examens/slots');
      if (res.ok) {
        const data = await res.json();
        setExamenSlots(data.slots || []);
      }
    } catch {
      // Slots might not be accessible for partenaire, ignore
    }
  }, []);

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
      const res = await fetch(`/api/partenaire/planning?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error('Erreur de chargement');

      const data = await res.json();
      setExamens(data.examens || []);
      setExamTypes(data.examTypes || []);
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

  const getExamensForDate = (date: Date) => {
    const dateStr = formatDateISO(date);
    return examens.filter((e) => e.date === dateStr);
  };

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
          <div className="h-8 w-8 border-3 border-violet-200 border-t-violet-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header - Days of week */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekDates.map((date, i) => {
              const slot = getSlotForDate(date);
              const isExamDay = slot !== undefined;
              const isFull = slot && slot.count >= slot.maxPlaces;

              return (
                <div
                  key={i}
                  className={`px-3 py-3 text-center border-r border-slate-200 last:border-r-0 ${
                    isToday(date) ? 'bg-violet-50' : ''
                  }`}
                >
                  <div className={`text-xs font-medium uppercase ${isToday(date) ? 'text-violet-700' : 'text-slate-500'}`}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold mt-0.5 ${isToday(date) ? 'text-violet-700' : 'text-slate-800'}`}>
                    {date.getDate()}
                  </div>
                  {isExamDay && (
                    <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 ${
                      isFull ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      <Users className="h-3 w-3" />
                      {slot.count}/{slot.maxPlaces}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Body - Events */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDates.map((date, i) => {
              const dayExamens = getExamensForDate(date);
              return (
                <div
                  key={i}
                  className={`border-r border-slate-200 last:border-r-0 p-2 ${
                    isToday(date) ? 'bg-violet-50/30' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {dayExamens.map((ex) => {
                      const colors = ex.isOwnCandidat ? getOwnCandidatColor(ex.diplome, examTypes) : OTHER_COLOR;
                      return (
                        <div
                          key={ex.id}
                          className={`rounded-md px-2 py-1.5 text-xs flex items-center gap-1.5 border ${colors.bg} ${colors.border}`}
                        >
                          <ClipboardCheck className={`h-3 w-3 ${colors.icon} shrink-0`} />
                          {ex.heure && (
                            <span className="text-slate-500 shrink-0">{ex.heure.slice(0, 5)}</span>
                          )}
                          {ex.isOwnCandidat ? (
                            <span className="font-medium text-slate-800 truncate">
                              {ex.prenom} {ex.nom}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic truncate">
                              Candidat
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {dayExamens.length === 0 && (
                      <div className="text-center text-slate-300 py-4 text-xs">-</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        {examTypes.map((type) => {
          const c = getPlanningColorForExamType(type.color);
          return (
            <div key={type.code} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${c.legendBg} border ${c.legendBorder}`} />
              <span>{type.label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300" />
          <span>Autres</span>
        </div>
      </div>
    </div>
  );
}
