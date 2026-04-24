import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================
// Redirige vers le PDF programme du stagiaire
// ============================================================
// L'URL est du type /api/public/programme/<token>
// Le token = base64(stagiaire_id).
// L'endpoint regénère à chaque visite une URL signée Supabase courte
// durée (1h) et redirige dessus — le PDF s'ouvre dans le navigateur.
// ============================================================

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    let stagiaireId: number;
    try {
      stagiaireId = parseInt(Buffer.from(token, 'base64').toString('utf-8'));
    } catch {
      return new NextResponse('Lien invalide', { status: 400 });
    }
    if (isNaN(stagiaireId)) {
      return new NextResponse('Lien invalide', { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: stagiaire, error } = await supabase
      .from('stagiaires_formation')
      .select('id, pdf_programme')
      .eq('id', stagiaireId)
      .single();

    if (error || !stagiaire) {
      return new NextResponse('Programme introuvable', { status: 404 });
    }

    if (!stagiaire.pdf_programme) {
      return new NextResponse(
        'Le programme n\'est pas encore disponible. Merci de contacter votre conseiller.',
        { status: 404 },
      );
    }

    const { data: signed, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(stagiaire.pdf_programme, 60 * 60); // 1h

    if (signError || !signed?.signedUrl) {
      return new NextResponse('Impossible de générer le lien du programme', { status: 500 });
    }

    // 302 → navigateur ouvre le PDF inline
    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (error) {
    console.error('[public/programme]', error);
    return new NextResponse('Erreur serveur', { status: 500 });
  }
}
