import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getExamensForPlanning } from '@/lib/data/examens';
import { getAllExamTypes } from '@/lib/data/exam-types';
import { EXAM_MAX_PLACES, generateExamSlots } from '@/lib/utils/exam-slots';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'partenaire') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate et endDate sont requis' },
        { status: 400 }
      );
    }

    const [examens, examTypes] = await Promise.all([
      getExamensForPlanning(startDate, endDate),
      getAllExamTypes(),
    ]);

    // Créneaux d'examens (lundi/vendredi) de la période + occupation par date.
    // L'occupation compte TOUS les examens planifiés (tous partenaires/centres),
    // pas seulement ceux du partenaire connecté.
    const countByDate: Record<string, number> = {};
    for (const ex of examens) {
      if (ex.dateExamen) {
        countByDate[ex.dateExamen] = (countByDate[ex.dateExamen] || 0) + 1;
      }
    }
    const slots = generateExamSlots(startDate, endDate, countByDate);

    // Sanitize: only show full details for own candidates
    const sanitized = examens.map((ex) => {
      const isOwn = ex.partenaireId === user.id;
      return {
        id: ex.id,
        date: ex.dateExamen,
        heure: ex.heureExamen,
        diplome: ex.diplome,
        typeExamen: ex.typeExamen,
        lieu: ex.lieu,
        isOwnCandidat: isOwn,
        // Only expose name for own candidates
        nom: isOwn ? ex.nom : null,
        prenom: isOwn ? ex.prenom : null,
      };
    });

    return NextResponse.json({
      examens: sanitized,
      examTypes: examTypes.map(t => ({ code: t.code, label: t.label, color: t.color })),
      slots,
      maxPlaces: EXAM_MAX_PLACES,
    });
  } catch (error) {
    console.error('[Partenaire Planning API Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du planning' },
      { status: 500 }
    );
  }
}
