-- Migration 023: Feuille d'appel
-- Ajouter 'absent' au check constraint resultat
-- Ajouter colonne resultat_email_sent pour le cron d'envoi

ALTER TABLE examens DROP CONSTRAINT IF EXISTS examens_resultat_check;
ALTER TABLE examens ADD CONSTRAINT examens_resultat_check
  CHECK (resultat IN ('a_venir', 'reussi', 'echoue', 'absent'));

ALTER TABLE examens ADD COLUMN IF NOT EXISTS resultat_email_sent BOOLEAN DEFAULT false;
