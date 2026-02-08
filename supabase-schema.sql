-- =============================================
-- TABLE: inscriptions
-- =============================================
CREATE TABLE public.inscriptions (
  id            SERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  timestamp         TEXT NOT NULL DEFAULT '',
  civilite          TEXT NOT NULL DEFAULT '',
  nom               TEXT NOT NULL DEFAULT '',
  prenom            TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL DEFAULT '',
  telephone         TEXT NOT NULL DEFAULT '',
  date_naissance    TEXT NOT NULL DEFAULT '',
  adresse           TEXT NOT NULL DEFAULT '',
  code_postal       TEXT NOT NULL DEFAULT '',
  ville             TEXT NOT NULL DEFAULT '',
  numero_cpf              TEXT NOT NULL DEFAULT '',
  numero_securite_sociale TEXT NOT NULL DEFAULT '',
  mode_financement        TEXT NOT NULL DEFAULT '',
  langue            TEXT NOT NULL DEFAULT '',
  niveau_actuel     TEXT NOT NULL DEFAULT '',
  objectif          TEXT NOT NULL DEFAULT '',
  formation_id      TEXT NOT NULL DEFAULT '',
  formation_nom     TEXT NOT NULL DEFAULT '',
  formation_duree   TEXT NOT NULL DEFAULT '',
  formation_prix    TEXT NOT NULL DEFAULT '',
  session_id            TEXT NOT NULL DEFAULT '',
  session_date_debut    TEXT NOT NULL DEFAULT '',
  session_date_fin      TEXT NOT NULL DEFAULT '',
  session_horaires      TEXT NOT NULL DEFAULT '',
  session_lieu          TEXT NOT NULL DEFAULT '',
  jours_disponibles     TEXT NOT NULL DEFAULT '',
  creneaux_horaires     TEXT NOT NULL DEFAULT '',
  date_debut_souhaitee  TEXT NOT NULL DEFAULT '',
  commentaires          TEXT NOT NULL DEFAULT '',
  statut          TEXT NOT NULL DEFAULT 'En attente'
                  CHECK (statut IN ('En attente', 'Validee', 'Refusee', 'Archivee')),
  relance_date    TEXT NOT NULL DEFAULT '',
  relance_note    TEXT NOT NULL DEFAULT '',
  badge_contacte  TEXT NOT NULL DEFAULT 'orange'
                  CHECK (badge_contacte IN ('red', 'orange', 'green')),
  badge_paye      TEXT NOT NULL DEFAULT 'red'
                  CHECK (badge_paye IN ('red', 'orange', 'green')),
  badge_dossier   TEXT NOT NULL DEFAULT 'red'
                  CHECK (badge_dossier IN ('red', 'orange', 'green'))
);

CREATE INDEX idx_inscriptions_email ON public.inscriptions (email);
CREATE INDEX idx_inscriptions_statut ON public.inscriptions (statut);

-- =============================================
-- TABLE: profiles (linked to auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  nom        TEXT NOT NULL DEFAULT '',
  prenom     TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'staff'
             CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TRIGGER: auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS: inscriptions
-- =============================================
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_inscriptions"
  ON public.inscriptions FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_inscriptions"
  ON public.inscriptions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_inscriptions"
  ON public.inscriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow anon insert for public inscription form
CREATE POLICY "anon_insert_inscriptions"
  ON public.inscriptions FOR INSERT TO anon WITH CHECK (true);

-- =============================================
-- RLS: profiles
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_update_profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

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
-- SEED: migrate existing formations + sessions
-- =============================================
INSERT INTO public.formations (id, nom, langue, niveau, duree_heures, prix, description, eligible_cpf) VALUES
('fr-debutant-30h', 'Français Débutant - 30h', 'Francais', 'Debutant', 30, 1500, 'Formation complète pour grands débutants. Apprentissage des bases de la langue française.', true),
('fr-debutant-60h', 'Français Débutant Intensif - 60h', 'Francais', 'Debutant', 60, 2800, 'Formation intensive pour débutants avec mise en pratique approfondie.', true),
('fr-intermediaire-40h', 'Français Intermédiaire - 40h', 'Francais', 'Intermediaire', 40, 2000, 'Perfectionnement pour niveau intermédiaire. Consolidation des acquis.', true),
('fr-avance-30h', 'Français Avancé - 30h', 'Francais', 'Avance', 30, 1800, 'Formation avancée pour maîtriser les subtilités de la langue.', true),
('fr-pro-20h', 'Français Professionnel - 20h', 'Francais', 'Intermediaire', 20, 1200, 'Français des affaires et communication professionnelle.', true);

INSERT INTO public.sessions (id, formation_id, date_debut, date_fin, horaires, jours, lieu, places_total, places_disponibles) VALUES
('sess-001', 'fr-debutant-30h', '2025-03-15', '2025-04-30', '9h00 - 12h00', ARRAY['lundi','mercredi','vendredi'], 'Paris - Centre (75001)', 12, 8),
('sess-002', 'fr-debutant-30h', '2025-04-01', '2025-05-15', '14h00 - 17h00', ARRAY['mardi','jeudi'], 'Paris - Bastille (75011)', 10, 5),
('sess-003', 'fr-debutant-60h', '2025-03-20', '2025-05-30', '9h00 - 12h00', ARRAY['lundi','mardi','mercredi','jeudi','vendredi'], 'Paris - Centre (75001)', 8, 3),
('sess-004', 'fr-intermediaire-40h', '2025-04-10', '2025-06-10', '18h00 - 21h00', ARRAY['mardi','jeudi'], 'Distanciel (Zoom)', 15, 12),
('sess-005', 'fr-avance-30h', '2025-05-01', '2025-06-15', '9h00 - 12h00', ARRAY['samedi'], 'Paris - Opéra (75009)', 10, 7),
('sess-006', 'fr-pro-20h', '2025-04-15', '2025-05-15', '12h30 - 14h00', ARRAY['lundi','mercredi','vendredi'], 'Paris - La Défense (92)', 8, 6);

-- =============================================
-- MIGRATION: Add lieu column to profiles
-- =============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lieu TEXT DEFAULT NULL
CHECK (lieu IS NULL OR lieu IN ('Gagny', 'Sarcelles'));

-- Update role CHECK constraint to include 'commercial'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'staff', 'commercial'));

-- Update trigger to include lieu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role, lieu)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    NEW.raw_user_meta_data->>'lieu'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
