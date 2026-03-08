import { NextRequest, NextResponse } from 'next/server';
import { getExamensPendingResultEmail, markResultatEmailSent, updateExamenResultat, updateExamenFields, getAllExamens } from '@/lib/data/examens';
import { isDeadlinePassed } from '@/lib/utils/feuille-deadline';
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
      console.error(`[cron send-resultats] Upload error for examen ${examen.id}:`, uploadError);
      return null;
    }

    await updateExamenFields(examen.id, { pdfAttestationReussite: storagePath });

    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 604800);

    if (signedError || !signedData?.signedUrl) {
      console.error(`[cron send-resultats] Signed URL error for examen ${examen.id}:`, signedError);
      return null;
    }

    return signedData.signedUrl;
  } catch (err) {
    console.error(`[cron send-resultats] PDF generation error for examen ${examen.id}:`, err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // 1. Auto-absent : marquer les examens non renseignés dont la deadline est passée
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

    // 2. Fetch pending : examens avec résultat rempli mais email non envoyé
    const pending = await getExamensPendingResultEmail();

    // 3. Filtrer : ne garder que ceux dont la deadline est passée
    const ready = pending.filter((ex) => ex.dateExamen && isDeadlinePassed(ex.dateExamen, ex.heureExamen));

    if (ready.length === 0) {
      return NextResponse.json({
        success: true,
        autoAbsent: autoAbsentCount,
        emailsSent: 0,
        message: `${autoAbsentCount} auto-absent(s). Aucun email à envoyer.`,
      });
    }

    // 4. Envoyer individuellement via le webhook
    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    let emailsSent = 0;

    if (webhookUrl) {
      for (const candidat of ready) {
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
            emailSubject = `MyStoryFormation - Félicitations, vous avez réussi votre examen ! - ${diplomeLabel}`;
            documentUrl = signedUrl || undefined;
          } else if (candidat.resultat === 'absent') {
            emailHtml = buildResultatAbsentEmail(
              candidat.prenom,
              candidat.nom,
              diplomeLabel,
              candidat.dateExamen,
            );
            emailSubject = `MyStoryFormation - Absence constatée à votre examen - ${diplomeLabel}`;
          } else {
            emailHtml = buildResultatEchoueEmail(
              candidat.prenom,
              candidat.nom,
              diplomeLabel,
              candidat.dateExamen,
            );
            emailSubject = `MyStoryFormation - Résultat de votre examen - ${diplomeLabel}`;
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
          console.error(`[cron send-resultats] Webhook error for examen ${candidat.id}:`, webhookError);
        }
      }
    } else {
      console.warn('[cron send-resultats] MAKE_ATTESTATION_WEBHOOK_URL non configuré');
      emailsSent = ready.length;
    }

    // 5. Marquer comme envoyé
    const ids = ready.map((ex) => ex.id);
    await markResultatEmailSent(ids);

    return NextResponse.json({
      success: true,
      autoAbsent: autoAbsentCount,
      emailsSent,
      message: `${autoAbsentCount} auto-absent(s). ${emailsSent} email(s) de résultat envoyé(s).`,
    });
  } catch (error) {
    console.error('[Cron send-resultats]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des résultats' },
      { status: 500 }
    );
  }
}
