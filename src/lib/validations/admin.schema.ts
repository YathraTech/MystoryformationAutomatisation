import { z } from 'zod';

export const statusUpdateSchema = z.object({
  statut: z.enum(['En attente', 'Validee', 'Refusee', 'Archivee']),
});

export const badgeUpdateSchema = z.object({
  badge: z.enum(['badgeContacte', 'badgePaye', 'badgeDossier']),
  color: z.enum(['red', 'orange', 'green']),
});

export const relanceSchema = z.object({
  note: z
    .string()
    .max(500, 'La note ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
});

export type StatusUpdateData = z.infer<typeof statusUpdateSchema>;
export type BadgeUpdateData = z.infer<typeof badgeUpdateSchema>;
export type RelanceData = z.infer<typeof relanceSchema>;

// === FORMATIONS ===
export const formationCreateSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  nom: z.string().min(1).max(200),
  langue: z.string().min(1),
  niveau: z.string().min(1),
  dureeHeures: z.number().int().min(1).max(500),
  prix: z.number().min(0).max(99999),
  description: z.string().max(1000).optional().or(z.literal('')),
  eligibleCpf: z.boolean(),
});

export const formationUpdateSchema = z.object({
  nom: z.string().min(1).max(200).optional(),
  langue: z.string().min(1).optional(),
  niveau: z.string().min(1).optional(),
  dureeHeures: z.number().int().min(1).max(500).optional(),
  prix: z.number().min(0).max(99999).optional(),
  description: z.string().max(1000).optional(),
  eligibleCpf: z.boolean().optional(),
});

// === SESSIONS ===
export const sessionCreateSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  formationId: z.string().min(1),
  dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaires: z.string().min(1).max(100),
  jours: z.array(z.string()).min(1),
  lieu: z.string().min(1).max(200),
  placesTotal: z.number().int().min(1).max(100),
  placesDisponibles: z.number().int().min(0).max(100),
});

export const sessionUpdateSchema = z.object({
  formationId: z.string().min(1).optional(),
  dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horaires: z.string().min(1).max(100).optional(),
  jours: z.array(z.string()).min(1).optional(),
  lieu: z.string().min(1).max(200).optional(),
  placesTotal: z.number().int().min(1).max(100).optional(),
  placesDisponibles: z.number().int().min(0).max(100).optional(),
});

// === SESSION DEFAULTS ===
export const sessionDefaultsUpdateSchema = z.object({
  jours: z.array(z.string()).min(1),
  horaires: z.string().min(1).max(100),
  lieu: z.string().min(1).max(200),
  placesTotal: z.number().int().min(1).max(100),
});
