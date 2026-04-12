import { createClient } from '@/lib/supabase/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import { updateExamenInSheet, updateExamenResultatInSheet, markResultatEmailSentInSheet } from '@/lib/google-sheets/examens';

/** Non-blocking Google Sheets sync for examens */
function syncExamenToSheets(fn: () => Promise<void>): void {
  if (!isGoogleSheetsConfigured()) return;
  fn().catch((err) => {
    console.error('[Google Sheets examen sync error]', err);
  });
}

export type ExamenResultat = 'a_venir' | 'reussi' | 'echoue' | 'absent';
export type MoyenPaiement = 'carte_bancaire' | 'lien_paiement' | 'especes' | 'cpf' | 'mixte' | 'autre';
export type TypeExamen = 'TEF IRN' | 'Civique' | 'PrepMyFuture';

export interface PdfVersion {
  version: number;
  date: string;
  convocation: string | null;
  ficheInscription: string | null;
  attestationPaiement: string | null;
}

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
  pieceIdentite: string[] | null;
  numeroPasseport: string | null;
  numeroCni: string | null;
  diplome: string | null;
  dateExamen: string | null;
  heureExamen: string | null;
  resultat: ExamenResultat;
  prix: number | null;
  moyenPaiement: MoyenPaiement | null;
  montantEspeces: number | null;
  montantCb: number | null;
  formateurId: string | null;
  typeExamen: TypeExamen | null;
  lieu: string | null;
  remises: string | null;
  distanciel: boolean;
  datePaiement: string | null;
  lieuConfiguration: string | null;
  commercialId: string | null;
  partenaireId: string | null;
  motivation: string | null;
  motivationAutre: string | null;
  serviceSouhaite: string | null;
  niveau: string | null;
  langue: string | null;
  pdfAttestationPaiement: string | null;
  pdfFicheInscription: string | null;
  pdfConvocation: string | null;
  pdfAttestationReussite: string | null;
  inscriptionType: string | null;
  facilites: string | null;
  numeroCpf: string | null;
  pdfVersions: PdfVersion[];
  resultatEmailSent: boolean;
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
  montant_especes: number | null;
  montant_cb: number | null;
  formateur_id: string | null;
  type_examen: string | null;
  lieu: string | null;
  remises: string | null;
  distanciel: boolean;
  date_paiement: string | null;
  lieu_configuration: string | null;
  commercial_id: string | null;
  partenaire_id: string | null;
  motivation: string | null;
  motivation_autre: string | null;
  service_souhaite: string | null;
  niveau: string | null;
  langue: string | null;
  pdf_attestation_paiement: string | null;
  pdf_fiche_inscription: string | null;
  pdf_convocation: string | null;
  pdf_attestation_reussite: string | null;
  inscription_type: string | null;
  facilites: string | null;
  numero_cpf: string | null;
  pdf_versions: PdfVersion[] | null;
  resultat_email_sent: boolean;
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
    pieceIdentite: row.piece_identite ? JSON.parse(row.piece_identite) : null,
    numeroPasseport: row.numero_passeport,
    numeroCni: row.numero_cni,
    diplome: row.diplome,
    dateExamen: row.date_examen,
    heureExamen: row.heure_examen,
    resultat: (row.resultat as ExamenResultat) || 'a_venir',
    prix: row.prix,
    moyenPaiement: row.moyen_paiement as MoyenPaiement | null,
    montantEspeces: row.montant_especes,
    montantCb: row.montant_cb,
    formateurId: row.formateur_id,
    typeExamen: row.type_examen as TypeExamen | null,
    lieu: row.lieu,
    remises: row.remises,
    distanciel: row.distanciel || false,
    datePaiement: row.date_paiement,
    lieuConfiguration: row.lieu_configuration,
    commercialId: row.commercial_id,
    partenaireId: row.partenaire_id,
    motivation: row.motivation,
    motivationAutre: row.motivation_autre,
    serviceSouhaite: row.service_souhaite,
    niveau: row.niveau,
    langue: row.langue,
    pdfAttestationPaiement: row.pdf_attestation_paiement,
    pdfFicheInscription: row.pdf_fiche_inscription,
    pdfConvocation: row.pdf_convocation,
    pdfAttestationReussite: row.pdf_attestation_reussite,
    inscriptionType: row.inscription_type,
    facilites: row.facilites,
    numeroCpf: row.numero_cpf,
    pdfVersions: row.pdf_versions || [],
    resultatEmailSent: row.resultat_email_sent || false,
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

  syncExamenToSheets(() => updateExamenResultatInSheet(id, resultat));
}

export interface UpdateExamenFields {
  dateExamen?: string | null;
  heureExamen?: string | null;
  resultat?: ExamenResultat;
  prix?: number | null;
  moyenPaiement?: MoyenPaiement | null;
  montantEspeces?: number | null;
  montantCb?: number | null;
  typeExamen?: TypeExamen | null;
  lieu?: string | null;
  remises?: string | null;
  distanciel?: boolean;
  datePaiement?: string | null;
  lieuConfiguration?: string | null;
  commercialId?: string | null;
  partenaireId?: string | null;
  pdfAttestationPaiement?: string | null;
  pdfFicheInscription?: string | null;
  pdfConvocation?: string | null;
  pdfAttestationReussite?: string | null;
  pieceIdentite?: string[] | null;
  pdfVersions?: PdfVersion[];
  resultatEmailSent?: boolean;
  inscriptionType?: string | null;
  facilites?: string | null;
  numeroCpf?: string | null;
  nationalite?: string | null;
  villeNaissance?: string | null;
  lieuNaissance?: string | null;
  langueMaternelle?: string | null;
}

export async function updateExamenFields(
  id: number,
  fields: UpdateExamenFields
): Promise<void> {
  const supabase = await createClient();

  const dbFields: Record<string, string | number | boolean | null | PdfVersion[]> = {};
  if (fields.dateExamen !== undefined) dbFields.date_examen = fields.dateExamen;
  if (fields.heureExamen !== undefined) dbFields.heure_examen = fields.heureExamen;
  if (fields.resultat !== undefined) dbFields.resultat = fields.resultat;
  if (fields.prix !== undefined) dbFields.prix = fields.prix;
  if (fields.moyenPaiement !== undefined) dbFields.moyen_paiement = fields.moyenPaiement;
  if (fields.montantEspeces !== undefined) dbFields.montant_especes = fields.montantEspeces;
  if (fields.montantCb !== undefined) dbFields.montant_cb = fields.montantCb;
  if (fields.typeExamen !== undefined) dbFields.type_examen = fields.typeExamen;
  if (fields.lieu !== undefined) dbFields.lieu = fields.lieu;
  if (fields.remises !== undefined) dbFields.remises = fields.remises;
  if (fields.distanciel !== undefined) dbFields.distanciel = fields.distanciel;
  if (fields.datePaiement !== undefined) dbFields.date_paiement = fields.datePaiement;
  if (fields.lieuConfiguration !== undefined) dbFields.lieu_configuration = fields.lieuConfiguration;
  if (fields.commercialId !== undefined) dbFields.commercial_id = fields.commercialId;
  if (fields.partenaireId !== undefined) dbFields.partenaire_id = fields.partenaireId;
  if (fields.pdfAttestationPaiement !== undefined) dbFields.pdf_attestation_paiement = fields.pdfAttestationPaiement;
  if (fields.pdfFicheInscription !== undefined) dbFields.pdf_fiche_inscription = fields.pdfFicheInscription;
  if (fields.pdfConvocation !== undefined) dbFields.pdf_convocation = fields.pdfConvocation;
  if (fields.pdfAttestationReussite !== undefined) dbFields.pdf_attestation_reussite = fields.pdfAttestationReussite;
  if (fields.pieceIdentite !== undefined) dbFields.piece_identite = fields.pieceIdentite ? JSON.stringify(fields.pieceIdentite) : null;
  if (fields.pdfVersions !== undefined) dbFields.pdf_versions = fields.pdfVersions;
  if (fields.resultatEmailSent !== undefined) dbFields.resultat_email_sent = fields.resultatEmailSent;
  if (fields.inscriptionType !== undefined) dbFields.inscription_type = fields.inscriptionType;
  if (fields.facilites !== undefined) dbFields.facilites = fields.facilites;
  if (fields.numeroCpf !== undefined) dbFields.numero_cpf = fields.numeroCpf;
  if (fields.nationalite !== undefined) dbFields.nationalite = fields.nationalite;
  if (fields.villeNaissance !== undefined) dbFields.ville_naissance = fields.villeNaissance;
  if (fields.lieuNaissance !== undefined) dbFields.lieu_naissance = fields.lieuNaissance;
  if (fields.langueMaternelle !== undefined) dbFields.langue_maternelle = fields.langueMaternelle;

  if (Object.keys(dbFields).length === 0) return;

  const { error } = await supabase
    .from('examens')
    .update(dbFields)
    .eq('id', id);

  if (error) throw new Error(error.message);

  syncExamenToSheets(() => updateExamenInSheet(id, fields));
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

export async function getExamensPendingResultEmail(): Promise<Examen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .neq('resultat', 'a_venir')
    .eq('resultat_email_sent', false)
    .not('date_examen', 'is', null)
    .neq('statut', 'Archivee');

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamen) => dbToExamen(row));
}

export async function markResultatEmailSent(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from('examens')
    .update({ resultat_email_sent: true })
    .in('id', ids);

  if (error) throw new Error(error.message);

  syncExamenToSheets(() => markResultatEmailSentInSheet(ids));
}

export async function getExamensByDate(dateExamen: string): Promise<Examen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('examens')
    .select('*')
    .eq('date_examen', dateExamen)
    .neq('statut', 'Archivee')
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamen) => dbToExamen(row));
}

export async function archiveExamensByDate(dateExamen: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('examens')
    .update({ statut: 'Archivee' })
    .eq('date_examen', dateExamen)
    .neq('statut', 'Archivee')
    .select('id');

  if (error) throw new Error(error.message);
  return data?.length || 0;
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

/**
 * Supprime définitivement les inscriptions/examens spam créés depuis plus de 2 jours :
 * 1. Examens sans diplôme choisi (diplome IS NULL)
 * 2. Inscriptions "Examen uniquement" dont le client n'a aucun examen avec diplôme
 * 3. Clients orphelins (plus aucun lien avec examen/inscription/formation)
 */
export async function autoDeleteStaleExamens(): Promise<number> {
  const supabase = await createClient();

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const cutoffDate = twoDaysAgo.toISOString();

  let totalDeleted = 0;
  const clientIdsToCheck = new Set<number>();

  // === ÉTAPE 1 : Supprimer les examens sans diplôme > 2 jours ===
  const { data: staleExamens } = await supabase
    .from('examens')
    .select('id, client_id')
    .is('diplome', null)
    .lt('created_at', cutoffDate)
    .neq('statut', 'Archivee');

  if (staleExamens && staleExamens.length > 0) {
    const ids = staleExamens.map((e) => e.id);
    staleExamens.forEach((e) => { if (e.client_id) clientIdsToCheck.add(e.client_id); });

    const { error } = await supabase.from('examens').delete().in('id', ids);
    if (!error) {
      totalDeleted += ids.length;
      console.log(`[cleanup] ${ids.length} examen(s) sans diplôme supprimé(s)`);
    }
  }

  // === ÉTAPE 2 : Supprimer les inscriptions "Examen uniquement" sans examen valide > 2 jours ===
  const { data: staleInscriptions } = await supabase
    .from('inscriptions')
    .select('id, client_id')
    .eq('formation_nom', 'Examen uniquement')
    .lt('timestamp', cutoffDate)
    .neq('statut', 'Archivee');

  if (staleInscriptions && staleInscriptions.length > 0) {
    const toDelete: number[] = [];

    for (const ins of staleInscriptions) {
      if (ins.client_id) {
        // Vérifier si le client a au moins un examen avec diplôme
        const { count } = await supabase
          .from('examens')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', ins.client_id)
          .not('diplome', 'is', null);

        if ((count || 0) === 0) {
          // Pas d'examen valide → supprimer l'inscription
          toDelete.push(ins.id);
          clientIdsToCheck.add(ins.client_id);
        }
      } else {
        // Pas de client_id → inscription orpheline, supprimer
        toDelete.push(ins.id);
      }
    }

    if (toDelete.length > 0) {
      const { error } = await supabase.from('inscriptions').delete().in('id', toDelete);
      if (!error) {
        totalDeleted += toDelete.length;
        console.log(`[cleanup] ${toDelete.length} inscription(s) "Examen uniquement" sans examen supprimée(s)`);
      }
    }
  }

  // === ÉTAPE 3 : Nettoyer les clients orphelins ===
  for (const clientId of clientIdsToCheck) {
    try {
      const [{ count: exCount }, { count: insCount }, { count: stagCount }] = await Promise.all([
        supabase.from('examens').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
        supabase.from('inscriptions').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
        supabase.from('stagiaires_formation').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      ]);

      if ((exCount || 0) === 0 && (insCount || 0) === 0 && (stagCount || 0) === 0) {
        await supabase.from('clients').delete().eq('id', clientId);
        console.log(`[cleanup] Client orphelin #${clientId} supprimé`);
      }
    } catch {
      // Continuer silencieusement
    }
  }

  return totalDeleted;
}
