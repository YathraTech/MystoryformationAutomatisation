-- =============================================
-- MIGRATION: Objectif CA par commercial + attribution CA
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajout de l'objectif CA mensuel sur les profils (en euros)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS objectif_ca NUMERIC(10, 2) DEFAULT NULL;

-- Ajout du commercial_id sur les examens (attribution du CA)
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS commercial_id UUID DEFAULT NULL
REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index pour les lookups par commercial
CREATE INDEX IF NOT EXISTS idx_examens_commercial_id ON public.examens (commercial_id);
