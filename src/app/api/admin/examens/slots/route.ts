import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EXAM_MAX_PLACES, formatExamDate, generateExamSlots } from '@/lib/utils/exam-slots';

export async function GET() {
  try {
    const supabase = await createClient();

    // Récupérer tous les examens avec une date définie
    const { data: examens, error } = await supabase
      .from('examens')
      .select('date_examen')
      .not('date_examen', 'is', null);

    if (error) throw error;

    // Compter les examens par date (occupation)
    const countByDate: Record<string, number> = {};
    for (const ex of examens || []) {
      const date = ex.date_examen;
      if (date) {
        countByDate[date] = (countByDate[date] || 0) + 1;
      }
    }

    // Date du jour en heure de Paris
    const parisTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const todayYear = parisTime.getFullYear();
    const todayMonth = parisTime.getMonth() + 1;
    const todayDay = parisTime.getDate();

    // Fin : 6 mois dans le futur (28 du mois pour rester valide)
    let endYear = todayYear;
    let endMonth = todayMonth + 6;
    if (endMonth > 12) {
      endMonth -= 12;
      endYear++;
    }

    const startISO = formatExamDate(todayYear, todayMonth, todayDay);
    const endISO = formatExamDate(endYear, endMonth, 28);

    const slots = generateExamSlots(startISO, endISO, countByDate);

    return NextResponse.json({
      slots,
      maxPlaces: EXAM_MAX_PLACES,
    });
  } catch (error) {
    console.error('[Examen Slots Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des créneaux' },
      { status: 500 }
    );
  }
}
