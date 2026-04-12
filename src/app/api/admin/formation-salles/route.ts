import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agence = searchParams.get('agence');

    const supabase = await createClient();
    let query = supabase.from('formation_salles').select('*').order('nom', { ascending: true });

    if (agence) query = query.eq('agence', agence);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ salles: data || [] });
  } catch (error) {
    console.error('[GET formation-salles]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('formation_salles')
      .insert({
        nom: body.nom,
        agence: body.agence,
        capacite: body.capacite || 15,
        equipements: body.equipements || [],
        actif: body.actif !== false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ salle: data }, { status: 201 });
  } catch (error) {
    console.error('[POST formation-salles]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const supabase = await createClient();
    const dbFields: Record<string, unknown> = {};

    if (fields.nom !== undefined) dbFields.nom = fields.nom;
    if (fields.agence !== undefined) dbFields.agence = fields.agence;
    if (fields.capacite !== undefined) dbFields.capacite = fields.capacite;
    if (fields.equipements !== undefined) dbFields.equipements = fields.equipements;
    if (fields.actif !== undefined) dbFields.actif = fields.actif;

    const { error } = await supabase.from('formation_salles').update(dbFields).eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH formation-salles]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from('formation_salles').delete().eq('id', parseInt(id));
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE formation-salles]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
