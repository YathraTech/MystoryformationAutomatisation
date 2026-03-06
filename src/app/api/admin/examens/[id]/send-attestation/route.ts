import { NextRequest, NextResponse } from 'next/server';
import { getExamenById } from '@/lib/data/examens';
import { createAdminClient } from '@/lib/supabase/admin';

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatPrix(prix: number | null): string {
  if (prix === null || prix === undefined) return '-';
  return `${prix.toFixed(2)} €`;
}

function buildEmailHtml(
  prenom: string,
  nom: string,
  typeExamen: string | null,
  dateExamen: string | null,
  prix: number | null,
  attestationUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attestation de paiement</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1e1e1e;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">MyStoryFormation</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#a1a1aa;">Centre de formation et d'examens</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
                Veuillez trouver ci-dessous votre attestation de paiement concernant votre inscription à l'examen.
              </p>

              <!-- Récapitulatif -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;width:140px;">Type d'examen</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e1e1e;">${typeExamen || '-'}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;border-top:1px solid #e4e4e7;width:140px;">Date d'examen</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e1e1e;border-top:1px solid #e4e4e7;">${formatDate(dateExamen)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;border-top:1px solid #e4e4e7;width:140px;">Montant payé</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e1e1e;border-top:1px solid #e4e4e7;">${formatPrix(prix)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${attestationUrl}" target="_blank" style="display:inline-block;background-color:#1e1e1e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                      Télécharger l'attestation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
                Ce lien est valide pendant 7 jours.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:12px 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;">MyStoryFormation</p>
              <p style="margin:0;font-size:11px;color:#d4d4d8;">contact@mystoryformation.fr</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

    if (!examen.pdfAttestationPaiement) {
      return NextResponse.json(
        { error: 'Aucune attestation de paiement générée pour cet examen' },
        { status: 400 }
      );
    }

    // Lien signé longue durée (7 jours)
    const supabase = createAdminClient();
    const { data, error: storageError } = await supabase.storage
      .from('documents')
      .createSignedUrl(examen.pdfAttestationPaiement, 604800);

    if (storageError || !data?.signedUrl) {
      console.error('[Send Attestation] Signed URL error:', storageError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du lien signé' },
        { status: 500 }
      );
    }

    const emailHtml = buildEmailHtml(
      examen.prenom,
      examen.nom,
      examen.typeExamen,
      examen.dateExamen,
      examen.prix,
      data.signedUrl,
    );

    // Envoi via Make webhook (non-blocking)
    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'attestation_paiement',
            timestamp: new Date().toISOString(),
            candidat: {
              email: examen.email,
              prenom: examen.prenom,
              nom: examen.nom,
            },
            attestation_url: data.signedUrl,
            email_subject: `Votre attestation de paiement - ${examen.typeExamen || 'Examen'}`,
            email_html: emailHtml,
            examen: {
              dateExamen: examen.dateExamen,
              typeExamen: examen.typeExamen,
              prix: examen.prix,
            },
          }),
        });
      } catch (webhookError) {
        console.error('Make webhook error (non-blocking):', webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Attestation envoyée par email à ${examen.email}`,
    });
  } catch (error) {
    console.error('[Send Attestation Error]', error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'attestation" },
      { status: 500 }
    );
  }
}
