import { NextRequest, NextResponse } from 'next/server';
import {
  createEvaluation,
  updateEvaluation,
  getEvaluationByStagiaire,
  getTestInitial,
  getTestFinal,
  getAnalyseBesoin,
  updateStagiaireStatut,
} from '@/lib/data/stagiaires-formation';

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
    const typeEvaluation = body.typeEvaluation as 'initiale' | 'finale';

    if (!['initiale', 'finale'].includes(typeEvaluation)) {
      return NextResponse.json({ error: 'Type d\'évaluation invalide' }, { status: 400 });
    }

    // Récupérer les données depuis le test et l'analyse
    const testInitial = await getTestInitial(stagiaireId);
    const analyse = await getAnalyseBesoin(stagiaireId);

    const dbFields: Record<string, unknown> = {
      stagiaire_id: stagiaireId,
      type_evaluation: typeEvaluation,
    };

    if (typeEvaluation === 'initiale') {
      // Auto-remplir depuis test initial
      if (testInitial) {
        dbFields.profil_pedagogique = testInitial.profilPedagogique;
        dbFields.score_ce = testInitial.scoreCe;
        dbFields.score_co = testInitial.scoreCo;
        dbFields.score_ee = testInitial.scoreEe;
        dbFields.score_eo = testInitial.scoreEo;
        dbFields.niveau_global = testInitial.niveauEstime;

        // Grille de niveaux par compétence
        const grille: Record<string, string> = {
          CE: getNiveauFromScore(testInitial.scoreCe),
          CO: getNiveauFromScore(testInitial.scoreCo),
          EE: getNiveauFromScore(testInitial.scoreEe),
          EO: getNiveauFromScore(testInitial.scoreEo),
        };
        dbFields.grille_niveaux = grille;
      }

      // Recueil d'infos depuis le body
      if (body.recueil) {
        Object.assign(dbFields, {
          scolarisation_france: body.recueil.scolarisationFrance,
          scolarisation_etranger: body.recueil.scolarisationEtranger,
          alphabetisation: body.recueil.alphabetisation,
          cours_francais: body.recueil.coursFrancais,
          cours_francais_detail: body.recueil.coursFrancaisDetail,
          diplomes_langues: body.recueil.diplomesLangues,
          anglais: body.recueil.anglais,
          langues_parlees: body.recueil.languesParlees,
          usage_ordinateur: body.recueil.usageOrdinateur,
          maitrise_clavier: body.recueil.maitriseClavier,
          smartphone_tablette: body.recueil.smartphoneTablette,
          ordinateur_maison: body.recueil.ordinateurMaison,
          acces_internet: body.recueil.accesInternet,
          utilisation_boite_mail: body.recueil.utilisationBoiteMail,
          session_ordinateur: body.recueil.sessionOrdinateur,
          motivation: body.recueil.motivation,
          apres_formation: body.recueil.apresFormation,
          besoins_vie_quotidienne: body.recueil.besoinsVieQuotidienne,
          besoins_vie_professionnelle: body.recueil.besoinsVieProfessionnelle,
          certification_visee: body.recueil.certificationVisee,
          certification_visee_detail: body.recueil.certificationViseeDetail,
        });
      }

      if (analyse) {
        dbFields.certification_visee_detail = analyse.typeCertificationVisee?.join(', ');
      }

      dbFields.signature_intervenant = body.signatureIntervenant || null;

    } else {
      // Évaluation finale — comparaison initiale vs finale
      const testFinal = await getTestFinal(stagiaireId);

      if (testFinal) {
        dbFields.score_ce = testFinal.scoreCe;
        dbFields.score_co = testFinal.scoreCo;
        dbFields.score_ee = testFinal.scoreEe;
        dbFields.score_eo = testFinal.scoreEo;
        dbFields.niveau_global = testFinal.niveauEstime;
        dbFields.profil_pedagogique = testFinal.profilPedagogique;

        dbFields.grille_niveaux = {
          CE: getNiveauFromScore(testFinal.scoreCe),
          CO: getNiveauFromScore(testFinal.scoreCo),
          EE: getNiveauFromScore(testFinal.scoreEe),
          EO: getNiveauFromScore(testFinal.scoreEo),
        };
      }

      // Comparaison
      if (testInitial && testFinal) {
        dbFields.comparaison_initiale_finale = {
          CE: { initial: testInitial.scoreCe, final: testFinal.scoreCe },
          CO: { initial: testInitial.scoreCo, final: testFinal.scoreCo },
          EE: { initial: testInitial.scoreEe, final: testFinal.scoreEe },
          EO: { initial: testInitial.scoreEo, final: testFinal.scoreEo },
        };
      }

      dbFields.remarques = body.remarques || null;
      dbFields.axes_progression = body.axesProgression || null;
      dbFields.signature_intervenant = body.signatureIntervenant || null;
    }

    const existing = await getEvaluationByStagiaire(stagiaireId, typeEvaluation);

    if (existing) {
      await updateEvaluation(existing.id, dbFields);
      return NextResponse.json({ success: true, updated: true });
    }

    const evaluation = await createEvaluation(dbFields);

    // Mettre à jour le statut
    await updateStagiaireStatut(
      stagiaireId,
      typeEvaluation === 'initiale' ? 'evaluation_initiale' : 'evaluation_finale'
    );

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error('[POST evaluation]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'évaluation' },
      { status: 500 }
    );
  }
}

function getNiveauFromScore(score: number): string {
  if (score >= 19) return 'B2+';
  if (score >= 16) return 'B2';
  if (score >= 13) return 'B1';
  if (score >= 10) return 'A2';
  if (score >= 7) return 'A1';
  if (score >= 4) return 'A1.1';
  return '<A1.1';
}
