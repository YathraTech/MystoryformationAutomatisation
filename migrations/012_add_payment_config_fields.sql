-- =============================================
-- MIGRATION: Ajouter date de paiement et lieu de configuration
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajouter les nouvelles colonnes à la table examens
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS date_paiement DATE,
ADD COLUMN IF NOT EXISTS lieu_configuration VARCHAR(50);

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.examens.date_paiement IS 'Date du paiement effectué';
COMMENT ON COLUMN public.examens.lieu_configuration IS 'Lieu où la configuration a été faite: Gagny ou Sarcelles';
