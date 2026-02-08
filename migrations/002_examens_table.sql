-- =============================================
-- MIGRATION: Table des inscriptions aux examens
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Table des inscriptions aux examens
CREATE TABLE IF NOT EXISTS public.examens (
  id                SERIAL PRIMARY KEY,
  token             TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Informations personnelles
  civilite          TEXT NOT NULL,
  nom               TEXT NOT NULL,
  prenom            TEXT NOT NULL,
  email             TEXT NOT NULL,
  telephone         TEXT NOT NULL,
  date_naissance    TEXT NOT NULL,
  adresse           TEXT NOT NULL,
  code_postal       TEXT NOT NULL,
  ville             TEXT NOT NULL,

  -- Choix du diplôme (rempli par le client via le lien)
  diplome           TEXT DEFAULT NULL
                    CHECK (diplome IS NULL OR diplome IN (
                      'A1', 'A2', 'B1', 'B2',
                      'carte_pluriannuelle', 'carte_residence', 'naturalisation'
                    )),
  diplome_choisi_at TIMESTAMPTZ DEFAULT NULL,

  -- Statut
  statut            TEXT NOT NULL DEFAULT 'En attente'
                    CHECK (statut IN ('En attente', 'Diplome choisi', 'Validee', 'Archivee'))
);

CREATE INDEX idx_examens_token ON public.examens (token);
CREATE INDEX idx_examens_email ON public.examens (email);
CREATE INDEX idx_examens_statut ON public.examens (statut);

-- =============================================
-- RLS: examens
-- =============================================
ALTER TABLE public.examens ENABLE ROW LEVEL SECURITY;

-- Authentifiés peuvent tout faire
CREATE POLICY "auth_select_examens"
  ON public.examens FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_examens"
  ON public.examens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_examens"
  ON public.examens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_examens"
  ON public.examens FOR DELETE TO authenticated USING (true);

-- Anon peut lire et mettre à jour par token (pour le formulaire client)
CREATE POLICY "anon_select_examens_by_token"
  ON public.examens FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_examens_diplome"
  ON public.examens FOR UPDATE TO anon
  USING (diplome IS NULL)  -- Seulement si pas encore choisi
  WITH CHECK (diplome IS NOT NULL);  -- Et qu'on ajoute un diplôme
