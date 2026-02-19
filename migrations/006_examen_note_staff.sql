-- =============================================
-- MIGRATION: Ajout de la note staff pour les examens
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajouter la colonne note_staff à la table examens
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS note_staff TEXT;

-- Cette colonne contiendra des notes automatiques pour le staff
-- Ex: "⚠️ Ce client a déjà un autre examen prévu : Diplôme A2 (15 mars 2026)"
