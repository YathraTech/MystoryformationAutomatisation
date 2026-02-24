import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_objectifs')
      .select('code, label')
      .eq('visible', true)
      .order('ordre', { ascending: true });

    if (error) throw new Error(error.message);

    const objectifs = (data || []).map((o: { code: string; label: string }) => ({
      value: o.code,
      label: o.label,
    }));

    return NextResponse.json({ objectifs });
  } catch (error) {
    console.error('[Public Exam Objectifs]', error);
    return NextResponse.json({ objectifs: [] });
  }
}
