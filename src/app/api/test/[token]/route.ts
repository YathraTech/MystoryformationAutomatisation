import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Récupérer les infos du stagiaire + les questions QCM
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Le token est l'ID du stagiaire encodé (simple pour l'instant)
    const stagiaireId = parseInt(Buffer.from(token, 'base64').toString());
    if (isNaN(stagiaireId)) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 400 });
    }

    // Vérifier que le stagiaire existe
    const { data: stagiaire, error: stagError } = await supabase
      .from('stagiaires_formation')
      .select('id, nom, prenom, civilite, statut')
      .eq('id', stagiaireId)
      .single();

    if (stagError || !stagiaire) {
      return NextResponse.json({ error: 'Stagiaire non trouvé' }, { status: 404 });
    }

    // Vérifier si le test a déjà été passé
    const { data: existingTest } = await supabase
      .from('tests_formation')
      .select('id')
      .eq('stagiaire_id', stagiaireId)
      .eq('type_test', 'initial')
      .maybeSingle();

    if (existingTest) {
      return NextResponse.json({
        error: 'Test déjà passé',
        alreadyCompleted: true,
        stagiaire: { nom: stagiaire.nom, prenom: stagiaire.prenom },
      });
    }

    // Récupérer les questions actives
    const { data: questionsCe } = await supabase
      .from('qcm_questions')
      .select('id, type_competence, niveau, question, choix, choix_multiple, reponses_correctes, media_url, points')
      .eq('type_competence', 'CE')
      .eq('actif', true)
      .order('ordre', { ascending: true });

    const { data: questionsCo } = await supabase
      .from('qcm_questions')
      .select('id, type_competence, niveau, question, choix, choix_multiple, reponses_correctes, media_url, points')
      .eq('type_competence', 'CO')
      .eq('actif', true)
      .order('ordre', { ascending: true });

    return NextResponse.json({
      stagiaire: {
        id: stagiaire.id,
        nom: stagiaire.nom,
        prenom: stagiaire.prenom,
        civilite: stagiaire.civilite,
      },
      questionsCe: questionsCe || [],
      questionsCo: questionsCo || [],
    });
  } catch (error) {
    console.error('[GET test]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Soumettre les réponses du test
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const stagiaireId = parseInt(Buffer.from(token, 'base64').toString());
    if (isNaN(stagiaireId)) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { reponsesCe, reponsesCo, scoreEe, scoreEo, profilPedagogique } = body;

    // Récupérer toutes les questions pour la correction
    const { data: allQuestions } = await supabase
      .from('qcm_questions')
      .select('id, type_competence, reponse_correcte, choix_multiple, reponses_correctes, points')
      .eq('actif', true);

    const questions = allQuestions || [];

    // Fonction de vérification (supporte choix unique et multiple)
    function isCorrect(q: typeof questions[number], userReponse: string): boolean {
      if (q.choix_multiple && q.reponses_correctes?.length > 0) {
        // Choix multiple: comparer les sets de réponses
        const userLetters = userReponse.split(',').filter(Boolean).sort();
        const correctLetters = [...q.reponses_correctes].sort();
        return userLetters.length === correctLetters.length &&
          userLetters.every((l, i) => l === correctLetters[i]);
      }
      // Choix unique
      return userReponse === q.reponse_correcte;
    }

    // Correction automatique CE
    let scoreCe = 0;
    let totalCe = 0;
    const detailsCe: { question: number; reponse: string; correct: boolean }[] = [];

    if (reponsesCe && Array.isArray(reponsesCe)) {
      const ceQuestions = questions.filter((q) => q.type_competence === 'CE');
      totalCe = ceQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

      for (const r of reponsesCe) {
        const q = ceQuestions.find((q) => q.id === r.questionId);
        const correct = q ? isCorrect(q, r.reponse) : false;
        if (correct && q) scoreCe += q.points || 1;
        detailsCe.push({ question: r.questionId, reponse: r.reponse, correct });
      }
      scoreCe = totalCe > 0 ? Math.round((scoreCe / totalCe) * 20 * 10) / 10 : 0;
    }

    // Correction automatique CO
    let scoreCo = 0;
    let totalCo = 0;
    const detailsCo: { question: number; reponse: string; correct: boolean }[] = [];

    if (reponsesCo && Array.isArray(reponsesCo)) {
      const coQuestions = questions.filter((q) => q.type_competence === 'CO');
      totalCo = coQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

      for (const r of reponsesCo) {
        const q = coQuestions.find((q) => q.id === r.questionId);
        const correct = q ? isCorrect(q, r.reponse) : false;
        if (correct && q) scoreCo += q.points || 1;
        detailsCo.push({ question: r.questionId, reponse: r.reponse, correct });
      }
      scoreCo = totalCo > 0 ? Math.round((scoreCo / totalCo) * 20 * 10) / 10 : 0;
    }

    // Enregistrer le test
    const { error: insertError } = await supabase
      .from('tests_formation')
      .insert({
        stagiaire_id: stagiaireId,
        type_test: 'initial',
        date_test: new Date().toISOString().split('T')[0],
        score_ce: scoreCe,
        score_co: scoreCo,
        score_ee: scoreEe || 0,
        score_eo: scoreEo || 0,
        profil_pedagogique: profilPedagogique || 'FLE',
        reponses_ce: detailsCe,
        reponses_co: detailsCo,
      });

    if (insertError) throw new Error(insertError.message);

    // Mettre à jour le statut du stagiaire
    await supabase
      .from('stagiaires_formation')
      .update({ statut: 'test_initial' })
      .eq('id', stagiaireId);

    const scoreGlobal = scoreCe + scoreCo + (scoreEe || 0) + (scoreEo || 0);
    const niveau = scoreGlobal >= 19 ? 'B2' : scoreGlobal >= 15 ? 'B1' : scoreGlobal >= 10 ? 'A2' : scoreGlobal >= 5 ? 'A1' : 'A0';

    return NextResponse.json({
      success: true,
      scores: { ce: scoreCe, co: scoreCo, ee: scoreEe || 0, eo: scoreEo || 0 },
      scoreGlobal,
      niveau,
      detailsCe,
      detailsCo,
    });
  } catch (error) {
    console.error('[POST test]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
