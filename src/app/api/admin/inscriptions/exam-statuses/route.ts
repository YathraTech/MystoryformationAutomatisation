import { NextResponse } from 'next/server';
import { getAllExamens } from '@/lib/data/examens';
import { getSessionUser } from '@/lib/auth/session';

export interface ExamStatusInfo {
  id: number;
  resultat: 'a_venir' | 'reussi' | 'echoue' | 'absent';
  diplome: string | null;
  dateExamen: string | null;
  lieu: string | null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const isCommercial = user.role === 'commercial';
    const userLieu = user.lieu;

    const allExamens = await getAllExamens();

    const examens = (isCommercial && userLieu)
      ? allExamens.filter((ex) => ex.lieu === userLieu)
      : allExamens;

    // Grouper par email (lowercase)
    const statuses: Record<string, ExamStatusInfo[]> = {};
    for (const ex of examens) {
      if (!ex.email) continue;
      const key = ex.email.toLowerCase();
      if (!statuses[key]) statuses[key] = [];
      statuses[key].push({
        id: ex.id,
        resultat: ex.resultat,
        diplome: ex.diplome,
        dateExamen: ex.dateExamen,
        lieu: ex.lieu,
      });
    }

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('[exam-statuses GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des statuts' },
      { status: 500 }
    );
  }
}
