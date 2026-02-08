import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type LoginData = z.infer<typeof loginSchema>;
