import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildLienExamenEmail } from '@/lib/utils/email-templates';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const resetChoice = body.resetChoice === true;

    const supabase = await createClient();

    // Récupérer l'examen
    const { data: examen, error } = await supabase
      .from('examens')
      .select('*')
      .eq('id', parseInt(id, 10))
      .single();

    if (error || !examen) {
      return NextResponse.json(
        { error: 'Examen non trouvé' },
        { status: 404 }
      );
    }

    // Si demandé, réinitialiser le choix de diplôme
    if (resetChoice) {
      await supabase
        .from('examens')
        .update({
          diplome: null,
          diplome_choisi_at: null,
        })
        .eq('id', parseInt(id, 10));
    }

    // Générer l'URL du lien client
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const clientUrl = `${baseUrl}/examen/${examen.token}`;

    // Envoyer le lien au candidat par email (via webhook Make), si configuré et email présent
    let emailSent = false;
    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (webhookUrl && examen.email) {
      try {
        const emailHtml = buildLienExamenEmail(
          examen.prenom || '',
          examen.nom || '',
          clientUrl,
          resetChoice,
        );
        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'lien_examen',
            timestamp: new Date().toISOString(),
            candidat: {
              email: examen.email,
              prenom: examen.prenom || '',
              nom: examen.nom || '',
            },
            email_subject: "MYSTORYFormation - Votre lien d'inscription à l'examen",
            email_html: emailHtml,
            examen_url: clientUrl,
          }),
        });
        emailSent = webhookRes.ok;
        if (!webhookRes.ok) {
          console.error('[resend-link] webhook failed:', webhookRes.status);
        }
      } catch (e) {
        console.error('[resend-link] envoi email échoué:', e);
      }
    }

    const baseMessage = resetChoice
      ? 'Choix de diplôme réinitialisé.'
      : 'Lien généré.';
    return NextResponse.json({
      success: true,
      clientUrl,
      email: examen.email,
      resetChoice,
      emailSent,
      message: emailSent
        ? `${baseMessage} Le lien a été envoyé par email au candidat.`
        : `${baseMessage} Email non envoyé (copiez le lien ci-dessous pour le transmettre).`,
    });
  } catch (error) {
    console.error('[Resend Link Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi' },
      { status: 500 }
    );
  }
}
