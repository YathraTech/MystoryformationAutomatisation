import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const clientUrl = `${baseUrl}/examen/${examen.token}`;

    // TODO: Envoyer l'email au client
    // Pour l'instant, on retourne juste le lien pour le copier manuellement
    // Vous pouvez intégrer un service d'email comme Resend, SendGrid, etc.

    return NextResponse.json({
      success: true,
      clientUrl,
      email: examen.email,
      resetChoice,
      message: resetChoice
        ? 'Choix de diplôme réinitialisé. Le client peut maintenant choisir à nouveau.'
        : 'Lien généré avec succès.',
    });
  } catch (error) {
    console.error('[Resend Link Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi' },
      { status: 500 }
    );
  }
}
