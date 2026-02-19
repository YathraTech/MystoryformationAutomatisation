import type { Inscription, InscriptionStatus, BadgeKey, BadgeColor } from '@/types/admin';
import { createClient } from '@/lib/supabase/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import {
  updateInscriptionStatus as gsUpdateStatus,
  addRelance as gsAddRelance,
  addInscriptionRow as gsAddRow,
  updateBadge as gsUpdateBadge,
} from '@/lib/google-sheets/inscriptions';

// --- snake_case DB <-> camelCase TS mapping ---

interface DbInscription {
  id: number;
  client_id: number | null;
  timestamp: string;
  civilite: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance: string;
  adresse: string;
  code_postal: string;
  ville: string;
  numero_cpf: string;
  numero_securite_sociale: string;
  mode_financement: string;
  langue: string;
  niveau_actuel: string;
  objectif: string;
  formation_id: string;
  formation_nom: string;
  formation_duree: string;
  formation_prix: string;
  jours_disponibles: string;
  creneaux_horaires: string;
  date_debut_souhaitee: string;
  date_formation: string | null;
  heure_formation: string | null;
  commentaires: string;
  statut: string;
  relance_date: string;
  relance_note: string;
  badge_contacte: string;
  badge_paye: string;
  badge_dossier: string;
  lieu: string | null;
}

function dbToInscription(row: DbInscription): Inscription {
  return {
    rowIndex: row.id,
    clientId: row.client_id,
    timestamp: row.timestamp || '',
    civilite: row.civilite || '',
    nom: row.nom || '',
    prenom: row.prenom || '',
    email: row.email || '',
    telephone: row.telephone || '',
    dateNaissance: row.date_naissance || '',
    adresse: row.adresse || '',
    codePostal: row.code_postal || '',
    ville: row.ville || '',
    numeroCPF: row.numero_cpf || '',
    numeroSecuriteSociale: row.numero_securite_sociale || '',
    modeFinancement: row.mode_financement || '',
    langue: row.langue || '',
    niveauActuel: row.niveau_actuel || '',
    objectif: row.objectif || '',
    formationId: row.formation_id || '',
    formationNom: row.formation_nom || '',
    formationDuree: row.formation_duree || '',
    formationPrix: row.formation_prix || '',
    joursDisponibles: row.jours_disponibles || '',
    creneauxHoraires: row.creneaux_horaires || '',
    dateDebutSouhaitee: row.date_debut_souhaitee || '',
    dateFormation: row.date_formation,
    heureFormation: row.heure_formation,
    commentaires: row.commentaires || '',
    statut: (row.statut as InscriptionStatus) || 'En attente',
    relanceDate: row.relance_date || '',
    relanceNote: row.relance_note || '',
    badgeContacte: (row.badge_contacte as BadgeColor) || 'orange',
    badgePaye: (row.badge_paye as BadgeColor) || 'red',
    badgeDossier: (row.badge_dossier as BadgeColor) || 'red',
    lieu: row.lieu || null,
  };
}

function inscriptionToDb(
  data: Omit<Inscription, 'rowIndex' | 'statut' | 'relanceDate' | 'relanceNote' | 'badgeContacte' | 'badgePaye' | 'badgeDossier'>
): Omit<DbInscription, 'id' | 'statut' | 'relance_date' | 'relance_note' | 'badge_contacte' | 'badge_paye' | 'badge_dossier'> {
  return {
    client_id: data.clientId || null,
    timestamp: data.timestamp,
    civilite: data.civilite,
    nom: data.nom,
    prenom: data.prenom,
    email: data.email,
    telephone: data.telephone,
    date_naissance: data.dateNaissance,
    adresse: data.adresse,
    code_postal: data.codePostal,
    ville: data.ville,
    numero_cpf: data.numeroCPF,
    numero_securite_sociale: data.numeroSecuriteSociale,
    mode_financement: data.modeFinancement,
    langue: data.langue,
    niveau_actuel: data.niveauActuel,
    objectif: data.objectif,
    formation_id: data.formationId,
    formation_nom: data.formationNom,
    formation_duree: data.formationDuree,
    formation_prix: data.formationPrix,
    jours_disponibles: data.joursDisponibles,
    creneaux_horaires: data.creneauxHoraires,
    date_debut_souhaitee: data.dateDebutSouhaitee,
    date_formation: data.dateFormation || null,
    heure_formation: data.heureFormation || null,
    commentaires: data.commentaires,
    lieu: data.lieu || null,
  };
}

const BADGE_TO_SNAKE: Record<BadgeKey, string> = {
  badgeContacte: 'badge_contacte',
  badgePaye: 'badge_paye',
  badgeDossier: 'badge_dossier',
};

/** Non-blocking Google Sheets sync */
function syncToSheets(fn: () => Promise<void>): void {
  if (!isGoogleSheetsConfigured()) return;
  fn().catch((err) => {
    console.error('[Google Sheets sync error]', err);
  });
}

// --- Public API (async, backed by Supabase) ---

export async function getAllInscriptions(): Promise<Inscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inscriptions')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbInscription) => dbToInscription(row));
}

export async function getInscriptionById(id: number): Promise<Inscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inscriptions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToInscription(data as DbInscription);
}

export async function getInscriptionByEmail(email: string): Promise<Inscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inscriptions')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return dbToInscription(data as DbInscription);
}

export async function addInscription(
  data: Omit<Inscription, 'rowIndex' | 'statut' | 'relanceDate' | 'relanceNote' | 'badgeContacte' | 'badgePaye' | 'badgeDossier'>
): Promise<Inscription> {
  const supabase = await createClient();
  const dbData = inscriptionToDb(data);

  const { data: row, error } = await supabase
    .from('inscriptions')
    .insert(dbData)
    .select()
    .single();

  if (error || !row) throw new Error(error?.message || 'Insert failed');

  const inscription = dbToInscription(row as DbInscription);

  // Google Sheets sync (non-blocking) - includes the auto-generated ID
  syncToSheets(() => gsAddRow(inscription));

  return inscription;
}

export async function updateInscriptionStatus(id: number, statut: InscriptionStatus): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('inscriptions')
    .update({ statut })
    .eq('id', id);

  if (error) throw new Error(error.message);

  syncToSheets(() => gsUpdateStatus(id, statut));
}

export async function updateBadge(id: number, badge: BadgeKey, color: BadgeColor): Promise<void> {
  const supabase = await createClient();
  const snakeKey = BADGE_TO_SNAKE[badge];

  const { error } = await supabase
    .from('inscriptions')
    .update({ [snakeKey]: color })
    .eq('id', id);

  if (error) throw new Error(error.message);

  syncToSheets(() => gsUpdateBadge(id, badge, color));
}

export async function addRelance(id: number, note: string): Promise<void> {
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from('inscriptions')
    .update({ relance_date: now, relance_note: note })
    .eq('id', id);

  if (error) throw new Error(error.message);

  syncToSheets(() => gsAddRelance(id, note));
}

export async function getArchivedInscriptions(): Promise<Inscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inscriptions')
    .select('*')
    .eq('statut', 'Archivee')
    .order('id', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbInscription) => dbToInscription(row));
}

export async function restoreInscription(id: number): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('inscriptions')
    .update({ statut: 'En attente' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  syncToSheets(() => gsUpdateStatus(id, 'En attente'));
}

export async function deleteInscriptionPermanently(id: number): Promise<void> {
  const supabase = await createClient();

  // Vérifier que l'inscription existe et est archivée
  const { data: existing, error: fetchError } = await supabase
    .from('inscriptions')
    .select('id, statut')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw new Error(`Inscription #${id} non trouvée`);
  }

  if (existing.statut !== 'Archivee') {
    throw new Error(`L'inscription #${id} n'est pas archivée (statut: ${existing.statut})`);
  }

  // Supprimer l'inscription
  const { error, count } = await supabase
    .from('inscriptions')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    console.error('[deleteInscriptionPermanently] Erreur Supabase:', error);
    throw new Error(error.message);
  }

  console.log(`[deleteInscriptionPermanently] Inscription #${id} supprimée`);
}

export async function updateInscriptionFields(
  id: number,
  fields: Partial<Omit<Inscription, 'rowIndex' | 'statut' | 'relanceDate' | 'relanceNote' | 'badgeContacte' | 'badgePaye' | 'badgeDossier'>>
): Promise<void> {
  const supabase = await createClient();

  // Map camelCase to snake_case
  const dbFields: Record<string, string> = {};
  const mapping: Record<string, string> = {
    civilite: 'civilite',
    nom: 'nom',
    prenom: 'prenom',
    email: 'email',
    telephone: 'telephone',
    dateNaissance: 'date_naissance',
    adresse: 'adresse',
    codePostal: 'code_postal',
    ville: 'ville',
    numeroCPF: 'numero_cpf',
    numeroSecuriteSociale: 'numero_securite_sociale',
    modeFinancement: 'mode_financement',
    langue: 'langue',
    niveauActuel: 'niveau_actuel',
    objectif: 'objectif',
    formationId: 'formation_id',
    formationNom: 'formation_nom',
    formationDuree: 'formation_duree',
    formationPrix: 'formation_prix',
    joursDisponibles: 'jours_disponibles',
    creneauxHoraires: 'creneaux_horaires',
    dateDebutSouhaitee: 'date_debut_souhaitee',
    dateFormation: 'date_formation',
    heureFormation: 'heure_formation',
    commentaires: 'commentaires',
    lieu: 'lieu',
  };

  for (const [key, value] of Object.entries(fields)) {
    const dbKey = mapping[key];
    if (dbKey && value !== undefined) {
      dbFields[dbKey] = value as string;
    }
  }

  if (Object.keys(dbFields).length === 0) return;

  const { error } = await supabase
    .from('inscriptions')
    .update(dbFields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getInscriptionsForPlanning(startDate: string, endDate: string): Promise<Inscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inscriptions')
    .select('*')
    .not('date_formation', 'is', null)
    .gte('date_formation', startDate)
    .lte('date_formation', endDate)
    .neq('statut', 'Archivee')
    .order('date_formation', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbInscription) => dbToInscription(row));
}
