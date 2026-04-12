import { NextRequest, NextResponse } from 'next/server';
import { createSatisfactionFroid, getSatisfactionFroid } from '@/lib/data/stagiaires-formation';
import { satisfactionFroidSchema } from '@/lib/validations/formation.schema';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stagiaireId = parseInt(id);
    if (isNaN(stagiaireId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Vérifier si déjà rempli
    const existing = await getSatisfactionFroid(stagiaireId);
    if (existing) {
      return NextResponse.json(
        { error: 'Le questionnaire à froid a déjà été rempli' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = satisfactionFroidSchema.safeParse({ ...body, stagiaireId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const satisfaction = await createSatisfactionFroid({
      stagiaire_id: stagiaireId,
      q1_utilite: d.q1Utilite,
      q2_reussite_examen: d.q2ReussiteExamen,
      q3_recommandation: d.q3Recommandation,
      commentaire: d.commentaire || null,
      date_reponse: new Date().toISOString().split('T')[0],
    });

    return NextResponse.json(satisfaction, { status: 201 });
  } catch (error) {
    console.error('[POST satisfaction-froid]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}
