import type { Formation } from '@/types/admin';
import { createClient } from '@/lib/supabase/server';

interface DbFormation {
  id: string;
  nom: string;
  langue: string;
  niveau: string;
  duree_heures: number;
  prix: number;
  description: string;
  eligible_cpf: boolean;
  created_at: string;
  updated_at: string;
}

function dbToFormation(row: DbFormation): Formation {
  return {
    id: row.id,
    nom: row.nom,
    langue: row.langue,
    niveau: row.niveau,
    dureeHeures: row.duree_heures,
    prix: Number(row.prix),
    description: row.description || '',
    eligibleCpf: row.eligible_cpf,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllFormations(): Promise<Formation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbFormation) => dbToFormation(row));
}

export async function getFormationById(id: string): Promise<Formation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToFormation(data as DbFormation);
}

export async function createFormation(
  data: { id: string; nom: string; langue: string; niveau: string; dureeHeures: number; prix: number; description?: string; eligibleCpf: boolean }
): Promise<Formation> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from('formations')
    .insert({
      id: data.id,
      nom: data.nom,
      langue: data.langue,
      niveau: data.niveau,
      duree_heures: data.dureeHeures,
      prix: data.prix,
      description: data.description || '',
      eligible_cpf: data.eligibleCpf,
    })
    .select()
    .single();

  if (error || !row) throw new Error(error?.message || 'Insert failed');
  return dbToFormation(row as DbFormation);
}

export async function updateFormation(
  id: string,
  data: Partial<{ nom: string; langue: string; niveau: string; dureeHeures: number; prix: number; description: string; eligibleCpf: boolean }>
): Promise<void> {
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (data.nom !== undefined) update.nom = data.nom;
  if (data.langue !== undefined) update.langue = data.langue;
  if (data.niveau !== undefined) update.niveau = data.niveau;
  if (data.dureeHeures !== undefined) update.duree_heures = data.dureeHeures;
  if (data.prix !== undefined) update.prix = data.prix;
  if (data.description !== undefined) update.description = data.description;
  if (data.eligibleCpf !== undefined) update.eligible_cpf = data.eligibleCpf;

  const { error } = await supabase
    .from('formations')
    .update(update)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteFormation(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('formations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
