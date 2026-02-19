import { createClient } from '@/lib/supabase/server';

// --- Helpers ---

function toMonthStart(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getNextMonth(mois: string): string {
  const [y, m] = mois.split('-').map(Number);
  const nextDate = new Date(y, m, 1); // m is 1-indexed from split, so new Date(y, m, 1) gives next month
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Recalcule le CA mensuel pour un commercial donné et un mois donné.
 * Somme tous les examens.prix attribués à ce commercial pour ce mois,
 * puis upsert dans ca_mensuel.
 */
export async function recalculateCaMensuel(
  commercialId: string,
  mois: string // format: 'YYYY-MM-01'
): Promise<void> {
  const supabase = await createClient();

  const monthStart = mois;
  const nextMonth = getNextMonth(mois);

  const { data, error } = await supabase
    .from('examens')
    .select('prix')
    .eq('commercial_id', commercialId)
    .gte('created_at', monthStart)
    .lt('created_at', nextMonth)
    .not('prix', 'is', null);

  if (error) {
    console.error('CA recalculation query error:', error);
    return;
  }

  const montant = (data || []).reduce((sum, row) => {
    const prix = typeof row.prix === 'number' ? row.prix : 0;
    return prix > 0 ? sum + prix : sum;
  }, 0);

  if (montant > 0) {
    const { error: upsertError } = await supabase
      .from('ca_mensuel')
      .upsert(
        { commercial_id: commercialId, mois, montant },
        { onConflict: 'commercial_id,mois' }
      );
    if (upsertError) {
      console.error('CA upsert error:', upsertError);
    }
  } else {
    // Montant à 0 → supprimer la ligne (pas besoin de stocker des zéros)
    await supabase
      .from('ca_mensuel')
      .delete()
      .eq('commercial_id', commercialId)
      .eq('mois', mois);
  }
}

/**
 * Après une modification d'examen, recalcule le CA pour les commerciaux affectés.
 * Si le commercial a changé (ancien → nouveau), recalcule pour les deux.
 */
export async function recalculateCaAfterExamenChange(
  createdAt: string,
  newCommercialId: string | null,
  oldCommercialId: string | null
): Promise<void> {
  const mois = toMonthStart(createdAt);
  const promises: Promise<void>[] = [];

  if (newCommercialId) {
    promises.push(recalculateCaMensuel(newCommercialId, mois));
  }
  if (oldCommercialId && oldCommercialId !== newCommercialId) {
    promises.push(recalculateCaMensuel(oldCommercialId, mois));
  }

  await Promise.all(promises);
}

/**
 * Retourne l'historique du CA mensuel pour les N derniers mois (tous commerciaux).
 */
export async function getCaMensuelHistory(
  monthsBack: number = 6
): Promise<{ commercial_id: string; mois: string; montant: number }[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  const startMois = toMonthStart(startDate.toISOString());

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ca_mensuel')
    .select('commercial_id, mois, montant')
    .gte('mois', startMois)
    .order('mois', { ascending: true });

  if (error) {
    console.error('CA history query error:', error);
    return [];
  }

  return data || [];
}
