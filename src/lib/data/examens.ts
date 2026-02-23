import { createClient } from '@/lib/supabase/server';

export type ExamenResultat = 'a_venir' | 'reussi' | 'echoue';
export type MoyenPaiement = 'carte_bancaire' | 'lien_paiement' | 'especes' | 'autre';
export type TypeExamen = 'TEF IRN' | 'Civique' | 'PrepMyFuture';

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
  nationalite: string | null;
  villeNaissance: string | null;
  lieuNaissance: string | null;
  langueMaternelle: string | null;
  objectifAdministratif: string | null;
  sourceConnaissance: string | null;
  pieceIdentite: string | null;
  numeroPasseport: string | null;
  numeroCni: string | null;
  diplome: string | null;
  dateExamen: string | null;
  heureExamen: string | null;
  resultat: ExamenResultat;
  prix: number | null;
  moyenPaiement: MoyenPaiement | null;
  formateurId: string | null;
  typeExamen: TypeExamen | null;
  lieu: string | null;
  remises: string | null;
  distanciel: boolean;
  datePaiement: string | null;
  lieuConfiguration: string | null;
  commercialId: string | null;
  motivation: string | null;
  motivationAutre: string | null;
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
  nationalite: string | null;
  ville_naissance: string | null;
  lieu_naissance: string | null;
  langue_maternelle: string | null;
  objectif_administratif: string | null;
  source_connaissance: string | null;
  piece_identite: string | null;
  numero_passeport: string | null;
  numero_cni: string | null;
  diplome: string | null;
  date_examen: string | null;
  heure_examen: string | null;
  resultat: string;
  prix: number | null;
  moyen_paiement: string | null;
  formateur_id: string | null;
  type_examen: string | null;
  lieu: string | null;
  remises: string | null;
  distanciel: boolean;
  date_paiement: string | null;
  lieu_configuration: string | null;
  commercial_id: string | null;
  motivation: string | null;
  motivation_autre: string | null;
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
    nationalite: row.nationalite,
    villeNaissance: row.ville_naissance,
    lieuNaissance: row.lieu_naissance,
    langueMaternelle: row.langue_maternelle,
    objectifAdministratif: row.objectif_administratif,
    sourceConnaissance: row.source_connaissance,
    pieceIdentite: row.piece_identite,
    numeroPasseport: row.numero_passeport,
    numeroCni: row.numero_cni,
    diplome: row.diplome,
    dateExamen: row.date_examen,
    heureExamen: row.heure_examen,
    resultat: (row.resultat as ExamenResultat) || 'a_venir',
    prix: row.prix,
    moyenPaiement: row.moyen_paiement as MoyenPaiement | null,
    formateurId: row.formateur_id,
    typeExamen: row.type_examen as TypeExamen | null,
    lieu: row.lieu,
    remises: row.remises,
    distanciel: row.distanciel || false,
    datePaiement: row.date_paiement,
    lieuConfiguration: row.lieu_configuration,
    commercialId: row.commercial_id,
    motivation: row.motivation,
    motivationAutre: row.motivation_autre,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllExamens(): Promise<Examen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .neq('statut', 'Archivee')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamen) => dbToExamen(row));
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

export interface UpdateExamenFields {
  dateExamen?: string | null;
  heureExamen?: string | null;
  resultat?: ExamenResultat;
  prix?: number | null;
  moyenPaiement?: MoyenPaiement | null;
  formateurId?: string | null;
  typeExamen?: TypeExamen | null;
  lieu?: string | null;
  remises?: string | null;
  distanciel?: boolean;
  datePaiement?: string | null;
  lieuConfiguration?: string | null;
  commercialId?: string | null;
}

export async function updateExamenFields(
  id: number,
  fields: UpdateExamenFields
): Promise<void> {
  const supabase = await createClient();

  const dbFields: Record<string, string | number | boolean | null> = {};
  if (fields.dateExamen !== undefined) dbFields.date_examen = fields.dateExamen;
  if (fields.heureExamen !== undefined) dbFields.heure_examen = fields.heureExamen;
  if (fields.resultat !== undefined) dbFields.resultat = fields.resultat;
  if (fields.prix !== undefined) dbFields.prix = fields.prix;
  if (fields.moyenPaiement !== undefined) dbFields.moyen_paiement = fields.moyenPaiement;
  if (fields.formateurId !== undefined) dbFields.formateur_id = fields.formateurId;
  if (fields.typeExamen !== undefined) dbFields.type_examen = fields.typeExamen;
  if (fields.lieu !== undefined) dbFields.lieu = fields.lieu;
  if (fields.remises !== undefined) dbFields.remises = fields.remises;
  if (fields.distanciel !== undefined) dbFields.distanciel = fields.distanciel;
  if (fields.datePaiement !== undefined) dbFields.date_paiement = fields.datePaiement;
  if (fields.lieuConfiguration !== undefined) dbFields.lieu_configuration = fields.lieuConfiguration;
  if (fields.commercialId !== undefined) dbFields.commercial_id = fields.commercialId;

  if (Object.keys(dbFields).length === 0) return;

  const { error } = await supabase
    .from('examens')
    .update(dbFields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function archiveExamen(id: number): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('examens')
    .update({ statut: 'Archivee' })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteExamen(id: number): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('examens')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Archive automatiquement les examens réussis dont la date d'examen
 * est passée depuis plus de 3 mois.
 */
export async function autoArchiveOldExamens(): Promise<number> {
  const supabase = await createClient();

  // Date limite : 3 mois dans le passé
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const cutoffDate = threeMonthsAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('examens')
    .update({ statut: 'Archivee' })
    .eq('resultat', 'reussi')
    .not('date_examen', 'is', null)
    .lte('date_examen', cutoffDate)
    .neq('statut', 'Archivee')
    .select('id');

  if (error) {
    console.error('[autoArchiveOldExamens] Erreur:', error.message);
    return 0;
  }

  const count = data?.length || 0;
  if (count > 0) {
    console.log(`[autoArchiveOldExamens] ${count} examen(s) archivé(s) automatiquement`);
  }
  return count;
}

export async function getExamensForPlanning(startDate: string, endDate: string): Promise<Examen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .not('date_examen', 'is', null)
    .gte('date_examen', startDate)
    .lte('date_examen', endDate)
    .order('date_examen', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamen) => dbToExamen(row));
}
