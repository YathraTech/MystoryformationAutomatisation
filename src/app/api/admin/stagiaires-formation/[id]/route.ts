import { NextRequest, NextResponse } from 'next/server';
import {
  getStagiaireFormationById,
  updateStagiaireFormation,
  getTestsByStagiaire,
  getAnalyseBesoin,
  getEvaluationByStagiaire,
  getEmargementsByStagiaire,
  getSatisfactionChaudByStagiaire,
  getSatisfactionFroid,
} from '@/lib/data/stagiaires-formation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stagiaireId = parseInt(id);
    if (isNaN(stagiaireId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const stagiaire = await getStagiaireFormationById(stagiaireId);
    if (!stagiaire) {
      return NextResponse.json({ error: 'Stagiaire non trouvé' }, { status: 404 });
    }

    // Charger toutes les données associées en parallèle
    const [tests, analyse, evalInitiale, evalFinale, emargements, satisfactionChaud, satisfactionFroid] =
      await Promise.all([
        getTestsByStagiaire(stagiaireId),
        getAnalyseBesoin(stagiaireId),
        getEvaluationByStagiaire(stagiaireId, 'initiale'),
        getEvaluationByStagiaire(stagiaireId, 'finale'),
        getEmargementsByStagiaire(stagiaireId),
        getSatisfactionChaudByStagiaire(stagiaireId),
        getSatisfactionFroid(stagiaireId),
      ]);

    const testInitial = tests.find((t) => t.typeTest === 'initial') || null;
    const testFinal = tests.find((t) => t.typeTest === 'final') || null;

    return NextResponse.json({
      stagiaire,
      testInitial,
      testFinal,
      analyse,
      evalInitiale,
      evalFinale,
      emargements,
      satisfactionChaud,
      satisfactionFroid,
    });
  } catch (error) {
    console.error('[GET stagiaire-formation/:id]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du stagiaire' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Mapper camelCase → snake_case
    const dbFields: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      formatriceId: 'formatrice_id',
      formatriceNom: 'formatrice_nom',
      agence: 'agence',
      joursFormation: 'jours_formation',
      horairesFormation: 'horaires_formation',
      modePaiement: 'mode_paiement',
      montantTotal: 'montant_total',
      paiementPlusieursFois: 'paiement_plusieurs_fois',
      nombreEcheances: 'nombre_echeances',
      numeroDossierCpf: 'numero_dossier_cpf',
      statutPaiement: 'statut_paiement',
      statut: 'statut',
      heuresPrevues: 'heures_prevues',
      heuresEffectuees: 'heures_effectuees',
      dateDebutFormation: 'date_debut_formation',
      dateFinFormation: 'date_fin_formation',
      referentHandicap: 'referent_handicap',
      situationHandicapDetail: 'situation_handicap_detail',
      pdfConvention: 'pdf_convention',
      pdfConvocation: 'pdf_convocation',
      pdfProgramme: 'pdf_programme',
      pdfAttestationFin: 'pdf_attestation_fin',
      mailInscriptionEnvoye: 'mail_inscription_envoye',
      mailRappelEnvoye: 'mail_rappel_envoye',
      mailAttestationEnvoye: 'mail_attestation_envoye',
      commercialeId: 'commerciale_id',
      commercialeNom: 'commerciale_nom',
      photoPieceIdentite: 'photo_piece_identite',
      photoCandidat: 'photo_candidat',
    };

    for (const [key, value] of Object.entries(body)) {
      const dbKey = fieldMap[key] || key;
      dbFields[dbKey] = value;
    }

    await updateStagiaireFormation(stagiaireId, dbFields);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH stagiaire-formation/:id]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
