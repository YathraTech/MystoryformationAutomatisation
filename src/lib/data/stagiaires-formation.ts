import { createClient } from '@/lib/supabase/server';
import type {
  StagiaireFormation,
  StagiaireStatut,
  TestFormation,
  AnalyseBesoin,
  Evaluation,
  CoursSession,
  Emargement,
  SatisfactionChaud,
  SatisfactionFroid,
  Reclamation,
  QcmQuestion,
  FormationStats,
  Agence,
} from '@/types/admin';

// ============================================================
// DB → CamelCase converters
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
function dbToStagiaire(row: any): StagiaireFormation {
  return {
    id: row.id,
    clientId: row.client_id,
    inscriptionId: row.inscription_id ?? null,
    civilite: row.civilite || '',
    nom: row.nom || '',
    nomJeuneFille: row.nom_jeune_fille,
    prenom: row.prenom || '',
    dateNaissance: row.date_naissance || '',
    nationalite: row.nationalite || '',
    telephone: row.telephone || '',
    email: row.email || '',
    adressePostale: row.adresse_postale || '',
    numeroPieceIdentite: row.numero_piece_identite || '',
    typePiece: row.type_piece || 'Passeport',
    photoPieceIdentite: row.photo_piece_identite,
    photoCandidat: row.photo_candidat,
    agence: row.agence || 'Gagny',
    commercialeId: row.commerciale_id,
    commercialeNom: row.commerciale_nom,
    sourceProvenance: row.source_provenance,
    typePrestation: row.type_prestation || '',
    formatriceId: row.formatrice_id,
    formatriceNom: row.formatrice_nom,
    joursFormation: row.jours_formation,
    horairesFormation: row.horaires_formation,
    modePaiement: row.mode_paiement,
    montantTotal: row.montant_total ? Number(row.montant_total) : null,
    paiementPlusieursFois: row.paiement_plusieurs_fois || false,
    nombreEcheances: row.nombre_echeances,
    numeroDossierCpf: row.numero_dossier_cpf,
    statutPaiement: row.statut_paiement || 'En attente',
    statut: row.statut || 'inscription',
    heuresPrevues: Number(row.heures_prevues) || 0,
    heuresEffectuees: Number(row.heures_effectuees) || 0,
    dateDebutFormation: row.date_debut_formation,
    dateFinFormation: row.date_fin_formation,
    referentHandicap: row.referent_handicap || false,
    situationHandicapDetail: row.situation_handicap_detail,
    pdfConvention: row.pdf_convention,
    pdfConvocation: row.pdf_convocation,
    pdfProgramme: row.pdf_programme,
    pdfAttestationFin: row.pdf_attestation_fin,
    mailInscriptionEnvoye: row.mail_inscription_envoye || false,
    mailRappelEnvoye: row.mail_rappel_envoye || false,
    mailAttestationEnvoye: row.mail_attestation_envoye || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToTest(row: any): TestFormation {
  return {
    id: row.id,
    stagiaireId: row.stagiaire_id,
    typeTest: row.type_test,
    dateTest: row.date_test,
    scoreCe: Number(row.score_ce),
    scoreCo: Number(row.score_co),
    scoreEe: Number(row.score_ee),
    scoreEo: Number(row.score_eo),
    scoreGlobal: Number(row.score_global),
    niveauEstime: row.niveau_estime,
    profilPedagogique: row.profil_pedagogique,
    reponsesCe: row.reponses_ce,
    reponsesCo: row.reponses_co,
    pdfRapport: row.pdf_rapport,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToAnalyse(row: any): AnalyseBesoin {
  return {
    id: row.id,
    stagiaireId: row.stagiaire_id,
    objectifFormation: row.objectif_formation || [],
    niveauEstime: row.niveau_estime,
    methodePositionnement: row.methode_positionnement,
    situationProfessionnelle: row.situation_professionnelle,
    disponibilites: row.disponibilites || [],
    situationHandicap: row.situation_handicap || false,
    situationHandicapDetail: row.situation_handicap_detail,
    dureeEstimeeFormation: row.duree_estimee_formation || '',
    niveauVise: row.niveau_vise,
    typeCertificationVisee: row.type_certification_visee || [],
    modeFinancement: row.mode_financement,
    commentaires: row.commentaires,
    dateRemplissage: row.date_remplissage,
    commercialeNom: row.commerciale_nom,
    pdfAnalyse: row.pdf_analyse,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToEvaluation(row: any): Evaluation {
  return {
    id: row.id,
    stagiaireId: row.stagiaire_id,
    typeEvaluation: row.type_evaluation,
    scolarisationFrance: row.scolarisation_france,
    scolarisationEtranger: row.scolarisation_etranger,
    scolarisationOu: row.scolarisation_ou ?? null,
    scolarisationQuand: row.scolarisation_quand ?? null,
    alphabetisation: row.alphabetisation,
    coursFrancais: row.cours_francais,
    coursFrancaisDetail: row.cours_francais_detail,
    diplomesLangues: row.diplomes_langues,
    anglais: row.anglais,
    languesParlees: row.langues_parlees,
    usageOrdinateur: row.usage_ordinateur,
    maitriseClavier: row.maitrise_clavier,
    smartphoneTablette: row.smartphone_tablette,
    ordinateurMaison: row.ordinateur_maison,
    accesInternet: row.acces_internet,
    utilisationBoiteMail: row.utilisation_boite_mail,
    sessionOrdinateur: row.session_ordinateur,
    motivation: row.motivation,
    apresFormation: row.apres_formation,
    besoinsVieQuotidienne: row.besoins_vie_quotidienne,
    besoinsVieProfessionnelle: row.besoins_vie_professionnelle,
    certificationVisee: row.certification_visee,
    certificationViseeDetail: row.certification_visee_detail,
    profilPedagogique: row.profil_pedagogique,
    scoreCe: row.score_ce != null ? Number(row.score_ce) : null,
    scoreCo: row.score_co != null ? Number(row.score_co) : null,
    scoreEe: row.score_ee != null ? Number(row.score_ee) : null,
    scoreEo: row.score_eo != null ? Number(row.score_eo) : null,
    niveauGlobal: row.niveau_global,
    grilleNiveaux: row.grille_niveaux,
    comparaisonInitialeFinale: row.comparaison_initiale_finale,
    remarques: row.remarques,
    axesProgression: row.axes_progression,
    signatureIntervenant: row.signature_intervenant,
    pdfEvaluation: row.pdf_evaluation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToCoursSession(row: any): CoursSession {
  return {
    id: row.id,
    dateCours: row.date_cours,
    agence: row.agence,
    formatriceId: row.formatrice_id,
    formatriceNom: row.formatrice_nom,
    horaire: row.horaire,
    dureeHeures: Number(row.duree_heures),
    notes: row.notes,
    pdfEmargement: row.pdf_emargement,
    scanEmargement: row.scan_emargement,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToEmargement(row: any): Emargement {
  return {
    id: row.id,
    coursSessionId: row.cours_session_id,
    stagiaireId: row.stagiaire_id,
    present: row.present || false,
    signatureElectronique: row.signature_electronique,
    justificatifRecu: row.justificatif_recu || false,
    justificatifUpload: row.justificatif_upload,
    mailRelanceEnvoye: row.mail_relance_envoye || false,
    dateRelance: row.date_relance,
    stagiaireNom: row.stagiaires_formation?.nom,
    stagiairePrenom: row.stagiaires_formation?.prenom,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToSatisfactionChaud(row: any): SatisfactionChaud {
  return {
    id: row.id,
    stagiaireId: row.stagiaire_id,
    coursSessionId: row.cours_session_id,
    formatriceId: row.formatrice_id,
    formatriceNom: row.formatrice_nom,
    q1ContenuClair: row.q1_contenu_clair,
    q2FormateurExplique: row.q2_formateur_explique,
    q3Progression: row.q3_progression,
    q4Accueil: row.q4_accueil,
    q5Recommandation: row.q5_recommandation,
    commentaire: row.commentaire,
    dateReponse: row.date_reponse,
    createdAt: row.created_at,
  };
}

function dbToSatisfactionFroid(row: any): SatisfactionFroid {
  return {
    id: row.id,
    stagiaireId: row.stagiaire_id,
    q1Utilite: row.q1_utilite,
    q2ReussiteExamen: row.q2_reussite_examen,
    q3Recommandation: row.q3_recommandation,
    commentaire: row.commentaire,
    dateEnvoi: row.date_envoi,
    dateReponse: row.date_reponse,
    mailEnvoye: row.mail_envoye || false,
    createdAt: row.created_at,
  };
}

function dbToReclamation(row: any): Reclamation {
  return {
    id: row.id,
    stagiaireId: row.stagiaire_id,
    objet: row.objet,
    description: row.description,
    statut: row.statut,
    reponse: row.reponse,
    dateReclamation: row.date_reclamation,
    dateResolution: row.date_resolution,
    traitePar: row.traite_par,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToQcmQuestion(row: any): QcmQuestion {
  return {
    id: row.id,
    typeCompetence: row.type_competence,
    niveau: row.niveau,
    question: row.question,
    choix: row.choix || [],
    reponseCorrecte: row.reponse_correcte,
    mediaUrl: row.media_url,
    points: Number(row.points),
    actif: row.actif,
    ordre: row.ordre,
    createdAt: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================
// STAGIAIRES FORMATION — CRUD
// ============================================================

export async function getAllStagiairesFormation(): Promise<StagiaireFormation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stagiaires_formation')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(dbToStagiaire);
}

export async function getStagiaireFormationById(id: number): Promise<StagiaireFormation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stagiaires_formation')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToStagiaire(data);
}

export async function getStagiairesFormationByClientId(clientId: number): Promise<StagiaireFormation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stagiaires_formation')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(dbToStagiaire);
}

export async function createStagiaireFormation(
  fields: Partial<Record<string, unknown>>
): Promise<StagiaireFormation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stagiaires_formation')
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToStagiaire(data);
}

export async function updateStagiaireFormation(
  id: number,
  fields: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('stagiaires_formation')
    .update(fields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function updateStagiaireStatut(
  id: number,
  statut: StagiaireStatut
): Promise<void> {
  await updateStagiaireFormation(id, { statut });
}

// ============================================================
// TESTS FORMATION
// ============================================================

export async function getTestsByStagiaire(stagiaireId: number): Promise<TestFormation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tests_formation')
    .select('*')
    .eq('stagiaire_id', stagiaireId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(dbToTest);
}

export async function getTestInitial(stagiaireId: number): Promise<TestFormation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tests_formation')
    .select('*')
    .eq('stagiaire_id', stagiaireId)
    .eq('type_test', 'initial')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbToTest(data) : null;
}

export async function getTestFinal(stagiaireId: number): Promise<TestFormation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tests_formation')
    .select('*')
    .eq('stagiaire_id', stagiaireId)
    .eq('type_test', 'final')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbToTest(data) : null;
}

export async function createTest(
  fields: Partial<Record<string, unknown>>
): Promise<TestFormation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tests_formation')
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToTest(data);
}

export async function updateTest(
  id: number,
  fields: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tests_formation')
    .update(fields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// ANALYSE DE BESOIN
// ============================================================

export async function getAnalyseBesoin(stagiaireId: number): Promise<AnalyseBesoin | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('analyses_besoin')
    .select('*')
    .eq('stagiaire_id', stagiaireId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbToAnalyse(data) : null;
}

export async function createAnalyseBesoin(
  fields: Partial<Record<string, unknown>>
): Promise<AnalyseBesoin> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('analyses_besoin')
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToAnalyse(data);
}

export async function updateAnalyseBesoin(
  id: number,
  fields: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('analyses_besoin')
    .update(fields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// EVALUATIONS
// ============================================================

export async function getEvaluationByStagiaire(
  stagiaireId: number,
  type: 'initiale' | 'finale'
): Promise<Evaluation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('stagiaire_id', stagiaireId)
    .eq('type_evaluation', type)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbToEvaluation(data) : null;
}

export async function createEvaluation(
  fields: Partial<Record<string, unknown>>
): Promise<Evaluation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('evaluations')
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToEvaluation(data);
}

export async function updateEvaluation(
  id: number,
  fields: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('evaluations')
    .update(fields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// COURS SESSIONS + EMARGEMENTS
// ============================================================

export async function getAllCoursSessions(agence?: Agence): Promise<CoursSession[]> {
  const supabase = await createClient();
  let query = supabase
    .from('cours_sessions')
    .select('*')
    .order('date_cours', { ascending: false });

  if (agence) query = query.eq('agence', agence);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(dbToCoursSession);
}

export async function getCoursSessionById(id: number): Promise<CoursSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cours_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToCoursSession(data);
}

export async function createCoursSession(
  fields: Partial<Record<string, unknown>>
): Promise<CoursSession> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cours_sessions')
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToCoursSession(data);
}

export async function updateCoursSession(
  id: number,
  fields: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('cours_sessions')
    .update(fields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getEmargementsBySession(coursSessionId: number): Promise<Emargement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('emargements')
    .select('*, stagiaires_formation(nom, prenom)')
    .eq('cours_session_id', coursSessionId)
    .order('stagiaire_id', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(dbToEmargement);
}

export async function getEmargementsByStagiaire(stagiaireId: number): Promise<Emargement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('emargements')
    .select('*')
    .eq('stagiaire_id', stagiaireId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(dbToEmargement);
}

export async function upsertEmargement(
  coursSessionId: number,
  stagiaireId: number,
  present: boolean,
  signatureElectronique?: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('emargements')
    .upsert(
      {
        cours_session_id: coursSessionId,
        stagiaire_id: stagiaireId,
        present,
        signature_electronique: signatureElectronique || null,
      },
      { onConflict: 'cours_session_id,stagiaire_id' }
    );

  if (error) throw new Error(error.message);
}

export async function updateEmargement(
  id: number,
  fields: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('emargements')
    .update(fields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// SATISFACTION
// ============================================================

export async function getSatisfactionChaudByStagiaire(stagiaireId: number): Promise<SatisfactionChaud[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('satisfaction_chaud')
    .select('*')
    .eq('stagiaire_id', stagiaireId)
    .order('date_reponse', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(dbToSatisfactionChaud);
}

export async function createSatisfactionChaud(
  fields: Partial<Record<string, unknown>>
): Promise<SatisfactionChaud> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('satisfaction_chaud')
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToSatisfactionChaud(data);
}

export async function getSatisfactionFroid(stagiaireId: number): Promise<SatisfactionFroid | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('satisfaction_froid')
    .select('*')
    .eq('stagiaire_id', stagiaireId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbToSatisfactionFroid(data) : null;
}

export async function createSatisfactionFroid(
  fields: Partial<Record<string, unknown>>
): Promise<SatisfactionFroid> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('satisfaction_froid')
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToSatisfactionFroid(data);
}

// ============================================================
// RECLAMATIONS
// ============================================================

export async function getAllReclamations(): Promise<Reclamation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reclamations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(dbToReclamation);
}

export async function createReclamation(
  fields: Partial<Record<string, unknown>>
): Promise<Reclamation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reclamations')
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToReclamation(data);
}

export async function updateReclamation(
  id: number,
  fields: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('reclamations')
    .update(fields)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// QCM QUESTIONS
// ============================================================

export async function getQcmQuestions(
  typeCompetence: 'CE' | 'CO',
  niveau?: string
): Promise<QcmQuestion[]> {
  const supabase = await createClient();
  let query = supabase
    .from('qcm_questions')
    .select('*')
    .eq('type_competence', typeCompetence)
    .eq('actif', true)
    .order('ordre', { ascending: true });

  if (niveau) query = query.eq('niveau', niveau);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(dbToQcmQuestion);
}

// ============================================================
// CALCUL AUTO — Correction QCM
// ============================================================

export function calculerScoreQcm(
  reponses: { question: number; reponse: string }[],
  questions: QcmQuestion[]
): { score: number; total: number; details: { question: number; reponse: string; correct: boolean }[] } {
  let score = 0;
  const total = questions.reduce((sum, q) => sum + q.points, 0);
  const details = reponses.map((r) => {
    const q = questions.find((q) => q.id === r.question);
    const correct = q ? r.reponse === q.reponseCorrecte : false;
    if (correct && q) score += q.points;
    return { question: r.question, reponse: r.reponse, correct };
  });

  // Normaliser sur 20
  const scoreNormalise = total > 0 ? Math.round((score / total) * 20 * 10) / 10 : 0;
  return { score: scoreNormalise, total: 20, details };
}

export function calculerNiveau(scoreGlobal: number): string {
  if (scoreGlobal >= 19) return 'B2';
  if (scoreGlobal >= 15) return 'B1';
  if (scoreGlobal >= 10) return 'A2';
  if (scoreGlobal >= 5) return 'A1';
  return 'A0';
}

// ============================================================
// STATS FORMATION
// ============================================================

export async function getFormationStats(): Promise<FormationStats> {
  const supabase = await createClient();

  // Total stagiaires par statut
  const { data: stagiaires, error } = await supabase
    .from('stagiaires_formation')
    .select('statut, agence');

  if (error) throw new Error(error.message);

  const all = stagiaires || [];
  const enFormation = all.filter((s) => s.statut === 'en_formation').length;
  const terminees = all.filter((s) => s.statut === 'terminee').length;
  const abandonnees = all.filter((s) => s.statut === 'abandonnee').length;

  const parAgence: Record<Agence, number> = { Gagny: 0, Sarcelles: 0, Rosny: 0 };
  all.forEach((s) => {
    if (s.agence in parAgence) parAgence[s.agence as Agence]++;
  });

  // Satisfaction moyenne
  const { data: satData } = await supabase
    .from('satisfaction_chaud')
    .select('q1_contenu_clair, q2_formateur_explique, q3_progression, q4_accueil, q5_recommandation');

  let tauxSatisfaction = 0;
  if (satData && satData.length > 0) {
    const totalScore = satData.reduce((sum, s) => {
      return sum + s.q1_contenu_clair + s.q2_formateur_explique + s.q3_progression + s.q4_accueil + s.q5_recommandation;
    }, 0);
    tauxSatisfaction = Math.round((totalScore / (satData.length * 25)) * 100);
  }

  return {
    totalStagiaires: all.length,
    enFormation,
    terminees,
    abandonnees,
    tauxSatisfaction,
    tauxReussite: all.length > 0 ? Math.round((terminees / all.length) * 100) : 0,
    tauxAbandon: all.length > 0 ? Math.round((abandonnees / all.length) * 100) : 0,
    parAgence,
  };
}

// ============================================================
// ABSENCES — Stagiaires absents non relancés
// ============================================================

export async function getAbsencesNonRelancees(): Promise<
  (Emargement & { stagiaireEmail?: string })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('emargements')
    .select('*, stagiaires_formation(nom, prenom, email)')
    .eq('present', false)
    .eq('mail_relance_envoye', false);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    ...dbToEmargement(row),
    stagiaireEmail: row.stagiaires_formation?.email,
  }));
}

// Heures effectuées par stagiaire (somme des cours où présent)
export async function recalculerHeuresEffectuees(stagiaireId: number): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('emargements')
    .select('cours_session_id, cours_sessions(duree_heures)')
    .eq('stagiaire_id', stagiaireId)
    .eq('present', true);

  if (error) throw new Error(error.message);

  const heures = (data || []).reduce((sum, row: any) => {
    const session = row.cours_sessions;
    const duree = Array.isArray(session) ? session[0]?.duree_heures : session?.duree_heures;
    return sum + (duree ? Number(duree) : 0);
  }, 0);

  // Mettre à jour le stagiaire
  await updateStagiaireFormation(stagiaireId, { heures_effectuees: heures });
  return heures;
}
