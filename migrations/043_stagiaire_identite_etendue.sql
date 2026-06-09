-- =============================================
-- MIGRATION 043 : Identité étendue + jeton d'upload pour stagiaires_formation
-- À exécuter dans Supabase SQL Editor
-- =============================================
-- Aligne l'étape "identité" du formulaire d'inscription FORMATION sur celle de
-- l'EXAMEN : on ajoute les champs lieu/langue de naissance manquants, et un jeton
-- d'upload non devinable pour permettre l'envoi public des pièces d'identité.
--
-- Champs déjà présents (migration 033) : nationalite, type_piece,
-- numero_piece_identite, photo_piece_identite (TEXT[]).
-- =============================================

ALTER TABLE public.stagiaires_formation
  ADD COLUMN IF NOT EXISTS ville_naissance   TEXT,
  ADD COLUMN IF NOT EXISTS pays_naissance    TEXT,
  ADD COLUMN IF NOT EXISTS langue_maternelle TEXT,
  ADD COLUMN IF NOT EXISTS upload_token      UUID DEFAULT gen_random_uuid();

-- Renseigner le jeton pour les lignes existantes éventuelles
UPDATE public.stagiaires_formation
SET upload_token = gen_random_uuid()
WHERE upload_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_stagiaires_upload_token
  ON public.stagiaires_formation (upload_token);
