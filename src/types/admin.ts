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
  commentaires: string;
  statut: InscriptionStatus;
  relanceDate: string;
  relanceNote: string;
  badgeContacte: BadgeColor;
  badgePaye: BadgeColor;
  badgeDossier: BadgeColor;
}

export interface DashboardStats {
  totalInscriptions: number;
  byStatus: Record<InscriptionStatus, number>;
  byFormation: { formation: string; count: number }[];
  byMonth: { month: string; count: number }[];
  recentInscriptions: Inscription[];
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
