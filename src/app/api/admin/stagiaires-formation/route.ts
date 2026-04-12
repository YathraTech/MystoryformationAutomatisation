import { NextRequest, NextResponse } from 'next/server';
import {
  getAllStagiairesFormation,
  createStagiaireFormation,
  getFormationStats,
} from '@/lib/data/stagiaires-formation';
import { ficheClientFormationSchema } from '@/lib/validations/formation.schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      const formationStats = await getFormationStats();
      return NextResponse.json(formationStats);
    }

    const stagiaires = await getAllStagiairesFormation();
    return NextResponse.json(stagiaires);
  } catch (error) {
    console.error('[GET stagiaires-formation]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des stagiaires' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valider les données
    const parsed = ficheClientFormationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Convertir en snake_case pour la DB
    const dbFields = {
      civilite: d.civilite,
      nom: d.nom.toUpperCase(),
      nom_jeune_fille: d.nomJeuneFille || null,
      prenom: d.prenom,
      date_naissance: d.dateNaissance,
      nationalite: d.nationalite,
      telephone: d.telephone,
      email: d.email.toLowerCase(),
      adresse_postale: d.adressePostale,
      numero_piece_identite: d.numeroPieceIdentite,
      type_piece: d.typePiece,
      agence: d.agence,
      commerciale_id: d.commercialeId || null,
      commerciale_nom: body.commercialeNom || null,
      source_provenance: d.sourceProvenance || null,
      type_prestation: d.typePrestation,
      statut: 'inscription',
    };

    const stagiaire = await createStagiaireFormation(dbFields);
    return NextResponse.json(stagiaire, { status: 201 });
  } catch (error) {
    console.error('[POST stagiaires-formation]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du stagiaire' },
      { status: 500 }
    );
  }
}
