import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCoursSessions,
  createCoursSession,
} from '@/lib/data/stagiaires-formation';
import { coursSessionSchema } from '@/lib/validations/formation.schema';
import type { Agence } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agence = searchParams.get('agence') as Agence | null;

    const sessions = await getAllCoursSessions(agence || undefined);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('[GET cours-sessions]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = coursSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const session = await createCoursSession({
      date_cours: d.dateCours,
      agence: d.agence,
      formatrice_id: d.formatriceId || null,
      formatrice_nom: body.formatriceNom || null,
      horaire: d.horaire,
      duree_heures: d.dureeHeures,
      notes: d.notes || null,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('[POST cours-sessions]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session' },
      { status: 500 }
    );
  }
}
