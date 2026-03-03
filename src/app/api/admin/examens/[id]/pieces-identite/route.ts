import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examenId = parseInt(id, 10);
    const supabase = createAdminClient();

    const { data: examen, error: fetchError } = await supabase
      .from('examens')
      .select('piece_identite')
      .eq('id', examenId)
      .single();

    if (fetchError || !examen) {
      return NextResponse.json(
        { error: 'Examen non trouvé' },
        { status: 404 }
      );
    }

    const paths: string[] = examen.piece_identite
      ? JSON.parse(examen.piece_identite)
      : [];

    // Generate signed download URLs for each file
    const files = await Promise.all(
      paths.map(async (path: string) => {
        const { data } = await supabase.storage
          .from('documents')
          .createSignedUrl(path, 300);

        const name = path.split('/').pop() || path;
        // Remove timestamp prefix from display name
        const displayName = name.replace(/^\d+_/, '');

        return {
          path,
          url: data?.signedUrl || null,
          name: displayName,
        };
      })
    );

    return NextResponse.json({ files });
  } catch (error) {
    console.error('[Pieces Identite GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examenId = parseInt(id, 10);
    const body = await request.json();
    const { path } = body as { path: string };

    if (!path) {
      return NextResponse.json(
        { error: 'path requis' },
        { status: 400 }
      );
    }

    // Validate the path belongs to this examen
    if (!path.startsWith(`examens/${examenId}/pieces_identite/`)) {
      return NextResponse.json(
        { error: 'Chemin invalide' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Remove from Storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([path]);

    if (storageError) {
      console.error('[Storage Delete Error]', storageError);
    }

    // Update piece_identite in DB (remove the path from the JSON array)
    const { data: examen, error: fetchError } = await supabase
      .from('examens')
      .select('piece_identite')
      .eq('id', examenId)
      .single();

    if (fetchError || !examen) {
      return NextResponse.json(
        { error: 'Examen non trouvé' },
        { status: 404 }
      );
    }

    const paths: string[] = examen.piece_identite
      ? JSON.parse(examen.piece_identite)
      : [];

    const updatedPaths = paths.filter((p: string) => p !== path);

    const { error: updateError } = await supabase
      .from('examens')
      .update({
        piece_identite: updatedPaths.length > 0 ? JSON.stringify(updatedPaths) : null,
      })
      .eq('id', examenId);

    if (updateError) {
      console.error('[DB Update Error]', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Pieces Identite DELETE Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
