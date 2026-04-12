import { NextRequest, NextResponse } from 'next/server';
import {
  createAnalyseBesoin,
  updateAnalyseBesoin,
  getAnalyseBesoin,
  updateStagiaireStatut,
} from '@/lib/data/stagiaires-formation';
import { analyseBesoinSchema } from '@/lib/validations/formation.schema';

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
    const parsed = analyseBesoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const existing = await getAnalyseBesoin(stagiaireId);

    const dbFields = {
      stagiaire_id: stagiaireId,
      objectif_formation: d.objectifFormation,
      niveau_estime: d.niveauEstime || null,
      methode_positionnement: d.methodePositionnement,
      situation_professionnelle: d.situationProfessionnelle,
      disponibilites: d.disponibilites,
      situation_handicap: d.situationHandicap,
      situation_handicap_detail: d.situationHandicapDetail || null,
      duree_estimee_formation: d.dureeEstimeeFormation,
      niveau_vise: d.niveauVise,
      type_certification_visee: d.typeCertificationVisee,
      mode_financement: d.modeFinancement,
      commentaires: d.commentaires || null,
      commerciale_nom: body.commercialeNom || null,
    };

    if (existing) {
      await updateAnalyseBesoin(existing.id, dbFields);
      return NextResponse.json({ success: true, updated: true });
    }

    const analyse = await createAnalyseBesoin(dbFields);
    await updateStagiaireStatut(stagiaireId, 'analyse_besoin');

    return NextResponse.json(analyse, { status: 201 });
  } catch (error) {
    console.error('[POST analyse-besoin]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde de l\'analyse de besoin' },
      { status: 500 }
    );
  }
}
