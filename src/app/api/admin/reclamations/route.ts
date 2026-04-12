import { NextRequest, NextResponse } from 'next/server';
import {
  getAllReclamations,
  createReclamation,
  updateReclamation,
} from '@/lib/data/stagiaires-formation';
import { reclamationSchema } from '@/lib/validations/formation.schema';

export async function GET() {
  try {
    const reclamations = await getAllReclamations();
    return NextResponse.json(reclamations);
  } catch (error) {
    console.error('[GET reclamations]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réclamations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reclamationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const reclamation = await createReclamation({
      stagiaire_id: d.stagiaireId || null,
      objet: d.objet,
      description: d.description,
    });

    return NextResponse.json(reclamation, { status: 201 });
  } catch (error) {
    console.error('[POST reclamations]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la réclamation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const dbFields: Record<string, unknown> = {};
    if (fields.statut !== undefined) dbFields.statut = fields.statut;
    if (fields.reponse !== undefined) dbFields.reponse = fields.reponse;
    if (fields.traitePar !== undefined) dbFields.traite_par = fields.traitePar;
    if (fields.dateResolution !== undefined) dbFields.date_resolution = fields.dateResolution;

    await updateReclamation(id, dbFields);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH reclamations]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
