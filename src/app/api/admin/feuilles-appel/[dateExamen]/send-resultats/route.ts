import { NextRequest, NextResponse } from 'next/server';
import { getExamensByDate, markResultatEmailSent, updateExamenFields } from '@/lib/data/examens';
import { getSessionUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAttestationReussite } from '@/lib/utils/pdf-generator';
import {
  resolveDiplomeLabel,
  buildResultatReussiEmail,
  buildResultatAbsentEmail,
  buildResultatEchoueEmail,
} from '@/lib/utils/email-templates';
import type { Examen } from '@/lib/data/examens';

async function generateAndUploadAttestation(
  examen: Examen,
  diplomeLabel: string,
): Promise<string | null> {
  try {
    const { blob, fileName } = await generateAttestationReussite(examen, diplomeLabel);

    const supabase = createAdminClient();
    const timestamp = Date.now();
    const storagePath = `examens/${examen.id}/attestation_reussite_${timestamp}_${fileName}`;

    const arrayBuffer = await blob.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error(`[send-resultats] Upload error for examen ${examen.id}:`, uploadError);
      return null;
    }

    // Save path in DB
    await updateExamenFields(examen.id, { pdfAttestationReussite: storagePath });

    // Generate signed URL (7 days)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 604800);

    if (signedError || !signedData?.signedUrl) {
      console.error(`[send-resultats] Signed URL error for examen ${examen.id}:`, signedError);
      return null;
    }

    return signedData.signedUrl;
  } catch (err) {
    console.error(`[send-resultats] PDF generation error for examen ${examen.id}:`, err);
    return null;
  }
}

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

    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    let emailsSent = 0;

    if (webhookUrl) {
      for (const candidat of toSend) {
        try {
          const diplomeLabel = await resolveDiplomeLabel(candidat.diplome);
          let emailHtml: string;
          let emailSubject: string;
          let documentUrl: string | undefined;

          if (candidat.resultat === 'reussi') {
            const signedUrl = await generateAndUploadAttestation(candidat, diplomeLabel);
            emailHtml = buildResultatReussiEmail(
              candidat.prenom,
              candidat.nom,
              diplomeLabel,
              candidat.dateExamen,
              signedUrl || '',
            );
            emailSubject = `MYSTORYFormation - Félicitations, vous avez réussi votre examen ! - ${diplomeLabel}`;
            documentUrl = signedUrl || undefined;
          } else if (candidat.resultat === 'absent') {
            emailHtml = buildResultatAbsentEmail(
              candidat.prenom,
              candidat.nom,
              diplomeLabel,
              candidat.dateExamen,
            );
            emailSubject = `MYSTORYFormation - Absence constatée à votre examen - ${diplomeLabel}`;
          } else {
            // echoue
            emailHtml = buildResultatEchoueEmail(
              candidat.prenom,
              candidat.nom,
              diplomeLabel,
              candidat.dateExamen,
            );
            emailSubject = `MYSTORYFormation - Résultat de votre examen - ${diplomeLabel}`;
          }

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'resultat_examen',
              resultat: candidat.resultat,
              timestamp: new Date().toISOString(),
              candidat: {
                email: candidat.email,
                prenom: candidat.prenom,
                nom: candidat.nom,
              },
              document_url: documentUrl,
              email_subject: emailSubject,
              email_html: emailHtml,
            }),
          });

          emailsSent++;
        } catch (webhookError) {
          console.error(`[send-resultats] Webhook error for examen ${candidat.id}:`, webhookError);
        }
      }
    } else {
      console.warn('[send-resultats] MAKE_ATTESTATION_WEBHOOK_URL non configuré');
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
