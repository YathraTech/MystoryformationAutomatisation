import { z } from 'zod';

// === REGEX ===
const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;

// ============================================================
// ÉTAPE 1 — Fiche Client Formation
// ============================================================
export const ficheClientFormationSchema = z.object({
  civilite: z.enum(['M.', 'Mme'], {
    message: 'Veuillez sélectionner une civilité',
  }),
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100)
    .regex(nameRegex, 'Le nom contient des caractères invalides'),
  nomJeuneFille: z.string().max(100).optional().or(z.literal('')),
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100)
    .regex(nameRegex, 'Le prénom contient des caractères invalides'),
  dateNaissance: z.string().min(1, 'La date de naissance est requise'),
  nationalite: z.string().min(2, 'La nationalité est requise'),
  telephone: z
    .string()
    .min(1, 'Le téléphone est requis')
    .regex(phoneRegex, 'Numéro de téléphone invalide'),
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
  adressePostale: z.string().min(5, "L'adresse est requise"),
  numeroPieceIdentite: z.string().min(1, 'Le numéro de pièce est requis'),
  typePiece: z.enum(['Passeport', 'CNI', 'Titre de séjour'], {
    message: 'Veuillez sélectionner un type de pièce',
  }),
  agence: z.enum(['Gagny', 'Sarcelles', 'Rosny'], {
    message: 'Veuillez sélectionner une agence',
  }),
  commercialeId: z.string().optional(),
  sourceProvenance: z
    .enum([
      'Appel',
      'WhatsApp',
      'CPF',
      'Site',
      'Bouche-à-oreille',
      'Réseau social',
      'Partenaire',
    ])
    .optional(),
  typePrestation: z.enum(
    [
      'Formation TEF IRN',
      'Examen TEF IRN',
      'Examen civique',
      'Pack TEF+Civique',
      'Pack complet',
    ],
    { message: 'Veuillez sélectionner un type de prestation' }
  ),
});

// ============================================================
// ÉTAPE 2 — Test Initial / Final
// ============================================================
export const testFormationSchema = z.object({
  typeTest: z.enum(['initial', 'final']),
  dateTest: z.string().min(1, 'La date du test est requise'),
  scoreCe: z
    .number()
    .min(0, 'Min 0')
    .max(20, 'Max 20'),
  scoreCo: z
    .number()
    .min(0, 'Min 0')
    .max(20, 'Max 20'),
  scoreEe: z
    .number()
    .min(0, 'Min 0')
    .max(20, 'Max 20'),
  scoreEo: z
    .number()
    .min(0, 'Min 0')
    .max(20, 'Max 20'),
  profilPedagogique: z.enum(['Alphabétisation', 'FLE'], {
    message: 'Veuillez sélectionner un profil',
  }),
});

// ============================================================
// ÉTAPE 3 — Analyse de Besoin
// ============================================================
export const analyseBesoinSchema = z.object({
  objectifFormation: z
    .array(z.string())
    .min(1, 'Sélectionnez au moins un objectif'),
  niveauEstime: z.string().optional(),
  methodePositionnement: z.enum(['Test', 'Attestation de niveau', 'Autre'], {
    message: 'Veuillez sélectionner une méthode',
  }),

  situationProfessionnelle: z.enum(
    [
      'Salarié',
      'Demandeur d\'emploi',
      'Indépendant',
      'Étudiant',
      'Retraité',
      'Sans activité',
      'Chef d\'entreprise',
      'Autre',
    ],
    { message: 'Veuillez sélectionner une situation' }
  ),
  disponibilites: z
    .array(z.string())
    .min(1, 'Sélectionnez au moins une disponibilité'),
  situationHandicap: z.boolean(),
  situationHandicapDetail: z.string().optional().or(z.literal('')),

  dureeEstimeeFormation: z.string().min(1, 'La durée est requise'),
  niveauVise: z.enum(['A1', 'A2', 'B1', 'B2'], {
    message: 'Veuillez sélectionner le niveau visé',
  }),
  typeCertificationVisee: z
    .array(z.string())
    .min(1, 'Sélectionnez au moins une certification'),
  modeFinancement: z.enum(['CPF', 'Fonds propres', 'Mixte'], {
    message: 'Veuillez sélectionner un mode de financement',
  }),
  commentaires: z.string().max(1000).optional().or(z.literal('')),
});

// ============================================================
// ÉTAPE 4 — Évaluation Initiale (recueil d'infos)
// ============================================================
export const evaluationInitialeRecueilSchema = z.object({
  scolarisationFrance: z.boolean().optional(),
  scolarisationEtranger: z.boolean().optional(),
  alphabetisation: z.boolean().optional(),
  coursFrancais: z.boolean().optional(),
  coursFrancaisDetail: z.string().optional().or(z.literal('')),
  diplomesLangues: z.string().optional().or(z.literal('')),
  anglais: z.boolean().optional(),
  languesParlees: z.string().optional().or(z.literal('')),
  usageOrdinateur: z.boolean().optional(),
  maitriseClavier: z.boolean().optional(),
  smartphoneTablette: z.boolean().optional(),
  ordinateurMaison: z.boolean().optional(),
  accesInternet: z.boolean().optional(),
  utilisationBoiteMail: z.boolean().optional(),
  sessionOrdinateur: z.boolean().optional(),
  motivation: z.string().min(1, 'Ce champ est requis'),
  apresFormation: z.string().optional().or(z.literal('')),
  besoinsVieQuotidienne: z.number().min(0).max(5).optional(),
  besoinsVieProfessionnelle: z.number().min(0).max(5).optional(),
  certificationVisee: z.boolean(),
  certificationViseeDetail: z.string().optional().or(z.literal('')),
});

// ============================================================
// ÉTAPE 5 — Inscription + Paiement
// ============================================================
export const inscriptionPaiementSchema = z.object({
  modePaiement: z.enum(['CB', 'Espèces', 'Virement', 'CPF', 'Mixte'], {
    message: 'Veuillez sélectionner un mode de paiement',
  }),
  montantTotal: z.number().min(0, 'Le montant doit être positif'),
  paiementPlusieursFois: z.boolean(),
  nombreEcheances: z.number().optional(),
  numeroDossierCpf: z.string().optional().or(z.literal('')),
  statutPaiement: z.enum(['Payé', 'En attente', 'Partiel', 'Impayé']),
});

// ============================================================
// ÉTAPE 7 — Désignation formatrice + planning
// ============================================================
export const designationSchema = z.object({
  formatriceId: z.string().min(1, 'Veuillez sélectionner une formatrice'),
  agence: z.enum(['Gagny', 'Sarcelles', 'Rosny']),
  joursFormation: z
    .array(z.string())
    .min(1, 'Sélectionnez au moins un jour'),
  horairesFormation: z.string().min(1, 'Veuillez sélectionner un horaire'),
  heuresPrevues: z.number().min(1, 'Le nombre d\'heures est requis'),
  dateDebutFormation: z.string().min(1, 'La date de début est requise'),
});

// ============================================================
// ÉTAPE 8 — Émargement / Cours
// ============================================================
export const coursSessionSchema = z.object({
  dateCours: z.string().min(1, 'La date du cours est requise'),
  agence: z.enum(['Gagny', 'Sarcelles', 'Rosny']),
  formatriceId: z.string().optional(),
  horaire: z.string().min(1, 'L\'horaire est requis'),
  dureeHeures: z.number().min(0.5).max(12),
  notes: z.string().optional().or(z.literal('')),
});

export const emargementSchema = z.object({
  coursSessionId: z.number(),
  stagiaireId: z.number(),
  present: z.boolean(),
  signatureElectronique: z.string().optional(),
});

// ============================================================
// ÉTAPE 9 — Satisfaction à chaud
// ============================================================
export const satisfactionChaudSchema = z.object({
  stagiaireId: z.number(),
  coursSessionId: z.number().optional(),
  q1ContenuClair: z.number().min(1).max(5),
  q2FormateurExplique: z.number().min(1).max(5),
  q3Progression: z.number().min(1).max(5),
  q4Accueil: z.number().min(1).max(5),
  q5Recommandation: z.number().min(1).max(5),
  commentaire: z.string().max(1000).optional().or(z.literal('')),
});

// ============================================================
// ÉTAPE 14 — Satisfaction à froid
// ============================================================
export const satisfactionFroidSchema = z.object({
  stagiaireId: z.number(),
  q1Utilite: z.number().min(1).max(5),
  q2ReussiteExamen: z.enum(['Oui', 'Non', 'Pas encore']),
  q3Recommandation: z.number().min(1).max(5),
  commentaire: z.string().max(1000).optional().or(z.literal('')),
});

// ============================================================
// Réclamation
// ============================================================
export const reclamationSchema = z.object({
  stagiaireId: z.number().optional(),
  objet: z.string().min(3, 'L\'objet est requis'),
  description: z.string().min(10, 'La description est requise'),
});

// ============================================================
// Types exportés
// ============================================================
export type FicheClientFormationData = z.infer<typeof ficheClientFormationSchema>;
export type TestFormationData = z.infer<typeof testFormationSchema>;
export type AnalyseBesoinData = z.infer<typeof analyseBesoinSchema>;
export type EvaluationInitialeRecueilData = z.infer<typeof evaluationInitialeRecueilSchema>;
export type InscriptionPaiementData = z.infer<typeof inscriptionPaiementSchema>;
export type DesignationData = z.infer<typeof designationSchema>;
export type CoursSessionData = z.infer<typeof coursSessionSchema>;
export type EmargementData = z.infer<typeof emargementSchema>;
export type SatisfactionChaudData = z.infer<typeof satisfactionChaudSchema>;
export type SatisfactionFroidData = z.infer<typeof satisfactionFroidSchema>;
export type ReclamationData = z.infer<typeof reclamationSchema>;
