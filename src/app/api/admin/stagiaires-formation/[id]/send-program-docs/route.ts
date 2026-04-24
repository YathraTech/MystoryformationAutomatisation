import { NextRequest, NextResponse } from 'next/server';
import {
  getStagiaireFormationById,
  updateStagiaireFormation,
} from '@/lib/data/stagiaires-formation';
import { buildProgramFormationEmail } from '@/lib/utils/email-templates';

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

    const stagiaire = await getStagiaireFormationById(stagiaireId);
    if (!stagiaire) {
      return NextResponse.json({ error: 'Stagiaire non trouvé' }, { status: 404 });
    }

    if (!stagiaire.email) {
      return NextResponse.json(
        { error: 'Email du stagiaire manquant' },
        { status: 400 },
      );
    }

    // Récupération du chemin Storage du PDF uploadé par le front
    // et enregistrement dans stagiaire.pdf_programme.
    let pdfProgrammePath: string | null = null;
    let receivedPath = false;
    try {
      const body = await request.json().catch(() => ({}));
      if (typeof body?.emploiDuTempsPath === 'string' && body.emploiDuTempsPath.length > 0) {
        pdfProgrammePath = body.emploiDuTempsPath;
        receivedPath = true;
        await updateStagiaireFormation(stagiaireId, { pdf_programme: pdfProgrammePath });
      }
    } catch {
      // body vide ou path invalide : on continue
    }

    // URL publique stable sur notre domaine. On la met TOUJOURS dans le mail —
    // l'endpoint /api/public/programme/<token> affiche un message clair si le
    // PDF n'est pas encore disponible, plutôt qu'un mail sans aucun lien.
    const origin = request.nextUrl.origin;
    const token = Buffer.from(stagiaireId.toString()).toString('base64');
    const programmeUrl = `${origin}/api/public/programme/${token}`;

    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook email non configuré (MAKE_ATTESTATION_WEBHOOK_URL)' },
        { status: 503 },
      );
    }

    const emailHtml = buildProgramFormationEmail(
      stagiaire.prenom,
      stagiaire.nom,
      stagiaire.formatriceNom,
      stagiaire.dateDebutFormation,
      stagiaire.heuresPrevues,
      stagiaire.joursFormation,
      stagiaire.horairesFormation,
      stagiaire.agence,
      programmeUrl,
    );

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'programme_formation',
        timestamp: new Date().toISOString(),
        candidat: {
          email: stagiaire.email,
          prenom: stagiaire.prenom,
          nom: stagiaire.nom,
        },
        email_subject: 'MYSTORYFormation - Votre formation est confirmée',
        email_html: emailHtml,
        programme_url: programmeUrl,
      }),
    });

    if (!webhookRes.ok) {
      console.error('[send-program-docs] webhook failed:', webhookRes.status);
      return NextResponse.json(
        { error: 'Échec de l\'envoi du mail' },
        { status: 502 },
      );
    }

    // Marquer le mail comme envoyé
    await updateStagiaireFormation(stagiaireId, {
      mail_inscription_envoye: true,
    });

    return NextResponse.json({
      success: true,
      programmeUrl,
      pdfReady: receivedPath,
    });
  } catch (error) {
    console.error('[send-program-docs]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du mail' },
      { status: 500 },
    );
  }
}
