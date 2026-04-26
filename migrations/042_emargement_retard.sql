-- ============================================================
-- Migration 042: Statut "retard" sur les émargements
-- ============================================================
-- Ajoute un flag retard à la table emargements pour distinguer
-- les présences ponctuelles des présences en retard. Combiné avec
-- present et justificatif_recu, on couvre les 4 états saisis sur
-- la page Émargement du jour :
--   présent             → present=true,  retard=false
--   retard              → present=true,  retard=true
--   absent              → present=false, justificatif_recu=false
--   absent justifié     → present=false, justificatif_recu=true

ALTER TABLE emargements
  ADD COLUMN IF NOT EXISTS retard BOOLEAN NOT NULL DEFAULT false;
