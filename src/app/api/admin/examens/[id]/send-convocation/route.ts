import { NextRequest, NextResponse } from 'next/server';
import { getExamenById } from '@/lib/data/examens';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildConvocationEmail, resolveDiplomeLabel } from '@/lib/utils/email-templates';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examen = await getExamenById(Number(id));

    if (!examen) {
      return NextResponse.json({ error: 'Examen introuvable' }, { status: 404 });
    }

    if (!examen.pdfConvocation) {
      return NextResponse.json(
        { error: 'Aucune convocation générée pour cet examen' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error: storageError } = await supabase.storage
      .from('documents')
      .createSignedUrl(examen.pdfConvocation, 604800);

    if (storageError || !data?.signedUrl) {
      console.error('[Send Convocation] Signed URL error:', storageError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du lien signé' },
        { status: 500 }
      );
    }

    const diplomeLabel = await resolveDiplomeLabel(examen.diplome);

    const emailHtml = buildConvocationEmail(
      examen.prenom,
      examen.nom,
      diplomeLabel,
      examen.dateExamen,
      examen.heureExamen,
      examen.lieu,
      data.signedUrl,
    );

    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'convocation',
            timestamp: new Date().toISOString(),
            candidat: {
              email: examen.email,
              prenom: examen.prenom,
              nom: examen.nom,
            },
            document_url: data.signedUrl,
            email_subject: `MyStoryFormation - Votre convocation - ${diplomeLabel}`,
            email_html: emailHtml,
          }),
        });
      } catch (webhookError) {
        console.error('Make webhook error (non-blocking):', webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Convocation envoyée par email à ${examen.email}`,
    });
  } catch (error) {
    console.error('[Send Convocation Error]', error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la convocation" },
      { status: 500 }
    );
  }
}
