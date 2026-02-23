import { NextRequest, NextResponse } from 'next/server';

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

    const now = new Date().toISOString();

    // Envoyer via Make webhook si configuré
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'relance_partenaire',
            timestamp: now,
            total: deduplicated.length,
            candidats: deduplicated.map((c) => ({
              email: c.email,
              prenom: c.prenom,
              nom: c.nom,
              resultat: c.resultat,
            })),
            message: 'Bonjour {prenom}, suite à votre examen, nous vous proposons de rejoindre notre plateforme partenaire PrepCivique pour bénéficier de promotions et d\'entraînements de qualité. Rendez-vous sur https://prepcivique.fr',
          }),
        });
      } catch (webhookError) {
        console.error('Make webhook error (non-blocking):', webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      sent: deduplicated.length,
      message: `Relance envoyée à ${deduplicated.length} candidat(s)`,
    });
  } catch (error) {
    console.error('Erreur relance:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la relance' },
      { status: 500 }
    );
  }
}
