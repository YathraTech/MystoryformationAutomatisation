import { NextResponse } from 'next/server';
import { autoDeleteStaleExamens, autoArchiveOldExamens } from '@/lib/data/examens';

/**
 * Route de nettoyage automatique.
 * Appelée au chargement du dashboard admin.
 *
 * Actions :
 * 1. Supprime les examens sans diplôme choisi créés il y a plus de 2 jours (anti-spam)
 * 2. Archive les examens réussis dont la date est passée depuis plus de 3 mois
 */
export async function POST() {
  try {
    const [deleted, archived] = await Promise.all([
      autoDeleteStaleExamens(),
      autoArchiveOldExamens(),
    ]);

    return NextResponse.json({
      success: true,
      deleted,
      archived,
    });
  } catch (error) {
    console.error('[POST cleanup]', error);
    return NextResponse.json({ error: 'Erreur cleanup' }, { status: 500 });
  }
}
