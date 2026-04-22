-- ============================================================
-- Migration 039: Détails scolarisation (où + quand) dans les
-- évaluations, en remplacement de l'entrée booléenne alphabétisation.
-- ============================================================
-- Ces deux colonnes texte remplacent la ligne "Alphabétisation OUI/NON"
-- dans la section FORMATION de la fiche évaluation initiale.
-- La colonne `alphabetisation` existante reste en place pour
-- compatibilité ascendante (elle n'est plus remplie par l'UI).

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS scolarisation_ou TEXT,
  ADD COLUMN IF NOT EXISTS scolarisation_quand TEXT;
