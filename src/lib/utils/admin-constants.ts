import type { InscriptionStatus, BadgeKey, BadgeColor } from '@/types/admin';

export const INSCRIPTION_STATUSES: {
  value: InscriptionStatus;
  label: string;
  color: string;
}[] = [
  { value: 'En attente', label: 'En attente', color: 'amber' },
  { value: 'Validee', label: 'Validée', color: 'green' },
  { value: 'Refusee', label: 'Refusée', color: 'red' },
  { value: 'Archivee', label: 'Archivée', color: 'slate' },
];

export const BADGE_DEFINITIONS: {
  key: BadgeKey;
  label: string;
  defaultColor: BadgeColor;
}[] = [
  { key: 'badgeContacte', label: 'Contacté', defaultColor: 'orange' },
  { key: 'badgePaye', label: 'Payé', defaultColor: 'red' },
  { key: 'badgeDossier', label: 'Dossier', defaultColor: 'red' },
];

export const BADGE_CYCLE: Record<BadgeColor, BadgeColor> = {
  red: 'orange',
  orange: 'green',
  green: 'red',
};

// Maps Google Sheet header names to Inscription object keys
export const SHEET_COLUMN_MAP: Record<string, keyof import('@/types/admin').Inscription> = {
  'ID': 'rowIndex',
  'Date': 'timestamp',
  'Civilité': 'civilite',
  'Nom': 'nom',
  'Prénom': 'prenom',
  'Email': 'email',
  'Téléphone': 'telephone',
  'Date naissance': 'dateNaissance',
  'Adresse': 'adresse',
  'Code postal': 'codePostal',
  'Ville': 'ville',
  'N° CPF': 'numeroCPF',
  'N° Sécu': 'numeroSecuriteSociale',
  'Financement': 'modeFinancement',
  'Langue': 'langue',
  'Niveau': 'niveauActuel',
  'Objectif': 'objectif',
  'Formation ID': 'formationId',
  'Formation': 'formationNom',
  'Durée': 'formationDuree',
  'Prix': 'formationPrix',
  'Jours dispo': 'joursDisponibles',
  'Créneaux': 'creneauxHoraires',
  'Date début souhaitée': 'dateDebutSouhaitee',
  'Commentaires': 'commentaires',
  'Statut': 'statut',
  'Relance date': 'relanceDate',
  'Relance note': 'relanceNote',
  'Badge Contacté': 'badgeContacte',
  'Badge Payé': 'badgePaye',
  'Badge Dossier': 'badgeDossier',
};

export const ITEMS_PER_PAGE = 20;
