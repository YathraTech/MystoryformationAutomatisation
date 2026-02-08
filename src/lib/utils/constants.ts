// === CIVILITÉS ===
export const CIVILITES = [
  { value: 'M.', label: 'Monsieur' },
  { value: 'Mme', label: 'Madame' },
  { value: 'Autre', label: 'Autre' },
] as const;

// === MODES DE FINANCEMENT ===
export const MODES_FINANCEMENT = [
  { value: 'CPF', label: 'CPF (Compte Personnel de Formation)' },
  { value: 'Personnel', label: 'Financement personnel' },
  { value: 'Entreprise', label: 'Financement entreprise' },
  { value: 'PoleEmploi', label: 'Pôle Emploi' },
  { value: 'Autre', label: 'Autre' },
] as const;

// === LANGUES ===
export const LANGUES = [
  { value: 'Francais', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Allemand', label: 'Allemand' },
  { value: 'Italien', label: 'Italien' },
] as const;

// === NIVEAUX ===
export const NIVEAUX = [
  { value: 'Debutant', label: 'Débutant (A1)' },
  { value: 'FauxDebutant', label: 'Faux-débutant (A2)' },
  { value: 'Intermediaire', label: 'Intermédiaire (B1-B2)' },
  { value: 'Avance', label: 'Avancé (C1-C2)' },
] as const;

// === OBJECTIFS ===
export const OBJECTIFS = [
  { value: 'Professionnel', label: 'Usage professionnel' },
  { value: 'Personnel', label: 'Enrichissement personnel' },
  { value: 'Voyage', label: 'Voyage / Tourisme' },
  { value: 'Certification', label: 'Préparation certification' },
] as const;

// === JOURS ===
export const JOURS_SEMAINE = [
  { value: 'lundi', label: 'Lundi' },
  { value: 'mardi', label: 'Mardi' },
  { value: 'mercredi', label: 'Mercredi' },
  { value: 'jeudi', label: 'Jeudi' },
  { value: 'vendredi', label: 'Vendredi' },
  { value: 'samedi', label: 'Samedi' },
] as const;

// === CRÉNEAUX HORAIRES ===
export const CRENEAUX_HORAIRES = [
  { value: 'matin', label: 'Matin (9h00 - 12h00)' },
  { value: 'apres_midi', label: 'Après-midi (14h00 - 17h00)' },
  { value: 'soir', label: 'Soir (18h00 - 21h00)' },
] as const;

// === ÉTAPES DU FORMULAIRE ===
export const FORM_STEPS = [
  { number: 1, title: 'Informations personnelles', shortTitle: 'Identité' },
  { number: 2, title: 'Informations CPF', shortTitle: 'CPF' },
  { number: 3, title: 'Choix de formation', shortTitle: 'Formation' },
  { number: 4, title: 'Disponibilités', shortTitle: 'Planning' },
  { number: 5, title: 'Récapitulatif', shortTitle: 'Validation' },
] as const;