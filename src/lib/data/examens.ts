import { createClient } from '@/lib/supabase/server';

export type ExamenResultat = 'a_venir' | 'reussi' | 'echoue';

export interface Examen {
  id: number;
  token: string;
  clientId: number | null;
  civilite: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  diplome: string | null;
  resultat: ExamenResultat;
  createdAt: string;
  updatedAt: string;
}

interface DbExamen {
  id: number;
  token: string;
  client_id: number | null;
  civilite: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance: string;
  adresse: string;
  code_postal: string;
  ville: string;
  diplome: string | null;
  resultat: string;
  created_at: string;
  updated_at: string;
}

function dbToExamen(row: DbExamen): Examen {
  return {
    id: row.id,
    token: row.token,
    clientId: row.client_id,
    civilite: row.civilite || '',
    nom: row.nom || '',
    prenom: row.prenom || '',
    email: row.email || '',
    telephone: row.telephone || '',
    dateNaissance: row.date_naissance || '',
    adresse: row.adresse || '',
    codePostal: row.code_postal || '',
    ville: row.ville || '',
    diplome: row.diplome,
    resultat: (row.resultat as ExamenResultat) || 'a_venir',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getExamensByClientId(clientId: number): Promise<Examen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamen) => dbToExamen(row));
}

export async function getExamensByEmail(email: string): Promise<Examen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamen) => dbToExamen(row));
}

export async function getExamenById(id: number): Promise<Examen | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToExamen(data as DbExamen);
}

export async function updateExamenResultat(id: number, resultat: ExamenResultat): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('examens')
    .update({ resultat })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
