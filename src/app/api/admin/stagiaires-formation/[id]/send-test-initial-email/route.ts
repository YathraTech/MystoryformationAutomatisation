import { NextRequest, NextResponse } from 'next/server';
import { getStagiaireFormationById } from '@/lib/data/stagiaires-formation';
import { buildTestInitialEmail } from '@/lib/utils/email-templates';

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
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;
    const token = Buffer.from(stagiaireId.toString()).toString('base64');
    const testUrl = `${origin}/test/${token}`;

    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook email non configuré (MAKE_ATTESTATION_WEBHOOK_URL)' },
        { status: 503 }
      );
    }

    const emailHtml = buildTestInitialEmail(
      stagiaire.prenom,
      stagiaire.nom,
      testUrl,
    );

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test_initial_formation',
        timestamp: new Date().toISOString(),
        candidat: {
          email: stagiaire.email,
          prenom: stagiaire.prenom,
          nom: stagiaire.nom,
        },
        email_subject: 'MYSTORYFormation - Tests initiaux de positionnement',
        email_html: emailHtml,
        test_url: testUrl,
      }),
    });

    if (!webhookRes.ok) {
      console.error('[send-test-initial-email] webhook failed:', webhookRes.status);
      return NextResponse.json(
        { error: 'Échec de l\'envoi du mail' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, testUrl });
  } catch (error) {
    console.error('[send-test-initial-email]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du mail' },
      { status: 500 }
    );
  }
}
