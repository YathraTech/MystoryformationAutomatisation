-- ============================================================
-- Migration 040: Ajout colonne besoins_specifiques à evaluations
-- ============================================================
-- Champ texte libre rempli depuis la fiche évaluation initiale,
-- placé juste avant la grille "RÉSULTATS ÉVALUATION".

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS besoins_specifiques TEXT;
