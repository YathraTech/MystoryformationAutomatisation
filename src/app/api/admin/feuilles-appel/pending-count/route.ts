import { NextResponse } from 'next/server';
import { getAllExamens } from '@/lib/data/examens';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const isCommercial = user.role === 'commercial';
    const userLieu = user.lieu;

    const allExamens = await getAllExamens();

    // Filtrage par lieu pour les commerciaux
    const examens = (isCommercial && userLieu)
      ? allExamens.filter((ex) => ex.lieu === userLieu)
      : allExamens;

    // Ne garder que les examens avec date_examen
    const examensWithDate = examens.filter((ex) => ex.dateExamen);

    // Grouper par date_examen
    const grouped = new Map<string, typeof examensWithDate>();
    for (const ex of examensWithDate) {
      const date = ex.dateExamen!;
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date)!.push(ex);
    }

    // Calculer la date Paris
    const now = new Date();
    const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const todayStr = parisNow.toISOString().split('T')[0];

    // Feuille courante : aujourd'hui, ou la date la plus récente avec des résultats à remplir
    let currentDateExamen: string | null = null;

    if (grouped.has(todayStr)) {
      currentDateExamen = todayStr;
    } else {
      const pastDates = Array.from(grouped.keys())
        .filter((d) => d <= todayStr)
        .sort();
      for (let i = pastDates.length - 1; i >= 0; i--) {
        const exs = grouped.get(pastDates[i])!;
        if (exs.some((e) => e.resultat === 'a_venir')) {
          currentDateExamen = pastDates[i];
          break;
        }
      }
    }

    if (!currentDateExamen || !grouped.has(currentDateExamen)) {
      return NextResponse.json({ count: 0 });
    }

    const count = grouped.get(currentDateExamen)!
      .filter((e) => e.resultat === 'a_venir').length;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[pending-count GET Error]', error);
    return NextResponse.json({ count: 0 });
  }
}
