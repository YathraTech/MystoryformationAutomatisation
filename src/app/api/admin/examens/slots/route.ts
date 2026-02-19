import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_PLACES = 15;

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

  while (newDay < 1) {
    newMonth--;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    newDay += getDaysInMonth(newYear, newMonth);
  }

  return { year: newYear, month: newMonth, day: newDay };
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Récupérer tous les examens avec une date définie
    const { data: examens, error } = await supabase
      .from('examens')
      .select('date_examen')
      .not('date_examen', 'is', null);

    if (error) throw error;

    // Compter les examens par date
    const countByDate: Record<string, number> = {};
    for (const ex of examens || []) {
      const date = ex.date_examen;
      if (date) {
        countByDate[date] = (countByDate[date] || 0) + 1;
      }
    }

    // Obtenir la date actuelle en France (approximation: on utilise les composants locaux)
    const now = new Date();
    // Forcer le calcul en heure de Paris
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

    // Générer les créneaux
    const slots: { date: string; count: number; maxPlaces: number; jour: 'lundi' | 'vendredi' }[] = [];

    let current = { year: startYear, month: startMonth, day: startDay };
    const endDateStr = formatDateISO(endYear, endMonth, 28);

    while (formatDateISO(current.year, current.month, current.day) <= endDateStr) {
      const dayOfWeek = getDayOfWeek(current.year, current.month, current.day);

      // Lundi = 1, Vendredi = 5
      if (dayOfWeek === 1 || dayOfWeek === 5) {
        const dateStr = formatDateISO(current.year, current.month, current.day);
        slots.push({
          date: dateStr,
          count: countByDate[dateStr] || 0,
          maxPlaces: MAX_PLACES,
          jour: dayOfWeek === 1 ? 'lundi' : 'vendredi',
        });
      }

      current = addDays(current.year, current.month, current.day, 1);
    }

    return NextResponse.json({
      slots,
      maxPlaces: MAX_PLACES,
    });
  } catch (error) {
    console.error('[Examen Slots Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des créneaux' },
      { status: 500 }
    );
  }
}
