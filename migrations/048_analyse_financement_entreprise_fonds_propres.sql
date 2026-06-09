-- ============================================================
-- Migration 048: Mode de financement (analyse de besoin)
-- ------------------------------------------------------------
-- - Remplace 'Mixte' par 'Entreprise' dans les options autorisées.
-- - Migre les enregistrements existants 'Mixte' -> 'Entreprise'.
-- - Ajoute, pour le financement 'Fonds propres', le détail du règlement :
--   montant payé en carte et montant payé en espèces.
-- À exécuter dans Supabase SQL Editor.
--
-- IMPORTANT : on supprime d'abord l'ancienne contrainte CHECK, SINON
-- l'UPDATE vers 'Entreprise' est rejeté par l'ancienne contrainte
-- (qui n'autorise que CPF / Fonds propres / Mixte).
-- ============================================================

BEGIN;

-- 1) Supprimer l'ancienne contrainte CHECK
ALTER TABLE analyses_besoin DROP CONSTRAINT IF EXISTS analyses_besoin_mode_financement_check;

-- 2) Migrer les données existantes
UPDATE analyses_besoin SET mode_financement = 'Entreprise' WHERE mode_financement = 'Mixte';

-- 3) Recréer la contrainte CHECK avec les nouvelles valeurs
ALTER TABLE analyses_besoin
  ADD CONSTRAINT analyses_besoin_mode_financement_check
  CHECK (mode_financement IN ('CPF', 'Fonds propres', 'Entreprise'));

-- 4) Détail du règlement en fonds propres
ALTER TABLE analyses_besoin ADD COLUMN IF NOT EXISTS fonds_propres_carte NUMERIC(10,2);
ALTER TABLE analyses_besoin ADD COLUMN IF NOT EXISTS fonds_propres_especes NUMERIC(10,2);

COMMIT;
