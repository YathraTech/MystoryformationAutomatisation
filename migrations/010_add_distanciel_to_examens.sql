-- =============================================
-- MIGRATION: Ajouter le champ distanciel aux examens
-- Pour indiquer si l'inscription a été faite à distance ou en présentiel
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajouter la colonne distanciel (false = présentiel par défaut)
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS distanciel BOOLEAN DEFAULT false;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.examens.distanciel IS 'true = inscription à distance, false = inscription en présentiel';
