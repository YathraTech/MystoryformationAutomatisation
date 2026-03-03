import { NextRequest, NextResponse } from 'next/server';
import { getExamensPendingResultEmail, markResultatEmailSent, updateExamenResultat, getAllExamens } from '@/lib/data/examens';
import type { ExamenResultat } from '@/lib/data/examens';
import { isDeadlinePassed } from '@/lib/utils/feuille-deadline';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // 1. Auto-absent : marquer les examens non renseignés dont la deadline est passée
    const allExamens = await getAllExamens();
    let autoAbsentCount = 0;
    for (const ex of allExamens) {
      if (
        ex.resultat === 'a_venir' &&
        !ex.resultatEmailSent &&
        ex.dateExamen &&
        isDeadlinePassed(ex.dateExamen, ex.heureExamen)
      ) {
        await updateExamenResultat(ex.id, 'absent');
        autoAbsentCount++;
      }
    }

    // 2. Fetch pending : examens avec résultat rempli mais email non envoyé
    const pending = await getExamensPendingResultEmail();

    // 3. Filtrer : ne garder que ceux dont la deadline est passée
    const ready = pending.filter((ex) => ex.dateExamen && isDeadlinePassed(ex.dateExamen, ex.heureExamen));

    if (ready.length === 0) {
      return NextResponse.json({
        success: true,
        autoAbsent: autoAbsentCount,
        emailsSent: 0,
        message: `${autoAbsentCount} auto-absent(s). Aucun email à envoyer.`,
      });
    }

    // 4. Grouper par résultat
    const groups = new Map<ExamenResultat, typeof ready>();
    for (const ex of ready) {
      const key = ex.resultat;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ex);
    }

    // 5. Envoyer au webhook Make.com pour chaque groupe
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    let emailsSent = 0;

    if (webhookUrl) {
      for (const [resultat, candidats] of groups) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'resultat_examen',
              resultat,
              timestamp: new Date().toISOString(),
              total: candidats.length,
              candidats: candidats.map((c) => ({
                email: c.email,
                prenom: c.prenom,
                nom: c.nom,
                diplome: c.diplome,
                dateExamen: c.dateExamen,
                lieu: c.lieu,
                resultat: c.resultat,
              })),
            }),
          });
          emailsSent += candidats.length;
        } catch (webhookError) {
          console.error(`[send-resultats] Webhook error for ${resultat}:`, webhookError);
        }
      }
    } else {
      console.warn('[send-resultats] MAKE_WEBHOOK_URL non configuré');
      emailsSent = ready.length;
    }

    // 6. Marquer comme envoyé
    const ids = ready.map((ex) => ex.id);
    await markResultatEmailSent(ids);

    return NextResponse.json({
      success: true,
      autoAbsent: autoAbsentCount,
      emailsSent,
      message: `${autoAbsentCount} auto-absent(s). ${emailsSent} email(s) de résultat envoyé(s).`,
    });
  } catch (error) {
    console.error('[Cron send-resultats]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des résultats' },
      { status: 500 }
    );
  }
}
