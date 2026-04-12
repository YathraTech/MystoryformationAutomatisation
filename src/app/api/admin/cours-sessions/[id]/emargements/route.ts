import { NextRequest, NextResponse } from 'next/server';
import {
  getEmargementsBySession,
  upsertEmargement,
  updateEmargement,
  recalculerHeuresEffectuees,
} from '@/lib/data/stagiaires-formation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const emargements = await getEmargementsBySession(sessionId);
    return NextResponse.json(emargements);
  } catch (error) {
    console.error('[GET emargements]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des émargements' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();

    // Bulk upsert des présences
    if (Array.isArray(body.presences)) {
      for (const p of body.presences) {
        await upsertEmargement(
          sessionId,
          p.stagiaireId,
          p.present,
          p.signatureElectronique
        );
        // Recalculer les heures effectuées
        await recalculerHeuresEffectuees(p.stagiaireId);
      }
      return NextResponse.json({ success: true });
    }

    // Single upsert
    if (body.stagiaireId !== undefined) {
      await upsertEmargement(
        sessionId,
        body.stagiaireId,
        body.present ?? false,
        body.signatureElectronique
      );
      await recalculerHeuresEffectuees(body.stagiaireId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
  } catch (error) {
    console.error('[POST emargements]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des émargements' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Consume params
    const body = await request.json();
    const { emargementId, ...fields } = body;

    if (!emargementId) {
      return NextResponse.json({ error: 'emargementId requis' }, { status: 400 });
    }

    const dbFields: Record<string, unknown> = {};
    if (fields.justificatifRecu !== undefined) dbFields.justificatif_recu = fields.justificatifRecu;
    if (fields.justificatifUpload !== undefined) dbFields.justificatif_upload = fields.justificatifUpload;
    if (fields.mailRelanceEnvoye !== undefined) dbFields.mail_relance_envoye = fields.mailRelanceEnvoye;
    if (fields.dateRelance !== undefined) dbFields.date_relance = fields.dateRelance;

    await updateEmargement(emargementId, dbFields);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH emargements]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
