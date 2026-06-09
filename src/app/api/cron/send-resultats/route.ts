import { NextRequest, NextResponse } from 'next/server';
import { updateExamenResultat, getAllExamens } from '@/lib/data/examens';
import { isDeadlinePassed } from '@/lib/utils/feuille-deadline';

// NOTE : ce cron ne fait PLUS d'envoi automatique d'emails de résultat.
// Les résultats sont désormais envoyés manuellement, sur mesure, depuis la
// feuille d'appel (boutons « Envoyer » par candidat). Le cron se limite à
// marquer automatiquement comme « absent » les examens passés non renseignés.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // Auto-absent : marquer les examens non renseignés dont la deadline est passée
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

    return NextResponse.json({
      success: true,
      autoAbsent: autoAbsentCount,
      emailsSent: 0,
      message: `${autoAbsentCount} auto-absent(s). Envoi automatique des résultats désactivé (envoi manuel uniquement).`,
    });
  } catch (error) {
    console.error('[Cron send-resultats]', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement des résultats' },
      { status: 500 }
    );
  }
}
