-- =============================================
-- MIGRATION: Ajout du champ motivation aux examens
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajout de la colonne motivation
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS motivation TEXT DEFAULT NULL;

-- Ajout de la colonne motivation_autre pour le texte libre
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS motivation_autre TEXT DEFAULT NULL;
