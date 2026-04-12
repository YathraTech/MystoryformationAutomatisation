import { NextRequest, NextResponse } from 'next/server';
import {
  createTest,
  updateTest,
  getTestInitial,
  getTestFinal,
  updateStagiaireStatut,
  calculerScoreQcm,
  getQcmQuestions,
} from '@/lib/data/stagiaires-formation';
import { testFormationSchema } from '@/lib/validations/formation.schema';

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
    const parsed = testFormationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Correction automatique des QCM si réponses fournies
    let scoreCe = d.scoreCe;
    let scoreCo = d.scoreCo;
    let reponsesCeDetail = null;
    let reponsesCoDetail = null;

    if (body.reponsesCe && Array.isArray(body.reponsesCe)) {
      const questionsCe = await getQcmQuestions('CE');
      const result = calculerScoreQcm(body.reponsesCe, questionsCe);
      scoreCe = result.score;
      reponsesCeDetail = result.details;
    }

    if (body.reponsesCo && Array.isArray(body.reponsesCo)) {
      const questionsCo = await getQcmQuestions('CO');
      const result = calculerScoreQcm(body.reponsesCo, questionsCo);
      scoreCo = result.score;
      reponsesCoDetail = result.details;
    }

    // Vérifier si un test du même type existe déjà
    const existing = d.typeTest === 'initial'
      ? await getTestInitial(stagiaireId)
      : await getTestFinal(stagiaireId);

    if (existing) {
      // Mettre à jour
      await updateTest(existing.id, {
        date_test: d.dateTest,
        score_ce: scoreCe,
        score_co: scoreCo,
        score_ee: d.scoreEe,
        score_eo: d.scoreEo,
        profil_pedagogique: d.profilPedagogique,
        reponses_ce: reponsesCeDetail,
        reponses_co: reponsesCoDetail,
      });
      return NextResponse.json({ success: true, updated: true, id: existing.id });
    }

    // Créer un nouveau test
    const test = await createTest({
      stagiaire_id: stagiaireId,
      type_test: d.typeTest,
      date_test: d.dateTest,
      score_ce: scoreCe,
      score_co: scoreCo,
      score_ee: d.scoreEe,
      score_eo: d.scoreEo,
      profil_pedagogique: d.profilPedagogique,
      reponses_ce: reponsesCeDetail,
      reponses_co: reponsesCoDetail,
    });

    // Mettre à jour le statut du stagiaire
    if (d.typeTest === 'initial') {
      await updateStagiaireStatut(stagiaireId, 'test_initial');
    } else {
      await updateStagiaireStatut(stagiaireId, 'test_final');
    }

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error('[POST test]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du test' },
      { status: 500 }
    );
  }
}
