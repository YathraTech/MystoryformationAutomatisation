import { NextRequest, NextResponse } from 'next/server';
import { getExamenById } from '@/lib/data/examens';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildFicheEmail, resolveDiplomeLabel } from '@/lib/utils/email-templates';

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

    if (!examen.pdfFicheInscription) {
      return NextResponse.json(
        { error: "Aucune fiche d'inscription générée pour cet examen" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error: storageError } = await supabase.storage
      .from('documents')
      .createSignedUrl(examen.pdfFicheInscription, 604800);

    if (storageError || !data?.signedUrl) {
      console.error('[Send Fiche] Signed URL error:', storageError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du lien signé' },
        { status: 500 }
      );
    }

    const diplomeLabel = await resolveDiplomeLabel(examen.diplome);

    const emailHtml = buildFicheEmail(
      examen.prenom,
      examen.nom,
      diplomeLabel,
      examen.dateExamen,
      data.signedUrl,
    );

    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'fiche_inscription',
            timestamp: new Date().toISOString(),
            candidat: {
              email: examen.email,
              prenom: examen.prenom,
              nom: examen.nom,
            },
            document_url: data.signedUrl,
            email_subject: `MyStoryFormation - Votre fiche d'inscription - ${diplomeLabel}`,
            email_html: emailHtml,
          }),
        });
      } catch (webhookError) {
        console.error('Make webhook error (non-blocking):', webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fiche d'inscription envoyée par email à ${examen.email}`,
    });
  } catch (error) {
    console.error('[Send Fiche Error]', error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la fiche d'inscription" },
      { status: 500 }
    );
  }
}
