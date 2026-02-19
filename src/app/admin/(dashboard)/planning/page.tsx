'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, ClipboardCheck, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import type { Inscription } from '@/types/admin';
import type { Examen } from '@/lib/data/examens';

interface PlanningEvent {
  id: number;
  type: 'formation' | 'examen';
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date: string;
  heure: string | null;
  details: string;
  inscriptionId: number | null; // ID de l'inscription pour le lien vers la fiche
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
  const [examenSlots, setExamenSlots] = useState<ExamenSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      const planningEvents: PlanningEvent[] = [];

      // Map formations (inscriptions with date_formation)
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
            inscriptionId: ins.rowIndex, // L'ID de l'inscription pour le lien
          });
        }
      });

      // Map examens (enrichis avec inscriptionId par l'API)
      (data.examens as (Examen & { inscriptionId?: number | null })[]).forEach((ex) => {
        if (ex.dateExamen) {
          planningEvents.push({
            id: ex.id,
            type: 'examen',
            nom: ex.nom,
            prenom: ex.prenom,
            email: ex.email,
            telephone: ex.telephone,
            date: ex.dateExamen,
            heure: ex.heureExamen,
            details: ex.diplome || 'Examen',
            inscriptionId: ex.inscriptionId || null,
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
    return events.filter((e) => e.date === dateStr);
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
          <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
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
                    isToday(date) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`text-xs font-medium uppercase ${isToday(date) ? 'text-blue-700' : 'text-slate-500'}`}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold mt-0.5 ${isToday(date) ? 'text-blue-700' : 'text-slate-800'}`}>
                    {date.getDate()}
                  </div>
                  {/* Afficher le compteur pour les jours d'examen (lundi/vendredi) */}
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
              const dayEvents = getEventsForDate(date);
              return (
                <div
                  key={i}
                  className={`border-r border-slate-200 last:border-r-0 p-2 ${
                    isToday(date) ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={`${event.type}-${event.id}`}
                        className={`rounded-md px-2 py-1.5 text-xs flex items-center gap-1.5 ${
                          event.type === 'formation'
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-amber-50 border border-amber-200'
                        }`}
                      >
                        {event.type === 'formation' ? (
                          <GraduationCap className="h-3 w-3 text-emerald-600 shrink-0" />
                        ) : (
                          <ClipboardCheck className="h-3 w-3 text-amber-600 shrink-0" />
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
                    ))}

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

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
          <span>Formation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
          <span>Examen</span>
        </div>
      </div>
    </div>
  );
}
