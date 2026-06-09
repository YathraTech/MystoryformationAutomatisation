-- ============================================================
-- Migration 044: Sujets partagés pour les QCM (CE texte / CO audio)
-- ------------------------------------------------------------
-- Permet de rattacher plusieurs questions QCM à un même "sujet" :
--   - CE : un texte commun à lire (qcm_sujets.contenu)
--   - CO : un audio commun à écouter (qcm_sujets.media_url)
-- Le stagiaire garde le sujet affiché/réécoutable pendant qu'il
-- répond à toutes les questions rattachées.
-- Rétrocompatible : qcm_questions.sujet_id est nullable, les
-- questions sans sujet conservent leur comportement actuel.
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

-- ======================
-- TABLE: qcm_sujets
-- ======================
CREATE TABLE IF NOT EXISTS qcm_sujets (
  id SERIAL PRIMARY KEY,
  type_competence TEXT NOT NULL CHECK (type_competence IN ('CE', 'CO')),
  type_test TEXT NOT NULL DEFAULT 'initial' CHECK (type_test IN ('initial', 'final')),
  niveau TEXT CHECK (niveau IN ('A0', 'A1', 'A2', 'B1', 'B2')),
  titre TEXT NOT NULL,
  contenu TEXT,            -- texte du sujet (CE) ; consigne/transcription éventuelle (CO)
  media_url TEXT,          -- audio partagé (CO)
  ordre INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qcm_sujets_lookup ON qcm_sujets(type_competence, type_test, actif);

-- RLS identique à qcm_questions (migration 033) : accès réservé aux utilisateurs
-- authentifiés. Le test public lit via le client service-role (createAdminClient),
-- qui contourne RLS — donc pas de policy anon nécessaire.
ALTER TABLE qcm_sujets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all qcm_sujets" ON qcm_sujets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- LIEN: qcm_questions.sujet_id
-- ======================
ALTER TABLE qcm_questions
  ADD COLUMN IF NOT EXISTS sujet_id INTEGER REFERENCES qcm_sujets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_qcm_questions_sujet ON qcm_questions(sujet_id);
