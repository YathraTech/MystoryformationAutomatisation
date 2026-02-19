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
}

export interface RecentExamen {
  id: number;
  nom: string;
  prenom: string;
  diplome: string | null;
  createdAt: string;
  resultat: 'a_venir' | 'reussi' | 'echoue';
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
  objectifCa: number | null;
  progression: number;
  byMonth?: { mois: string; label: string; montant: number }[];
}

export interface CentreExamenStats {
  totalExamens: number;
  examenTraites: number;
  examenACompleter: number;
  totalInscriptions: number;
}

export interface CentreRevenue {
  centre: string;                     // "Gagny" ou "Sarcelles"
  revenue: RevenueStats;              // CA du centre
  commercialRevenues: CommercialRevenue[]; // CA par commercial de ce centre
  examenStats: CentreExamenStats;     // Stats examens du centre
}

export interface DashboardStats {
  totalInscriptions: number;
  totalExamens: number;
  byStatus: Record<InscriptionStatus, number>;
  byFormation: { formation: string; count: number }[];
  byMonth: { month: string; count: number }[];
  recentInscriptions: Inscription[];
  recentExamens: RecentExamen[];
  examenStats: ExamenStats;
  revenue: RevenueStats;
  userLieu: string | null;
  commercialRevenues: CommercialRevenue[];
  revenueByCentre: CentreRevenue[] | null; // Pour les admins : CA par centre
}

export interface InscriptionFilters {
  search: string;
  status: InscriptionStatus | 'all';
  formation: string | 'all';
  dateFrom: string;
  dateTo: string;
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
