-- =============================================
-- MIGRATION: Ajout du champ remises pour les examens
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajouter la colonne remises à la table examens
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS remises TEXT;

-- Cette colonne contient des notes internes sur les remises appliquées
-- Ex: "Remise fidélité -10%", "Offre spéciale nouveau client"
