import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabase = await createClient();

    // Commercial: uniquement son centre. Admin: tous les centres.
    const query = supabase.from('centre_notes').select('centre, content, updated_at');
    if (user.lieu) {
      query.eq('centre', user.lieu);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ notes: data || [] });
  } catch (error) {
    console.error('[Centre Notes GET Error]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { centre, content } = await request.json();

    if (!centre || typeof content !== 'string') {
      return NextResponse.json({ error: 'centre et content requis' }, { status: 400 });
    }

    // Commercial ne peut modifier que son propre centre
    if (user.lieu && user.lieu !== centre) {
      return NextResponse.json({ error: 'Non autorisé pour ce centre' }, { status: 403 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('centre_notes')
      .upsert({
        centre,
        content,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Centre Notes PATCH Error]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
