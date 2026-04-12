import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agence = searchParams.get('agence');

    const supabase = await createClient();
    let query = supabase
      .from('formation_creneaux')
      .select('*')
      .order('ordre', { ascending: true })
      .order('jour', { ascending: true });

    if (agence) query = query.eq('agence', agence);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ creneaux: data || [] });
  } catch (error) {
    console.error('[GET formation-creneaux]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('formation_creneaux')
      .insert({
        label: body.label,
        jour: body.jour,
        heure_debut: body.heureDebut,
        heure_fin: body.heureFin,
        duree_heures: body.dureeHeures || 3,
        agence: body.agence,
        places_max: body.placesMax || 15,
        actif: body.actif !== false,
        ordre: body.ordre || 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ creneau: data }, { status: 201 });
  } catch (error) {
    console.error('[POST formation-creneaux]', error);
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

    if (fields.label !== undefined) dbFields.label = fields.label;
    if (fields.jour !== undefined) dbFields.jour = fields.jour;
    if (fields.heureDebut !== undefined) dbFields.heure_debut = fields.heureDebut;
    if (fields.heureFin !== undefined) dbFields.heure_fin = fields.heureFin;
    if (fields.dureeHeures !== undefined) dbFields.duree_heures = fields.dureeHeures;
    if (fields.agence !== undefined) dbFields.agence = fields.agence;
    if (fields.placesMax !== undefined) dbFields.places_max = fields.placesMax;
    if (fields.actif !== undefined) dbFields.actif = fields.actif;
    if (fields.ordre !== undefined) dbFields.ordre = fields.ordre;

    const { error } = await supabase.from('formation_creneaux').update(dbFields).eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH formation-creneaux]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from('formation_creneaux').delete().eq('id', parseInt(id));
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE formation-creneaux]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
