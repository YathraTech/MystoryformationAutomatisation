import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'partenaire') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('examens')
      .select('id, nom, prenom, email, telephone, diplome, date_examen, heure_examen, lieu, resultat, type_examen, created_at')
      .eq('partenaire_id', user.id)
      .neq('statut', 'Archivee')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Partenaire Candidats Error]', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const candidats = (data || []).map((row) => ({
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      telephone: row.telephone,
      diplome: row.diplome,
      dateExamen: row.date_examen,
      heureExamen: row.heure_examen,
      lieu: row.lieu,
      resultat: row.resultat,
      typeExamen: row.type_examen,
      createdAt: row.created_at,
    }));

    return NextResponse.json(candidats);
  } catch (error) {
    console.error('[Partenaire Candidats Error]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
