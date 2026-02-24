import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Récupérer les objectifs avec le nombre d'utilisations
    const { data: objectifs, error } = await supabase
      .from('exam_objectifs')
      .select('*')
      .order('ordre', { ascending: true });

    if (error) throw new Error(error.message);

    // Compter les utilisations de chaque objectif
    const { data: usages, error: usageError } = await supabase
      .from('examens')
      .select('motivation')
      .not('motivation', 'is', null);

    if (usageError) throw new Error(usageError.message);

    const usageMap = new Map<string, number>();
    for (const row of usages || []) {
      const code = row.motivation as string;
      usageMap.set(code, (usageMap.get(code) || 0) + 1);
    }

    const objectifsWithUsage = (objectifs || []).map((o: Record<string, unknown>) => ({
      id: o.id,
      code: o.code,
      label: o.label,
      ordre: o.ordre,
      visible: o.visible,
      usageCount: usageMap.get(o.code as string) || 0,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return NextResponse.json({ objectifs: objectifsWithUsage });
  } catch (error) {
    console.error('[Exam Objectifs GET]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des objectifs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, label, ordre, visible } = await request.json();

    if (!code || !label) {
      return NextResponse.json(
        { error: 'Code et label sont obligatoires' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_objectifs')
      .insert({
        code: code.toLowerCase().replace(/\s+/g, '_'),
        label,
        ordre: ordre || 0,
        visible: visible !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ce code existe déjà' },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ objectif: data });
  } catch (error) {
    console.error('[Exam Objectifs POST]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}
