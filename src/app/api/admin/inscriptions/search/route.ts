import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = await createClient();
    const queryLower = query.toLowerCase();

    // Search by ID if query is a number
    const isNumeric = /^\d+$/.test(query);

    let results;
    if (isNumeric) {
      const { data } = await supabase
        .from('inscriptions')
        .select('id, nom, prenom, email, telephone, session_id, formation_id, formation_nom')
        .eq('id', parseInt(query))
        .neq('statut', 'Archivee')
        .limit(10);
      results = data || [];
    } else {
      const { data } = await supabase
        .from('inscriptions')
        .select('id, nom, prenom, email, telephone, session_id, formation_id, formation_nom')
        .neq('statut', 'Archivee')
        .or(`nom.ilike.%${queryLower}%,prenom.ilike.%${queryLower}%,email.ilike.%${queryLower}%,telephone.ilike.%${queryLower}%`)
        .limit(10);
      results = data || [];
    }

    const formatted = results.map((r) => ({
      id: r.id,
      nom: r.nom,
      prenom: r.prenom,
      email: r.email,
      telephone: r.telephone,
      hasSession: !!r.session_id,
      currentSessionId: r.session_id || null,
      currentFormationId: r.formation_id || null,
      currentFormationNom: r.formation_nom || null,
    }));

    return NextResponse.json({ results: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
