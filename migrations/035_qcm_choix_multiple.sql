-- ============================================================
-- Migration 035: Ajout choix multiple aux questions QCM
-- ============================================================

-- Ajouter le champ choix_multiple (false = une seule bonne réponse, true = plusieurs bonnes réponses)
ALTER TABLE qcm_questions ADD COLUMN IF NOT EXISTS choix_multiple BOOLEAN DEFAULT false;

-- Transformer reponse_correcte en tableau pour supporter plusieurs bonnes réponses
-- On garde reponse_correcte (TEXT) pour compatibilité, et on ajoute reponses_correctes (TEXT[])
ALTER TABLE qcm_questions ADD COLUMN IF NOT EXISTS reponses_correctes TEXT[] DEFAULT '{}';
