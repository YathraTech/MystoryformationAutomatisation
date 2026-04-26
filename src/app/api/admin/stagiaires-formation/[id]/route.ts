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
import { getInscriptionById, updateInscriptionFields } from '@/lib/data/inscriptions';

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
    const [tests, analyse, evalInitiale, evalFinale, emargements, satisfactionChaud, satisfactionFroid, inscription] =
      await Promise.all([
        getTestsByStagiaire(stagiaireId),
        getAnalyseBesoin(stagiaireId),
        getEvaluationByStagiaire(stagiaireId, 'initiale'),
        getEvaluationByStagiaire(stagiaireId, 'finale'),
        getEmargementsByStagiaire(stagiaireId),
        getSatisfactionChaudByStagiaire(stagiaireId),
        getSatisfactionFroid(stagiaireId),
        stagiaire.inscriptionId ? getInscriptionById(stagiaire.inscriptionId) : Promise.resolve(null),
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
      inscription,
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
      // Identité & contact
      civilite: 'civilite',
      nom: 'nom',
      nomJeuneFille: 'nom_jeune_fille',
      prenom: 'prenom',
      dateNaissance: 'date_naissance',
      nationalite: 'nationalite',
      telephone: 'telephone',
      email: 'email',
      adressePostale: 'adresse_postale',
      numeroPieceIdentite: 'numero_piece_identite',
      typePiece: 'type_piece',
      // Agence / commercial / source
      agence: 'agence',
      sourceProvenance: 'source_provenance',
      typePrestation: 'type_prestation',
      commercialeId: 'commerciale_id',
      commercialeNom: 'commerciale_nom',
      // Formatrice & planning
      formatriceId: 'formatrice_id',
      formatriceNom: 'formatrice_nom',
      joursFormation: 'jours_formation',
      horairesFormation: 'horaires_formation',
      // Paiement
      modePaiement: 'mode_paiement',
      montantTotal: 'montant_total',
      paiementPlusieursFois: 'paiement_plusieurs_fois',
      nombreEcheances: 'nombre_echeances',
      numeroDossierCpf: 'numero_dossier_cpf',
      statutPaiement: 'statut_paiement',
      // Suivi
      statut: 'statut',
      heuresPrevues: 'heures_prevues',
      heuresEffectuees: 'heures_effectuees',
      dateDebutFormation: 'date_debut_formation',
      dateFinFormation: 'date_fin_formation',
      referentHandicap: 'referent_handicap',
      situationHandicapDetail: 'situation_handicap_detail',
      // Documents
      pdfConvention: 'pdf_convention',
      pdfConvocation: 'pdf_convocation',
      pdfProgramme: 'pdf_programme',
      pdfAttestationFin: 'pdf_attestation_fin',
      mailInscriptionEnvoye: 'mail_inscription_envoye',
      mailRappelEnvoye: 'mail_rappel_envoye',
      mailAttestationEnvoye: 'mail_attestation_envoye',
      photoPieceIdentite: 'photo_piece_identite',
      photoCandidat: 'photo_candidat',
    };

    for (const [key, value] of Object.entries(body)) {
      const dbKey = fieldMap[key] || key;
      dbFields[dbKey] = value;
    }

    await updateStagiaireFormation(stagiaireId, dbFields);

    // Propagation des champs partagés vers l'inscription liée (suivi → client).
    // Direction unique : on n'écrase pas les saisies stagiaire dans l'autre sens.
    const stagiaire = await getStagiaireFormationById(stagiaireId);
    if (stagiaire?.inscriptionId) {
      const propagated: Record<string, string> = {};
      const setIfPresent = (bodyKey: string, inscriptionKey: string) => {
        if (Object.prototype.hasOwnProperty.call(body, bodyKey) && body[bodyKey] != null) {
          propagated[inscriptionKey] = String(body[bodyKey]);
        }
      };
      setIfPresent('civilite', 'civilite');
      setIfPresent('nom', 'nom');
      setIfPresent('prenom', 'prenom');
      setIfPresent('email', 'email');
      setIfPresent('telephone', 'telephone');
      setIfPresent('dateNaissance', 'dateNaissance');
      setIfPresent('numeroDossierCpf', 'numeroDossierCPF');
      setIfPresent('dateDebutFormation', 'dateFormation');

      if (Object.keys(propagated).length > 0) {
        try {
          await updateInscriptionFields(stagiaire.inscriptionId, propagated);
        } catch (err) {
          // Ne pas faire échouer le PATCH stagiaire si la propagation rate
          console.error('[PATCH stagiaire-formation/:id] Propagation inscription failed', err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH stagiaire-formation/:id]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
