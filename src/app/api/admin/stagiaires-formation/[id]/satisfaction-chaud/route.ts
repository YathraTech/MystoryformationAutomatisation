import { NextRequest, NextResponse } from 'next/server';
import { createSatisfactionChaud } from '@/lib/data/stagiaires-formation';
import { satisfactionChaudSchema } from '@/lib/validations/formation.schema';

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

    const body = await request.json();
    const parsed = satisfactionChaudSchema.safeParse({ ...body, stagiaireId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const satisfaction = await createSatisfactionChaud({
      stagiaire_id: stagiaireId,
      cours_session_id: d.coursSessionId || null,
      formatrice_id: body.formatriceId || null,
      formatrice_nom: body.formatriceNom || null,
      q1_contenu_clair: d.q1ContenuClair,
      q2_formateur_explique: d.q2FormateurExplique,
      q3_progression: d.q3Progression,
      q4_accueil: d.q4Accueil,
      q5_recommandation: d.q5Recommandation,
      commentaire: d.commentaire || null,
    });

    return NextResponse.json(satisfaction, { status: 201 });
  } catch (error) {
    console.error('[POST satisfaction-chaud]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}
