-- ============================================================
-- Migration 046: Score global = MOYENNE sur 20 (et non somme sur 80)
-- ------------------------------------------------------------
-- score_global devient la moyenne des 4 épreuves (CE, CO, EE, EO) sur /20.
-- Niveau estimé recalibré sur /20 :
--   0 à 5   -> A1
--   5 à 10  -> A2
--   10 à 15 -> B1
--   15 à 20 -> B2
-- (bornes incluses dans le niveau supérieur : 5->A2, 10->B1, 15->B2)
-- Les colonnes sont GENERATED : on les supprime puis on les recrée.
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

ALTER TABLE tests_formation DROP COLUMN IF EXISTS score_global;
ALTER TABLE tests_formation DROP COLUMN IF EXISTS niveau_estime;

-- Moyenne sur 20, arrondie à 0,1
ALTER TABLE tests_formation
  ADD COLUMN score_global NUMERIC(4,1)
  GENERATED ALWAYS AS (ROUND((score_ce + score_co + score_ee + score_eo) / 4.0, 1)) STORED;

-- Niveau estimé recalibré sur la moyenne /20
ALTER TABLE tests_formation
  ADD COLUMN niveau_estime TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (score_ce + score_co + score_ee + score_eo) / 4.0 >= 15 THEN 'B2'
      WHEN (score_ce + score_co + score_ee + score_eo) / 4.0 >= 10 THEN 'B1'
      WHEN (score_ce + score_co + score_ee + score_eo) / 4.0 >= 5  THEN 'A2'
      ELSE 'A1'
    END
  ) STORED;
