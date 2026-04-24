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

    // Récupération du PDF emploi du temps (base64) envoyé par le front
    let emploiDuTempsBase64: string | null = null;
    try {
      const body = await request.json().catch(() => ({}));
      if (typeof body?.emploiDuTempsPdf === 'string' && body.emploiDuTempsPdf.length > 100) {
        emploiDuTempsBase64 = body.emploiDuTempsPdf;
      }
    } catch {
      // body vide ou invalide : on continue sans PDF
    }

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
    );

    const attachments: { filename: string; content: string; contentType: string; encoding: string }[] = [];
    if (emploiDuTempsBase64) {
      attachments.push({
        filename: `programme-formation-${(stagiaire.nom || 'stagiaire').replace(/\s+/g, '_')}.pdf`,
        content: emploiDuTempsBase64,
        contentType: 'application/pdf',
        encoding: 'base64',
      });
    }

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
        email_subject: 'MYSTORYFormation - Documents de votre formation',
        email_html: emailHtml,
        attachments,
        pdfs: {
          convention: stagiaire.pdfConvention,
          convocation: stagiaire.pdfConvocation,
          programme: stagiaire.pdfProgramme,
        },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[send-program-docs]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du mail' },
      { status: 500 },
    );
  }
}
