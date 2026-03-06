import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, prenom, nom')
      .in('role', ['commercial', 'admin'])
      .order('prenom');

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des agents' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Error in agents route:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
