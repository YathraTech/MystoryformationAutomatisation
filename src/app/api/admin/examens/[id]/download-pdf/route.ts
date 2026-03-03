import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // validate route param exists

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'path requis' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      console.error('[Download PDF Error]', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du lien' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('[Download PDF Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement' },
      { status: 500 }
    );
  }
}
