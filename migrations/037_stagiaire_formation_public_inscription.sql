-- ============================================================
-- Migration 037: Permettre la création d'un stagiaire_formation
-- depuis l'inscription publique (sans collecter tous les champs)
-- ============================================================
-- Les champs suivants sont rendus nullables car ils ne sont pas
-- collectés sur le formulaire public. L'admin les complète plus
-- tard depuis la fiche stagiaire.
-- Les CHECK existants passent sur NULL (NULL est "unknown" en SQL).

ALTER TABLE stagiaires_formation ALTER COLUMN nationalite DROP NOT NULL;
ALTER TABLE stagiaires_formation ALTER COLUMN numero_piece_identite DROP NOT NULL;
ALTER TABLE stagiaires_formation ALTER COLUMN type_piece DROP NOT NULL;
ALTER TABLE stagiaires_formation ALTER COLUMN agence DROP NOT NULL;
