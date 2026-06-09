import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Sujets partagés des QCM : un texte (CE) ou un audio (CO) commun à plusieurs questions.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeCompetence = searchParams.get('type'); // CE ou CO
    const niveau = searchParams.get('niveau');
    const typeTest = searchParams.get('typeTest'); // initial ou final

    const supabase = await createClient();
    let query = supabase
      .from('qcm_sujets')
      .select('*')
      .order('ordre', { ascending: true });

    if (typeCompetence) query = query.eq('type_competence', typeCompetence);
    if (niveau) query = query.eq('niveau', niveau);
    if (typeTest) query = query.eq('type_test', typeTest);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[GET qcm-sujets]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('qcm_sujets')
      .insert({
        type_competence: body.typeCompetence,
        type_test: body.typeTest || 'initial',
        niveau: body.niveau || null,
        titre: body.titre,
        contenu: body.contenu || null,
        media_url: body.mediaUrl || null,
        actif: body.actif !== false,
        ordre: body.ordre || 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[POST qcm-sujets]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const supabase = await createClient();
    const dbFields: Record<string, unknown> = {};

    if (fields.typeCompetence !== undefined) dbFields.type_competence = fields.typeCompetence;
    if (fields.typeTest !== undefined) dbFields.type_test = fields.typeTest;
    if (fields.niveau !== undefined) dbFields.niveau = fields.niveau;
    if (fields.titre !== undefined) dbFields.titre = fields.titre;
    if (fields.contenu !== undefined) dbFields.contenu = fields.contenu;
    if (fields.mediaUrl !== undefined) dbFields.media_url = fields.mediaUrl;
    if (fields.actif !== undefined) dbFields.actif = fields.actif;
    if (fields.ordre !== undefined) dbFields.ordre = fields.ordre;

    const { error } = await supabase
      .from('qcm_sujets')
      .update(dbFields)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH qcm-sujets]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const supabase = await createClient();
    // Les questions rattachées ne sont pas supprimées : la FK est ON DELETE SET NULL,
    // elles redeviennent simplement autonomes.
    const { error } = await supabase
      .from('qcm_sujets')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE qcm-sujets]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
