-- ============================================================
-- Migration 034: Créneaux et paramètres de formation
-- ============================================================

-- ======================
-- TABLE: formation_creneaux (jours/horaires disponibles)
-- ======================
CREATE TABLE IF NOT EXISTS formation_creneaux (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,            -- Ex: "Lundi matin", "Mardi après-midi"
  jour TEXT NOT NULL,             -- lundi, mardi, etc.
  heure_debut TEXT NOT NULL,      -- '09:30'
  heure_fin TEXT NOT NULL,        -- '12:30'
  duree_heures NUMERIC(4,1) DEFAULT 3,
  agence TEXT NOT NULL CHECK (agence IN ('Gagny', 'Sarcelles', 'Rosny')),
  places_max INTEGER DEFAULT 15,
  actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_formation_creneaux_updated_at
  BEFORE UPDATE ON formation_creneaux
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

ALTER TABLE formation_creneaux ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all formation_creneaux" ON formation_creneaux
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: formation_types (types de formation proposés)
-- ======================
CREATE TABLE IF NOT EXISTS formation_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,      -- 'TEF_IRN_A2', 'TEF_IRN_B1', etc.
  label TEXT NOT NULL,            -- 'Formation TEF IRN - Niveau A2'
  description TEXT,
  niveau_cible TEXT,              -- 'A2', 'B1', 'B2'
  duree_heures_min INTEGER,      -- Durée min recommandée
  duree_heures_max INTEGER,      -- Durée max recommandée
  prix_horaire NUMERIC(8,2),     -- Prix par heure
  prix_forfait NUMERIC(10,2),    -- Prix forfaitaire
  eligible_cpf BOOLEAN DEFAULT true,
  visible BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_formation_types_updated_at
  BEFORE UPDATE ON formation_types
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

ALTER TABLE formation_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all formation_types" ON formation_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: formation_salles (salles disponibles par agence)
-- ======================
CREATE TABLE IF NOT EXISTS formation_salles (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,              -- 'Salle 1', 'Salle A'
  agence TEXT NOT NULL CHECK (agence IN ('Gagny', 'Sarcelles', 'Rosny')),
  capacite INTEGER DEFAULT 15,
  equipements TEXT[],             -- ['Vidéoprojecteur', 'Ordinateurs', 'Tableau blanc']
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE formation_salles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all formation_salles" ON formation_salles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
