import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('formation_types')
      .select('*')
      .order('ordre', { ascending: true });

    if (error) throw new Error(error.message);
    return NextResponse.json({ types: data || [] });
  } catch (error) {
    console.error('[GET formation-types]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('formation_types')
      .insert({
        code: body.code,
        label: body.label,
        description: body.description || null,
        niveau_cible: body.niveauCible || null,
        duree_heures_min: body.dureeHeuresMin || null,
        duree_heures_max: body.dureeHeuresMax || null,
        prix_horaire: body.prixHoraire || null,
        prix_forfait: body.prixForfait || null,
        eligible_cpf: body.eligibleCpf !== false,
        visible: body.visible !== false,
        ordre: body.ordre || 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ type: data }, { status: 201 });
  } catch (error) {
    console.error('[POST formation-types]', error);
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

    if (fields.code !== undefined) dbFields.code = fields.code;
    if (fields.label !== undefined) dbFields.label = fields.label;
    if (fields.description !== undefined) dbFields.description = fields.description;
    if (fields.niveauCible !== undefined) dbFields.niveau_cible = fields.niveauCible;
    if (fields.dureeHeuresMin !== undefined) dbFields.duree_heures_min = fields.dureeHeuresMin;
    if (fields.dureeHeuresMax !== undefined) dbFields.duree_heures_max = fields.dureeHeuresMax;
    if (fields.prixHoraire !== undefined) dbFields.prix_horaire = fields.prixHoraire;
    if (fields.prixForfait !== undefined) dbFields.prix_forfait = fields.prixForfait;
    if (fields.eligibleCpf !== undefined) dbFields.eligible_cpf = fields.eligibleCpf;
    if (fields.visible !== undefined) dbFields.visible = fields.visible;
    if (fields.ordre !== undefined) dbFields.ordre = fields.ordre;

    const { error } = await supabase.from('formation_types').update(dbFields).eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH formation-types]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from('formation_types').delete().eq('id', parseInt(id));
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE formation-types]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
