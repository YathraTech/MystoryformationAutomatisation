// Génération des créneaux d'examens (lundi / vendredi).
// Source de vérité unique partagée entre la route admin et la route partenaire.
// Calculs purement mathématiques (sans objet Date) pour éviter les décalages de fuseau.

export const EXAM_MAX_PLACES = 15;

export interface ExamSlot {
  date: string; // YYYY-MM-DD
  count: number;
  maxPlaces: number;
  jour: 'lundi' | 'vendredi';
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDaysInMonth(year: number, month: number): number {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return daysPerMonth[month - 1];
}

// Jour de la semaine via la formule de Zeller : 0=dimanche, 1=lundi, ..., 6=samedi
export function getDayOfWeek(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m < 3) {
    m += 12;
    y -= 1;
  }
  const k = y % 100;
  const j = Math.floor(y / 100);
  const h = (day + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) - 2 * j) % 7;
  // Zeller : 0=samedi → on convertit vers 0=dimanche
  return (h + 6) % 7;
}

export function formatExamDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(
  year: number,
  month: number,
  day: number,
  daysToAdd: number,
): { year: number; month: number; day: number } {
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

/**
 * Génère les créneaux d'examens (lundi/vendredi) entre deux dates ISO incluses.
 * @param startISO date de début (YYYY-MM-DD)
 * @param endISO date de fin (YYYY-MM-DD)
 * @param countByDate nombre d'examens déjà planifiés par date (occupation)
 */
export function generateExamSlots(
  startISO: string,
  endISO: string,
  countByDate: Record<string, number> = {},
): ExamSlot[] {
  const [sy, sm, sd] = startISO.split('-').map(Number);
  if (!sy || !sm || !sd) return [];

  const slots: ExamSlot[] = [];
  let current = { year: sy, month: sm, day: sd };

  while (formatExamDate(current.year, current.month, current.day) <= endISO) {
    const dayOfWeek = getDayOfWeek(current.year, current.month, current.day);
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      const dateStr = formatExamDate(current.year, current.month, current.day);
      slots.push({
        date: dateStr,
        count: countByDate[dateStr] || 0,
        maxPlaces: EXAM_MAX_PLACES,
        jour: dayOfWeek === 1 ? 'lundi' : 'vendredi',
      });
    }
    current = addDays(current.year, current.month, current.day, 1);
  }
  return slots;
}
