import { NextRequest, NextResponse } from 'next/server';
import { autoArchiveOldExamens } from '@/lib/data/examens';

export async function GET(request: NextRequest) {
  // Vérifier le secret pour sécuriser le cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const archived = await autoArchiveOldExamens();
    return NextResponse.json({
      success: true,
      archived,
      message: `${archived} examen(s) archivé(s) automatiquement`,
    });
  } catch (error) {
    console.error('[Cron auto-archive]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'archivage automatique' },
      { status: 500 }
    );
  }
}
