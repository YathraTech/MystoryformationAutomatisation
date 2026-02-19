import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TimeSlotData {
  jour: string;
  heure: string;
  label: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    // 1. Get the exam option by code
    const { data: option, error: optionError } = await supabase
      .from('exam_options')
      .select('id')
      .eq('code', code)
      .single();

    if (optionError || !option) {
      // If no option found, return all slots as fallback
      const { data: allSlots } = await supabase
        .from('exam_time_slots')
        .select('jour, heure, label')
        .eq('actif', true);

      return NextResponse.json({
        slots: generateDatesFromSlots(allSlots || []),
        fallback: true,
      });
    }

    // 2. Get the time slots associated with this option
    const { data: optionSlots, error: slotsError } = await supabase
      .from('exam_option_slots')
      .select('slot_id')
      .eq('option_id', option.id);

    if (slotsError) throw slotsError;

    // If no slots associated, return all active slots as fallback
    if (!optionSlots || optionSlots.length === 0) {
      const { data: allSlots } = await supabase
        .from('exam_time_slots')
        .select('jour, heure, label')
        .eq('actif', true);

      return NextResponse.json({
        slots: generateDatesFromSlots(allSlots || []),
        fallback: true,
      });
    }

    const slotIds = optionSlots.map((os) => os.slot_id);

    // 3. Get the time slot details
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('exam_time_slots')
      .select('jour, heure, label')
      .in('id', slotIds)
      .eq('actif', true);

    if (timeSlotsError) throw timeSlotsError;

    return NextResponse.json({
      slots: generateDatesFromSlots(timeSlots || []),
      fallback: false,
    });
  } catch (error) {
    console.error('[Exam Option Slots Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des créneaux' },
      { status: 500 }
    );
  }
}

// Calculer si une année est bissextile
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Obtenir le nombre de jours dans un mois (calcul sans Date)
function getDaysInMonth(year: number, month: number): number {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return daysPerMonth[month - 1];
}

// Calculer le jour de la semaine (0=dimanche, 1=lundi, ..., 6=samedi)
// Utilise l'algorithme de Zeller modifié - calcul purement mathématique
function getDayOfWeek(year: number, month: number, day: number): number {
  // Ajustement pour janvier et février (traités comme mois 13 et 14 de l'année précédente)
  let y = year;
  let m = month;
  if (m < 3) {
    m += 12;
    y -= 1;
  }

  const k = y % 100;
  const j = Math.floor(y / 100);

  // Formule de Zeller
  const h = (day + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) - 2 * j) % 7;

  // Convertir: Zeller donne 0=samedi, 1=dimanche, 2=lundi, ...
  // Nous voulons: 0=dimanche, 1=lundi, ..., 6=samedi
  return ((h + 6) % 7);
}

// Formater une date en ISO (YYYY-MM-DD)
function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Ajouter des jours à une date
function addDays(year: number, month: number, day: number, daysToAdd: number): { year: number; month: number; day: number } {
  let newDay = day + daysToAdd;
  let newMonth = month;
  let newYear = year;

  while (newDay > getDaysInMonth(newYear, newMonth)) {
    newDay -= getDaysInMonth(newYear, newMonth);
    newMonth++;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
  }

  return { year: newYear, month: newMonth, day: newDay };
}

function generateDatesFromSlots(timeSlots: TimeSlotData[]) {
  const slots: {
    date: string;
    count: number;
    maxPlaces: number;
    jour: string;
    heure: string;
    label: string;
  }[] = [];

  if (timeSlots.length === 0) return slots;

  // Map jour names to day numbers
  const jourToDay: Record<string, number> = {
    dimanche: 0,
    lundi: 1,
    mardi: 2,
    mercredi: 3,
    jeudi: 4,
    vendredi: 5,
    samedi: 6,
  };

  // Obtenir la date actuelle en France
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const todayYear = parisTime.getFullYear();
  const todayMonth = parisTime.getMonth() + 1;
  const todayDay = parisTime.getDate();

  // Commencer à partir d'aujourd'hui (dates futures uniquement)
  const startYear = todayYear;
  const startMonth = todayMonth;
  const startDay = todayDay;

  // Finir 6 mois dans le futur
  let endYear = todayYear;
  let endMonth = todayMonth + 6;
  if (endMonth > 12) {
    endMonth -= 12;
    endYear++;
  }

  let current = { year: startYear, month: startMonth, day: startDay };
  const endDateStr = formatDateISO(endYear, endMonth, 28);

  while (formatDateISO(current.year, current.month, current.day) <= endDateStr) {
    const dayOfWeek = getDayOfWeek(current.year, current.month, current.day);

    // Check if this day matches any of our time slots
    for (const slot of timeSlots) {
      const slotDay = jourToDay[slot.jour.toLowerCase()];
      if (dayOfWeek === slotDay) {
        const dateStr = formatDateISO(current.year, current.month, current.day);
        slots.push({
          date: dateStr,
          count: 0,
          maxPlaces: 15,
          jour: slot.jour,
          heure: slot.heure,
          label: slot.label,
        });
      }
    }

    current = addDays(current.year, current.month, current.day, 1);
  }

  return slots;
}
