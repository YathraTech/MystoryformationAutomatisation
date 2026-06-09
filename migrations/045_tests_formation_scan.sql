-- ============================================================
-- Migration 045: Scan/photo du test papier sur tests_formation
-- ------------------------------------------------------------
-- Permet de joindre un fichier (PNG/JPG/PDF) correspondant au test
-- imprimé/papier passé par le stagiaire, lorsque les scores sont
-- saisis manuellement par l'équipe.
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

ALTER TABLE tests_formation
  ADD COLUMN IF NOT EXISTS scan_url TEXT;
