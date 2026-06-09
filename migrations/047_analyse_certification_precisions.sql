-- ============================================================
-- Migration 047: Précisions sur la certification visée (analyse de besoin)
-- ------------------------------------------------------------
-- Champ texte libre permettant d'ajouter des détails à la certification
-- visée (ex: session, niveau ciblé, modalités...). Le format structuré
-- définitif reste à préciser (à confirmer avec Aaru) ; en attendant, ce
-- champ libre évite de bloquer la saisie.
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

ALTER TABLE analyses_besoin
  ADD COLUMN IF NOT EXISTS certification_visee_precisions TEXT;
