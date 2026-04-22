-- ============================================================
-- Migration 041: Flag mail satisfaction à chaud envoyé
-- ============================================================
-- Utilisé par le cron qui envoie automatiquement le questionnaire
-- de satisfaction aux stagiaires à qui il reste moins de 6h de
-- formation. Le mail n'est envoyé qu'une seule fois par stagiaire.

ALTER TABLE stagiaires_formation
  ADD COLUMN IF NOT EXISTS mail_satisfaction_chaud_envoye BOOLEAN NOT NULL DEFAULT false;
