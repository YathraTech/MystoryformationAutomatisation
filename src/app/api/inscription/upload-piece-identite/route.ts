import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILES = 5;

// Upload différé des pièces d'identité pour une inscription FORMATION.
// Le front appelle cette route après création de l'inscription avec le
// `uploadToken` renvoyé (id du stagiaire encodé en base64), récupère une URL
// signée puis y dépose le fichier en PUT.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadToken, fileName, contentType } = body as {
      uploadToken: string;
      fileName: string;
      contentType: string;
    };

    if (!uploadToken || !fileName || !contentType) {
      return NextResponse.json(
        { error: 'uploadToken, fileName et contentType requis' },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP, PDF' },
        { status: 400 }
      );
    }

    const stagiaireId = parseInt(Buffer.from(uploadToken, 'base64').toString(), 10);
    if (isNaN(stagiaireId)) {
      return NextResponse.json({ error: 'Jeton invalide' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: stagiaire, error: fetchError } = await supabase
      .from('stagiaires_formation')
      .select('id, photo_piece_identite')
      .eq('id', stagiaireId)
      .single();

    if (fetchError || !stagiaire) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 });
    }

    const existingFiles: string[] = Array.isArray(stagiaire.photo_piece_identite)
      ? stagiaire.photo_piece_identite
      : [];

    if (existingFiles.length >= MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} fichiers autorisés` },
        { status: 400 }
      );
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `stagiaires/${stagiaireId}/pieces_identite/${Date.now()}_${sanitizedFileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error('[inscription upload-piece-identite] signed URL:', error);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'URL d'upload" },
        { status: 500 }
      );
    }

    // Enregistrer le chemin dans le tableau photo_piece_identite (TEXT[])
    const { error: updateError } = await supabase
      .from('stagiaires_formation')
      .update({ photo_piece_identite: [...existingFiles, storagePath] })
      .eq('id', stagiaireId);

    if (updateError) {
      console.error('[inscription upload-piece-identite] update:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
    });
  } catch (error) {
    console.error('[inscription upload-piece-identite]', error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
