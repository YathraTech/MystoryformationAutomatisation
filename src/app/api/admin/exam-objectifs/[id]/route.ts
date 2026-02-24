import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const objectifId = parseInt(id, 10);
    const body = await request.json();

    const supabase = await createClient();

    const updateFields: Record<string, unknown> = {};
    if (body.label !== undefined) updateFields.label = body.label;
    if (body.ordre !== undefined) updateFields.ordre = body.ordre;
    if (body.visible !== undefined) updateFields.visible = body.visible;
    if (body.code !== undefined) updateFields.code = body.code.toLowerCase().replace(/\s+/g, '_');
    updateFields.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('exam_objectifs')
      .update(updateFields)
      .eq('id', objectifId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Exam Objectifs PATCH]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const objectifId = parseInt(id, 10);

    const supabase = await createClient();

    // Récupérer le code de l'objectif
    const { data: objectif, error: fetchError } = await supabase
      .from('exam_objectifs')
      .select('code')
      .eq('id', objectifId)
      .single();

    if (fetchError || !objectif) {
      return NextResponse.json(
        { error: 'Objectif non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'objectif est utilisé par des examens
    const { count, error: countError } = await supabase
      .from('examens')
      .select('id', { count: 'exact', head: true })
      .eq('motivation', objectif.code);

    if (countError) throw new Error(countError.message);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer : cet objectif est utilisé par ${count} examen(s)` },
        { status: 409 }
      );
    }

    // Supprimer
    const { error } = await supabase
      .from('exam_objectifs')
      .delete()
      .eq('id', objectifId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Exam Objectifs DELETE]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
