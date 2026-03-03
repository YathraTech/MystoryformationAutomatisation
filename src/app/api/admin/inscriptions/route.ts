import { NextResponse } from 'next/server';
import { getAllInscriptions } from '@/lib/data/inscriptions';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getSessionUser();
    const isCommercial = user?.role === 'commercial';
    const userLieu = user?.lieu || null;

    let inscriptions = await getAllInscriptions();

    // Les commerciaux ne voient que les inscriptions de leur centre
    if (isCommercial && userLieu) {
      inscriptions = inscriptions.filter((ins) => ins.lieu === userLieu);
    }

    // Enrichir chaque inscription avec le commercial le plus récent
    const supabase = await createClient();

    // Récupérer le commercial_id le plus récent par client_id depuis les examens
    const clientIds = [...new Set(inscriptions.map((ins) => ins.clientId).filter(Boolean))] as number[];

    const commercialByClient = new Map<number, string>();
    if (clientIds.length > 0) {
      const { data: examens } = await supabase
        .from('examens')
        .select('client_id, commercial_id, created_at')
        .in('client_id', clientIds)
        .not('commercial_id', 'is', null)
        .order('created_at', { ascending: false });

      if (examens) {
        for (const ex of examens) {
          // On prend le premier (plus récent) par client_id
          if (ex.client_id && ex.commercial_id && !commercialByClient.has(ex.client_id)) {
            commercialByClient.set(ex.client_id, ex.commercial_id);
          }
        }
      }
    }

    // Résoudre les noms des commerciaux
    const commercialIds = [...new Set(commercialByClient.values())];
    const commercialNames = new Map<string, string>();
    if (commercialIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nom, prenom')
        .in('id', commercialIds);

      if (profiles) {
        for (const p of profiles) {
          commercialNames.set(p.id, `${p.prenom} ${p.nom}`);
        }
      }
    }

    // Enrichir les inscriptions
    const enriched = inscriptions.map((ins) => {
      const commercialId = ins.clientId ? commercialByClient.get(ins.clientId) || null : null;
      return {
        ...ins,
        commercialId,
        commercialNom: commercialId ? commercialNames.get(commercialId) || null : null,
      };
    });

    return NextResponse.json({ inscriptions: enriched });
  } catch (error) {
    console.error('Error fetching inscriptions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des inscriptions' },
      { status: 500 }
    );
  }
}
