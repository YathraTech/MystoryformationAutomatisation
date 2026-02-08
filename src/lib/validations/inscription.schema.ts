import { z } from 'zod';

// === REGEX ===
const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
const postalCodeRegex = /^\d{5}$/;
const cpfRegex = /^\d{14,15}$/;
const secuRegex = /^\d{15}$/;

// === ÉTAPE 1 : Informations Personnelles ===
export const personalInfoSchema = z.object({
  civilite: z.enum(['M.', 'Mme', 'Autre'], {
    message: 'Veuillez sélectionner une civilité',
  }),
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom contient des caractères invalides'),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Adresse email invalide'),
  telephone: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .regex(phoneRegex, 'Numéro de téléphone invalide (format: 06 12 34 56 78)'),
  dateNaissance: z
    .string()
    .min(1, 'La date de naissance est requise')
    .refine((date) => {
      const birth = new Date(date);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 16;
    }, 'Vous devez avoir au moins 16 ans'),
  adresse: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères"),
  codePostal: z
    .string()
    .min(1, 'Le code postal est requis')
    .regex(postalCodeRegex, 'Code postal invalide (5 chiffres)'),
  ville: z
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(100, 'La ville ne peut pas dépasser 100 caractères'),
});

// === ÉTAPE 2 : Informations CPF ===
export const cpfInfoSchema = z.object({
  numeroCPF: z
    .string()
    .optional()
    .refine(
      (val) => !val || cpfRegex.test(val.replace(/\s/g, '')),
      'Numéro CPF invalide (14 ou 15 chiffres)'
    ),
  numeroSecuriteSociale: z
    .string()
    .optional()
    .refine(
      (val) => !val || secuRegex.test(val.replace(/\s/g, '')),
      'Numéro de sécurité sociale invalide (15 chiffres)'
    ),
  modeFinancement: z.enum(
    ['CPF', 'Personnel', 'Entreprise', 'PoleEmploi', 'Autre'],
    { message: 'Veuillez sélectionner un mode de financement' }
  ),
});

// === ÉTAPE 3 : Choix Formation ===
export const formationChoiceSchema = z.object({
  langue: z
    .string()
    .min(1, 'Veuillez sélectionner une langue'),
  niveauActuel: z.enum(
    ['Debutant', 'FauxDebutant', 'Intermediaire', 'Avance'],
    { message: 'Veuillez sélectionner votre niveau actuel' }
  ),
  objectif: z.enum(
    ['Professionnel', 'Personnel', 'Voyage', 'Certification'],
    { message: 'Veuillez sélectionner un objectif' }
  ),
  formationId: z
    .string()
    .min(1, 'Veuillez sélectionner une formation'),
});

// === ÉTAPE 4 : Disponibilités ===
export const disponibilitesSchema = z.object({
  joursDisponibles: z
    .array(z.string())
    .min(1, 'Veuillez sélectionner au moins un jour'),
  creneauxHoraires: z
    .array(z.string())
    .min(1, 'Veuillez sélectionner au moins un créneau horaire'),
  dateDebutSouhaitee: z
    .string()
    .min(1, 'Veuillez sélectionner une date')
    .refine((date) => {
      const selected = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected > today;
    }, 'La date doit être dans le futur'),
  commentaires: z
    .string()
    .max(500, 'Les commentaires ne peuvent pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
});

// === ÉTAPE 5 : Consentements ===
export const consentementSchema = z.object({
  acceptCGU: z
    .boolean()
    .refine((val) => val === true, 'Vous devez accepter les conditions générales'),
  acceptRGPD: z
    .boolean()
    .refine((val) => val === true, 'Vous devez accepter le traitement des données'),
});

// === SCHÉMA COMPLET ===
export const inscriptionCompleteSchema = personalInfoSchema
  .merge(cpfInfoSchema)
  .merge(formationChoiceSchema)
  .merge(disponibilitesSchema)
  .merge(consentementSchema);

// === TYPES EXPORTÉS ===
export type PersonalInfoData = z.infer<typeof personalInfoSchema>;
export type CPFInfoData = z.infer<typeof cpfInfoSchema>;
export type FormationChoiceData = z.infer<typeof formationChoiceSchema>;
export type DisponibilitesData = z.infer<typeof disponibilitesSchema>;
export type ConsentementData = z.infer<typeof consentementSchema>;
export type InscriptionCompleteData = z.infer<typeof inscriptionCompleteSchema>;

// Schémas par étape pour validation progressive
export const stepSchemas = [
  personalInfoSchema,
  cpfInfoSchema,
  formationChoiceSchema,
  disponibilitesSchema,
  consentementSchema,
] as const;
