import { NextRequest, NextResponse } from 'next/server';
import { getExamensByDate, markResultatEmailSent } from '@/lib/data/examens';
import { getSessionUser } from '@/lib/auth/session';
import type { ExamenResultat } from '@/lib/data/examens';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dateExamen: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { dateExamen } = await params;
    const body = await request.json();
    const { examenIds } = body as { examenIds?: number[] };

    // Récupérer les examens de cette date
    const allExamens = await getExamensByDate(dateExamen);

    // Filtrer par lieu si commercial
    const isCommercial = user.role === 'commercial';
    const userLieu = user.lieu;
    const examens = (isCommercial && userLieu)
      ? allExamens.filter((ex) => ex.lieu === userLieu)
      : allExamens;

    // Si examenIds fourni, ne traiter que ceux-là (renvoi individuel)
    // Sinon, envoyer à tous ceux qui ont un résultat et pas encore d'email envoyé
    const toSend = examenIds
      ? examens.filter((ex) => examenIds.includes(ex.id) && ex.resultat !== 'a_venir')
      : examens.filter((ex) => ex.resultat !== 'a_venir' && !ex.resultatEmailSent);

    if (toSend.length === 0) {
      return NextResponse.json({
        success: true,
        emailsSent: 0,
        message: 'Aucun email à envoyer.',
      });
    }

    // Grouper par résultat
    const groups = new Map<ExamenResultat, typeof toSend>();
    for (const ex of toSend) {
      const key = ex.resultat;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ex);
    }

    // Envoyer au webhook Make.com
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
      emailsSent = toSend.length;
    }

    // Marquer comme envoyé
    const ids = toSend.map((ex) => ex.id);
    await markResultatEmailSent(ids);

    return NextResponse.json({
      success: true,
      emailsSent,
      message: `${emailsSent} email(s) de résultat envoyé(s).`,
    });
  } catch (error) {
    console.error('[Feuille send-resultats Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des résultats' },
      { status: 500 }
    );
  }
}
