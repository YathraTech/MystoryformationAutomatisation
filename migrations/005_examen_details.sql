-- =============================================
-- MIGRATION: Ajout des détails d'examen
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajouter les nouvelles colonnes à la table examens
-- Note: formateur_id est un UUID qui référence profiles(id)
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS prix NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS moyen_paiement VARCHAR(50),
ADD COLUMN IF NOT EXISTS formateur_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS type_examen VARCHAR(50),
ADD COLUMN IF NOT EXISTS lieu VARCHAR(255);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_examens_formateur ON public.examens (formateur_id);
CREATE INDEX IF NOT EXISTS idx_examens_type ON public.examens (type_examen);
