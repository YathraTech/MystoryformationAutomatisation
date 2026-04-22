export type InscriptionStatus = 'En attente' | 'Validee' | 'Refusee' | 'Archivee';

export type BadgeColor = 'red' | 'orange' | 'green';

export type BadgeKey = 'badgeContacte' | 'badgePaye' | 'badgeDossier';

export interface Inscription {
  rowIndex: number;
  clientId?: number | null;
  timestamp: string;
  civilite: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  numeroCPF: string;
  numeroDossierCPF: string;
  numeroSecuriteSociale: string;
  modeFinancement: string;
  langue: string;
  niveauActuel: string;
  objectif: string;
  formationId: string;
  formationNom: string;
  formationDuree: string;
  formationPrix: string;
  joursDisponibles: string;
  creneauxHoraires: string;
  dateDebutSouhaitee: string;
  dateFormation: string | null;
  heureFormation: string | null;
  commentaires: string;
  statut: InscriptionStatus;
  relanceDate: string;
  relanceNote: string;
  badgeContacte: BadgeColor;
  badgePaye: BadgeColor;
  badgeDossier: BadgeColor;
  lieu: string | null;
  commercialId?: string | null;
  commercialNom?: string | null;
}

export interface RecentExamen {
  id: number;
  nom: string;
  prenom: string;
  diplome: string | null;
  createdAt: string;
  resultat: 'a_venir' | 'reussi' | 'echoue' | 'absent';
  inscriptionId: number | null;
  configured: boolean;
  lieu: string | null;
}

export interface ExamenStats {
  total: number;
  aPlanifier: number;    // Pas de date
  aVenir: number;        // Date définie, résultat à venir
  termines: number;      // Réussi ou échoué
  incomplets: number;    // Pas de diplôme choisi
}

export interface RevenueStats {
  currentMonth: number;        // CA du mois en cours
  previousMonth: number;       // CA du mois précédent (objectif)
  currentMonthLabel: string;   // Ex: "Février 2026"
  previousMonthLabel: string;  // Ex: "Janvier 2026"
  progression: number;         // Pourcentage d'atteinte de l'objectif (0-100+)
  byMonth: { month: string; label: string; amount: number }[]; // Historique des 6 derniers mois
}

export interface CommercialRevenue {
  commercialId: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'commercial';
  currentMonth: number;
  nombreVentes: number;
  objectifCa: number | null;
  progression: number;
  byMonth?: { mois: string; label: string; montant: number }[];
}

export interface CentreExamenStats {
  totalExamens: number;
  examenTraites: number;
  examenACompleter: number;
  totalInscriptions: number;
  totalFormations: number;
}

export interface CentreRevenue {
  centre: string;                     // "Gagny" ou "Sarcelles"
  revenue: RevenueStats;              // CA du centre
  commercialRevenues: CommercialRevenue[]; // CA par commercial de ce centre
  examenStats: CentreExamenStats;     // Stats examens du centre
}

export interface FeuilleAppelExamen {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  diplome: string | null;
  dateExamen: string;
  heureExamen: string | null;
  resultat: 'a_venir' | 'reussi' | 'echoue' | 'absent';
  lieu: string | null;
  inscriptionId: number | null;
  resultatEmailSent: boolean;
}

export interface FeuilleAppelData {
  examens: FeuilleAppelExamen[];
  dateExamen: string;     // Date de l'examen concerné
}

export interface FeuilleAppelSummary {
  dateExamen: string;
  totalCandidats: number;
  reussi: number;
  echoue: number;
  absent: number;
  aVenir: number;
}

export interface DashboardStats {
  totalInscriptions: number;
  totalFormations: number;
  totalExamens: number;
  byStatus: Record<InscriptionStatus, number>;
  formationsByStatus: Record<InscriptionStatus, number>;
  byFormation: { formation: string; count: number }[];
  byMonth: { month: string; count: number }[];
  recentInscriptions: Inscription[];
  recentExamens: RecentExamen[];
  examenStats: ExamenStats;
  revenue: RevenueStats;
  userLieu: string | null;
  commercialRevenues: CommercialRevenue[];
  revenueByCentre: CentreRevenue[] | null; // Pour les admins : CA par centre
  feuilleAppel: FeuilleAppelData | null;
}

export interface InscriptionFilters {
  search: string;
  status: InscriptionStatus | 'all';
  formation: string | 'all';
  commercial: string | 'all';
  date: string;
  lieu: string | 'all';
  examen: string | 'all';
}

export interface Formation {
  id: string;
  nom: string;
  langue: string;
  niveau: string;
  dureeHeures: number;
  prix: number;
  description: string;
  eligibleCpf: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamTimeSlot {
  id: number;
  label: string;
  jour: string;
  heure: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamOption {
  id: number;
  code: string;
  label: string;
  description: string | null;
  categorie: string | null;
  estPack: boolean;
  visiblePublic: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
  // Relations (chargées séparément si besoin)
  packItems?: ExamOption[];
  timeSlots?: ExamTimeSlot[];
}

export interface ExamType {
  id: number;
  code: string;
  label: string;
  description: string | null;
  icon: string;
  color: string;
  visible: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamObjectif {
  id: number;
  code: string;
  label: string;
  ordre: number;
  visible: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// MODULE FORMATION — Types
// ============================================================

export type StagiaireStatut =
  | 'inscription'
  | 'test_initial'
  | 'analyse_besoin'
  | 'evaluation_initiale'
  | 'en_formation'
  | 'test_final'
  | 'evaluation_finale'
  | 'terminee'
  | 'abandonnee';

export type TypePiece = 'Passeport' | 'CNI' | 'Titre de séjour';
export type Agence = 'Gagny' | 'Sarcelles' | 'Rosny';
export type StatutPaiement = 'Payé' | 'En attente' | 'Partiel' | 'Impayé';
export type ModePaiement = 'CB' | 'Espèces' | 'Virement' | 'CPF' | 'Mixte';
export type NiveauLangue = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
export type ProfilPedagogique = 'Alphabétisation' | 'FLE';
export type TypeTest = 'initial' | 'final';
export type TypeEvaluation = 'initiale' | 'finale';
export type ReclamationStatut = 'ouverte' | 'en_cours' | 'resolue' | 'fermee';

export interface StagiaireFormation {
  id: number;
  clientId: number | null;
  inscriptionId: number | null;

  // Infos personnelles
  civilite: string;
  nom: string;
  nomJeuneFille: string | null;
  prenom: string;
  dateNaissance: string;
  nationalite: string;
  telephone: string;
  email: string;
  adressePostale: string;
  numeroPieceIdentite: string;
  typePiece: TypePiece;
  photoPieceIdentite: string[] | null;
  photoCandidat: string[] | null;

  // Agence & commercial
  agence: Agence;
  commercialeId: string | null;
  commercialeNom: string | null;
  sourceProvenance: string | null;
  typePrestation: string;

  // Formatrice
  formatriceId: string | null;
  formatriceNom: string | null;

  // Planning
  joursFormation: string[] | null;
  horairesFormation: string | null;

  // Paiement
  modePaiement: ModePaiement | null;
  montantTotal: number | null;
  paiementPlusieursFois: boolean;
  nombreEcheances: number | null;
  numeroDossierCpf: string | null;
  statutPaiement: StatutPaiement;

  // Suivi
  statut: StagiaireStatut;
  heuresPrevues: number;
  heuresEffectuees: number;
  dateDebutFormation: string | null;
  dateFinFormation: string | null;
  referentHandicap: boolean;
  situationHandicapDetail: string | null;

  // PDFs
  pdfConvention: string | null;
  pdfConvocation: string | null;
  pdfProgramme: string | null;
  pdfAttestationFin: string | null;

  // Mails
  mailInscriptionEnvoye: boolean;
  mailRappelEnvoye: boolean;
  mailAttestationEnvoye: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface TestFormation {
  id: number;
  stagiaireId: number;
  typeTest: TypeTest;
  dateTest: string;

  scoreCe: number;
  scoreCo: number;
  scoreEe: number;
  scoreEo: number;
  scoreGlobal: number; // Calculé auto
  niveauEstime: NiveauLangue; // Calculé auto

  profilPedagogique: ProfilPedagogique | null;
  reponsesCe: QcmReponse[] | null;
  reponsesCo: QcmReponse[] | null;

  pdfRapport: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface QcmReponse {
  question: number;
  reponse: string;
  correct: boolean;
}

export interface AnalyseBesoin {
  id: number;
  stagiaireId: number;

  objectifFormation: string[];
  niveauEstime: string | null;
  methodePositionnement: string | null;

  situationProfessionnelle: string | null;
  disponibilites: string[];
  situationHandicap: boolean;
  situationHandicapDetail: string | null;

  dureeEstimeeFormation: string;
  niveauVise: NiveauLangue;
  typeCertificationVisee: string[];
  modeFinancement: string | null;
  commentaires: string | null;

  dateRemplissage: string;
  commercialeNom: string | null;

  pdfAnalyse: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: number;
  stagiaireId: number;
  typeEvaluation: TypeEvaluation;

  // Recueil d'infos (éval initiale)
  scolarisationFrance: boolean | null;
  scolarisationEtranger: boolean | null;
  alphabetisation: boolean | null;
  coursFrancais: boolean | null;
  coursFrancaisDetail: string | null;
  diplomesLangues: string | null;
  anglais: boolean | null;
  languesParlees: string | null;
  usageOrdinateur: boolean | null;
  maitriseClavier: boolean | null;
  smartphoneTablette: boolean | null;
  ordinateurMaison: boolean | null;
  accesInternet: boolean | null;
  utilisationBoiteMail: boolean | null;
  sessionOrdinateur: boolean | null;
  motivation: string | null;
  apresFormation: string | null;
  besoinsVieQuotidienne: number | null;
  besoinsVieProfessionnelle: number | null;
  certificationVisee: boolean | null;
  certificationViseeDetail: string | null;

  // Résultats
  profilPedagogique: ProfilPedagogique | null;
  scoreCe: number | null;
  scoreCo: number | null;
  scoreEe: number | null;
  scoreEo: number | null;
  niveauGlobal: string | null;
  grilleNiveaux: Record<string, string> | null;

  // Éval finale
  comparaisonInitialeFinale: Record<string, { initial: number; final: number }> | null;
  remarques: string | null;
  axesProgression: string[] | null;

  signatureIntervenant: string | null;

  pdfEvaluation: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CoursSession {
  id: number;
  dateCours: string;
  agence: Agence;
  formatriceId: string | null;
  formatriceNom: string | null;
  horaire: string | null;
  dureeHeures: number;
  notes: string | null;
  pdfEmargement: string | null;
  scanEmargement: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface Emargement {
  id: number;
  coursSessionId: number;
  stagiaireId: number;

  present: boolean;
  signatureElectronique: string | null;
  justificatifRecu: boolean;
  justificatifUpload: string | null;
  mailRelanceEnvoye: boolean;
  dateRelance: string | null;

  // Enrichi côté client
  stagiaireNom?: string;
  stagiairePrenom?: string;

  createdAt: string;
  updatedAt: string;
}

export interface SatisfactionChaud {
  id: number;
  stagiaireId: number;
  coursSessionId: number | null;
  formatriceId: string | null;
  formatriceNom: string | null;

  q1ContenuClair: number;
  q2FormateurExplique: number;
  q3Progression: number;
  q4Accueil: number;
  q5Recommandation: number;
  commentaire: string | null;

  dateReponse: string;
  createdAt: string;
}

export interface SatisfactionFroid {
  id: number;
  stagiaireId: number;

  q1Utilite: number;
  q2ReussiteExamen: 'Oui' | 'Non' | 'Pas encore';
  q3Recommandation: number;
  commentaire: string | null;

  dateEnvoi: string | null;
  dateReponse: string | null;
  mailEnvoye: boolean;

  createdAt: string;
}

export interface Reclamation {
  id: number;
  stagiaireId: number | null;
  objet: string;
  description: string;
  statut: ReclamationStatut;
  reponse: string | null;
  dateReclamation: string;
  dateResolution: string | null;
  traitePar: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface QcmQuestion {
  id: number;
  typeCompetence: 'CE' | 'CO';
  niveau: NiveauLangue;
  question: string;
  choix: string[];
  reponseCorrecte: string;
  mediaUrl: string | null;
  points: number;
  actif: boolean;
  ordre: number;
  createdAt: string;
}

// Stats formation
export interface FormationStats {
  totalStagiaires: number;
  enFormation: number;
  terminees: number;
  abandonnees: number;
  tauxSatisfaction: number; // Moyenne globale satisfaction à chaud
  tauxReussite: number; // % ayant atteint le niveau visé
  tauxAbandon: number;
  parAgence: Record<Agence, number>;
}

// Filtre stagiaires formation
export interface StagiaireFormationFilters {
  search: string;
  statut: StagiaireStatut | 'all';
  agence: Agence | 'all';
  commerciale: string | 'all';
  formatrice: string | 'all';
}
