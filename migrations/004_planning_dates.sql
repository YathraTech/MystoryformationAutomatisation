-- =============================================
-- MIGRATION: Ajout des dates planifiées pour le planning
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajouter la date planifiée pour les formations (inscriptions)
ALTER TABLE public.inscriptions
ADD COLUMN IF NOT EXISTS date_formation DATE,
ADD COLUMN IF NOT EXISTS heure_formation TIME;

CREATE INDEX idx_inscriptions_date_formation ON public.inscriptions (date_formation);

-- Ajouter la date planifiée pour les examens
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS date_examen DATE,
ADD COLUMN IF NOT EXISTS heure_examen TIME;

CREATE INDEX idx_examens_date_examen ON public.examens (date_examen);
