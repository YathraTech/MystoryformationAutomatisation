import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeCompetence = searchParams.get('type'); // CE ou CO
    const niveau = searchParams.get('niveau');

    const supabase = await createClient();
    let query = supabase
      .from('qcm_questions')
      .select('*')
      .order('ordre', { ascending: true });

    if (typeCompetence) query = query.eq('type_competence', typeCompetence);
    if (niveau) query = query.eq('niveau', niveau);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[GET qcm-questions]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('qcm_questions')
      .insert({
        type_competence: body.typeCompetence,
        niveau: body.niveau,
        question: body.question,
        choix: body.choix,
        reponse_correcte: body.reponseCorrecte,
        media_url: body.mediaUrl || null,
        points: body.points || 1,
        actif: body.actif !== false,
        ordre: body.ordre || 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[POST qcm-questions]', error);
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
    if (fields.niveau !== undefined) dbFields.niveau = fields.niveau;
    if (fields.question !== undefined) dbFields.question = fields.question;
    if (fields.choix !== undefined) dbFields.choix = fields.choix;
    if (fields.reponseCorrecte !== undefined) dbFields.reponse_correcte = fields.reponseCorrecte;
    if (fields.mediaUrl !== undefined) dbFields.media_url = fields.mediaUrl;
    if (fields.points !== undefined) dbFields.points = fields.points;
    if (fields.actif !== undefined) dbFields.actif = fields.actif;
    if (fields.ordre !== undefined) dbFields.ordre = fields.ordre;

    const { error } = await supabase
      .from('qcm_questions')
      .update(dbFields)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH qcm-questions]', error);
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
    const { error } = await supabase
      .from('qcm_questions')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE qcm-questions]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
