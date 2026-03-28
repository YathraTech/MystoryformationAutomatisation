import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'admin' && user.role !== 'commercial')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const supabase = await createClient();

    // Récupérer tous les partenaires
    const { data: partenaires, error: pErr } = await supabase
      .from('profiles')
      .select('id, email, nom, prenom, organisation, lieu, created_at')
      .eq('role', 'partenaire')
      .order('created_at', { ascending: false });

    if (pErr) throw new Error(pErr.message);

    // Récupérer tous les examens liés à des partenaires
    const { data: examens, error: eErr } = await supabase
      .from('examens')
      .select('id, partenaire_id, prix, resultat, created_at, statut')
      .not('partenaire_id', 'is', null)
      .neq('statut', 'Archivee');

    if (eErr) throw new Error(eErr.message);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Calculer les stats par partenaire
    const result = (partenaires || []).map((p) => {
      const pExamens = (examens || []).filter((e) => e.partenaire_id === p.id);

      // CA et ventes du mois en cours
      let caMois = 0;
      let ventesMois = 0;
      let caTotal = 0;

      for (const ex of pExamens) {
        if (ex.prix && ex.prix > 0) {
          caTotal += ex.prix;
          const d = new Date(ex.created_at);
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
            caMois += ex.prix;
            ventesMois++;
          }
        }
      }

      const reussi = pExamens.filter((e) => e.resultat === 'reussi').length;
      const echoue = pExamens.filter((e) => e.resultat === 'echoue').length;
      const absent = pExamens.filter((e) => e.resultat === 'absent').length;
      const aVenir = pExamens.filter((e) => e.resultat === 'a_venir').length;

      return {
        id: p.id,
        email: p.email,
        nom: p.nom,
        prenom: p.prenom,
        organisation: p.organisation,
        lieu: p.lieu,
        createdAt: p.created_at,
        totalCandidats: pExamens.length,
        caMois,
        ventesMois,
        caTotal,
        reussi,
        echoue,
        absent,
        aVenir,
      };
    });

    return NextResponse.json({ partenaires: result });
  } catch (error) {
    console.error('[Partenaires GET Error]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
