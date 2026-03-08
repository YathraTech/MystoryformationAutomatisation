import { NextRequest, NextResponse } from 'next/server';
import { buildRelanceEmail } from '@/lib/utils/email-templates';

export async function POST(request: NextRequest) {
  try {
    const { candidats } = await request.json() as {
      candidats: { email: string; prenom: string; nom: string; resultat: string }[];
    };

    if (!candidats || candidats.length === 0) {
      return NextResponse.json({ error: 'Aucun candidat sélectionné' }, { status: 400 });
    }

    // Dédupliquer par email
    const unique = new Map<string, typeof candidats[0]>();
    for (const c of candidats) {
      const key = c.email.toLowerCase();
      if (!unique.has(key)) unique.set(key, c);
    }
    const deduplicated = Array.from(unique.values());

    // Envoyer individuellement via Make webhook
    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    let sent = 0;

    if (webhookUrl) {
      for (const c of deduplicated) {
        try {
          const emailHtml = buildRelanceEmail(c.prenom, c.nom);

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'relance_partenaire',
              timestamp: new Date().toISOString(),
              candidat: {
                email: c.email,
                prenom: c.prenom,
                nom: c.nom,
              },
              email_subject: 'MyStoryFormation - PrepCivique.fr — Promotions et entraînements',
              email_html: emailHtml,
            }),
          });

          sent++;
        } catch (webhookError) {
          console.error(`[relance] Webhook error for ${c.email}:`, webhookError);
        }
      }
    } else {
      console.warn('[relance] MAKE_ATTESTATION_WEBHOOK_URL non configuré');
      sent = deduplicated.length;
    }

    return NextResponse.json({
      success: true,
      sent,
      message: `Relance envoyée à ${sent} candidat(s)`,
    });
  } catch (error) {
    console.error('Erreur relance:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la relance' },
      { status: 500 }
    );
  }
}
