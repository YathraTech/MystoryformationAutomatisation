import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILES = 5;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { fileName, contentType } = body as { fileName: string; contentType: string };

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName et contentType requis' },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP, PDF' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find the examen by token
    const { data: examen, error: fetchError } = await supabase
      .from('examens')
      .select('id, piece_identite')
      .eq('token', token)
      .single();

    if (fetchError || !examen) {
      return NextResponse.json(
        { error: 'Examen non trouvé' },
        { status: 404 }
      );
    }

    // Parse existing files
    const existingFiles: string[] = examen.piece_identite
      ? JSON.parse(examen.piece_identite)
      : [];

    if (existingFiles.length >= MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} fichiers autorisés` },
        { status: 400 }
      );
    }

    // Generate storage path
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `examens/${examen.id}/pieces_identite/${Date.now()}_${sanitizedFileName}`;

    // Create signed upload URL
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error('[Signed Upload URL Error]', error);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'URL d'upload" },
        { status: 500 }
      );
    }

    // Add the path to the JSON array in DB
    const updatedFiles = [...existingFiles, storagePath];
    const { error: updateError } = await supabase
      .from('examens')
      .update({ piece_identite: JSON.stringify(updatedFiles) })
      .eq('id', examen.id);

    if (updateError) {
      console.error('[DB Update Error]', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour en base' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
    });
  } catch (error) {
    console.error('[Upload Piece Identite Error]', error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
