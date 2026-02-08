import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const diplomeSchema = z.object({
  diplome: z.enum([
    'A1', 'A2', 'B1', 'B2',
    'carte_pluriannuelle', 'carte_residence', 'naturalisation'
  ]),
});

// GET - Récupérer les infos de l'examen par token (accessible sans auth)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: examen, error } = await supabase
      .from('examens')
      .select('id, civilite, nom, prenom, diplome')
      .eq('token', token)
      .single();

    if (error || !examen) {
      return NextResponse.json(
        { error: 'Examen non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(examen);
  } catch (err) {
    console.error('Error fetching examen:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour le diplôme choisi (accessible sans auth)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const result = diplomeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Diplôme invalide' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Vérifier que l'examen existe et n'a pas déjà un diplôme choisi
    const { data: existing, error: fetchError } = await supabase
      .from('examens')
      .select('id, diplome')
      .eq('token', token)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Examen non trouvé' },
        { status: 404 }
      );
    }

    if (existing.diplome) {
      return NextResponse.json(
        { error: 'Le diplôme a déjà été choisi' },
        { status: 400 }
      );
    }

    // Mettre à jour le diplôme
    const { error: updateError } = await supabase
      .from('examens')
      .update({
        diplome: result.data.diplome,
        diplome_choisi_at: new Date().toISOString(),
        statut: 'Diplome choisi',
      })
      .eq('token', token);

    if (updateError) {
      console.error('Error updating examen:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating examen:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
