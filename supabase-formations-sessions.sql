-- =============================================
-- NOUVELLES TABLES : formations, sessions, session_defaults
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- =============================================
-- TABLE: formations
-- =============================================
CREATE TABLE public.formations (
  id                TEXT PRIMARY KEY,
  nom               TEXT NOT NULL,
  langue            TEXT NOT NULL,
  niveau            TEXT NOT NULL,
  duree_heures      INTEGER NOT NULL,
  prix              NUMERIC(10, 2) NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  eligible_cpf      BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_formations_langue ON public.formations (langue);

-- =============================================
-- TABLE: sessions
-- =============================================
CREATE TABLE public.sessions (
  id                    TEXT PRIMARY KEY,
  formation_id          TEXT NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  date_debut            DATE NOT NULL,
  date_fin              DATE NOT NULL,
  horaires              TEXT NOT NULL,
  jours                 TEXT[] NOT NULL DEFAULT '{}',
  lieu                  TEXT NOT NULL,
  places_total          INTEGER NOT NULL,
  places_disponibles    INTEGER NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_places CHECK (places_disponibles <= places_total),
  CONSTRAINT check_dates CHECK (date_fin >= date_debut)
);

CREATE INDEX idx_sessions_formation ON public.sessions (formation_id);
CREATE INDEX idx_sessions_dates ON public.sessions (date_debut, date_fin);

-- =============================================
-- TABLE: session_defaults (single row)
-- =============================================
CREATE TABLE public.session_defaults (
  id                SERIAL PRIMARY KEY,
  jours             TEXT[] NOT NULL DEFAULT '{}',
  horaires          TEXT NOT NULL DEFAULT '9h00 - 12h00',
  lieu              TEXT NOT NULL DEFAULT '',
  places_total      INTEGER NOT NULL DEFAULT 12,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default values
INSERT INTO public.session_defaults (jours, horaires, lieu, places_total)
VALUES (
  ARRAY['lundi', 'mercredi', 'vendredi']::TEXT[],
  '9h00 - 12h00',
  'Paris - Centre (75001)',
  12
);

-- =============================================
-- TRIGGER: auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_defaults_updated_at
  BEFORE UPDATE ON public.session_defaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS: formations
-- =============================================
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_formations"
  ON public.formations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_formations"
  ON public.formations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_formations"
  ON public.formations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_formations"
  ON public.formations FOR DELETE TO authenticated USING (true);
CREATE POLICY "anon_select_formations"
  ON public.formations FOR SELECT TO anon USING (true);

-- =============================================
-- RLS: sessions
-- =============================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_sessions"
  ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sessions"
  ON public.sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sessions"
  ON public.sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sessions"
  ON public.sessions FOR DELETE TO authenticated USING (true);
CREATE POLICY "anon_select_sessions"
  ON public.sessions FOR SELECT TO anon USING (true);

-- =============================================
-- RLS: session_defaults
-- =============================================
ALTER TABLE public.session_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_session_defaults"
  ON public.session_defaults FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_session_defaults"
  ON public.session_defaults FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- SEED: formations de base
-- =============================================
INSERT INTO public.formations (id, nom, langue, niveau, duree_heures, prix, description, eligible_cpf) VALUES
('fr-debutant-30h', 'Français Débutant - 30h', 'Francais', 'Debutant', 30, 1500, 'Formation complète pour grands débutants. Apprentissage des bases de la langue française.', true),
('fr-debutant-60h', 'Français Débutant Intensif - 60h', 'Francais', 'Debutant', 60, 2800, 'Formation intensive pour débutants avec mise en pratique approfondie.', true),
('fr-intermediaire-40h', 'Français Intermédiaire - 40h', 'Francais', 'Intermediaire', 40, 2000, 'Perfectionnement pour niveau intermédiaire. Consolidation des acquis.', true),
('fr-avance-30h', 'Français Avancé - 30h', 'Francais', 'Avance', 30, 1800, 'Formation avancée pour maîtriser les subtilités de la langue.', true),
('fr-pro-20h', 'Français Professionnel - 20h', 'Francais', 'Intermediaire', 20, 1200, 'Français des affaires et communication professionnelle.', true);

-- =============================================
-- SEED: sessions de base
-- =============================================
INSERT INTO public.sessions (id, formation_id, date_debut, date_fin, horaires, jours, lieu, places_total, places_disponibles) VALUES
('sess-001', 'fr-debutant-30h', '2025-03-15', '2025-04-30', '9h00 - 12h00', ARRAY['lundi','mercredi','vendredi'], 'Paris - Centre (75001)', 12, 8),
('sess-002', 'fr-debutant-30h', '2025-04-01', '2025-05-15', '14h00 - 17h00', ARRAY['mardi','jeudi'], 'Paris - Bastille (75011)', 10, 5),
('sess-003', 'fr-debutant-60h', '2025-03-20', '2025-05-30', '9h00 - 12h00', ARRAY['lundi','mardi','mercredi','jeudi','vendredi'], 'Paris - Centre (75001)', 8, 3),
('sess-004', 'fr-intermediaire-40h', '2025-04-10', '2025-06-10', '18h00 - 21h00', ARRAY['mardi','jeudi'], 'Distanciel (Zoom)', 15, 12),
('sess-005', 'fr-avance-30h', '2025-05-01', '2025-06-15', '9h00 - 12h00', ARRAY['samedi'], 'Paris - Opéra (75009)', 10, 7),
('sess-006', 'fr-pro-20h', '2025-04-15', '2025-05-15', '12h30 - 14h00', ARRAY['lundi','mercredi','vendredi'], 'Paris - La Défense (92)', 8, 6);
