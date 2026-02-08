-- =============================================
-- MIGRATION: Table clients + liaisons formations/examens
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Table des clients (profil unique par email)
CREATE TABLE IF NOT EXISTS public.clients (
  id                SERIAL PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  telephone         TEXT,
  civilite          TEXT,
  nom               TEXT NOT NULL,
  prenom            TEXT NOT NULL,
  date_naissance    TEXT,
  adresse           TEXT,
  code_postal       TEXT,
  ville             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_email ON public.clients (email);
CREATE INDEX idx_clients_telephone ON public.clients (telephone);
CREATE INDEX idx_clients_nom_prenom ON public.clients (nom, prenom);

-- Trigger pour updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS pour clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_clients"
  ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_clients"
  ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_clients"
  ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_clients"
  ON public.clients FOR INSERT TO anon WITH CHECK (true);

-- =============================================
-- Ajouter client_id aux inscriptions
-- =============================================
ALTER TABLE public.inscriptions
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX idx_inscriptions_client_id ON public.inscriptions (client_id);

-- =============================================
-- Ajouter client_id et resultat aux examens
-- =============================================
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS resultat TEXT DEFAULT 'a_venir'
CHECK (resultat IN ('a_venir', 'reussi', 'echoue'));

CREATE INDEX idx_examens_client_id ON public.examens (client_id);

-- =============================================
-- Fonction pour trouver ou créer un client
-- =============================================
CREATE OR REPLACE FUNCTION find_or_create_client(
  p_email TEXT,
  p_telephone TEXT,
  p_civilite TEXT,
  p_nom TEXT,
  p_prenom TEXT,
  p_date_naissance TEXT DEFAULT NULL,
  p_adresse TEXT DEFAULT NULL,
  p_code_postal TEXT DEFAULT NULL,
  p_ville TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_client_id INTEGER;
BEGIN
  -- Chercher par email d'abord
  SELECT id INTO v_client_id FROM public.clients WHERE email = LOWER(p_email) LIMIT 1;

  -- Si pas trouvé, chercher par téléphone
  IF v_client_id IS NULL AND p_telephone IS NOT NULL THEN
    SELECT id INTO v_client_id FROM public.clients WHERE telephone = p_telephone LIMIT 1;
  END IF;

  -- Si toujours pas trouvé, créer le client
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (email, telephone, civilite, nom, prenom, date_naissance, adresse, code_postal, ville)
    VALUES (LOWER(p_email), p_telephone, p_civilite, p_nom, p_prenom, p_date_naissance, p_adresse, p_code_postal, p_ville)
    RETURNING id INTO v_client_id;
  ELSE
    -- Mettre à jour les infos si le client existe
    UPDATE public.clients SET
      telephone = COALESCE(p_telephone, telephone),
      civilite = COALESCE(p_civilite, civilite),
      nom = COALESCE(p_nom, nom),
      prenom = COALESCE(p_prenom, prenom),
      date_naissance = COALESCE(p_date_naissance, date_naissance),
      adresse = COALESCE(p_adresse, adresse),
      code_postal = COALESCE(p_code_postal, code_postal),
      ville = COALESCE(p_ville, ville),
      updated_at = now()
    WHERE id = v_client_id;
  END IF;

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
