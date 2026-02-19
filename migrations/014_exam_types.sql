-- Table des types d'examens souhaités (TEF IRN, Examen Civique, etc.)
-- Ces types apparaissent sur la page de sélection client

-- Fonction pour mettre à jour updated_at (créée si n'existe pas)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.exam_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,        -- Ex: "TEF_IRN", "CIVIQUE"
  label VARCHAR(100) NOT NULL,              -- Ex: "TEF IRN", "Examen Civique"
  description TEXT,                         -- Description affichée au client
  icon VARCHAR(50) DEFAULT 'BookOpen',      -- Nom de l'icône (BookOpen, FileText, etc.)
  color VARCHAR(20) DEFAULT 'blue',         -- Couleur (blue, emerald, purple, etc.)
  visible BOOLEAN DEFAULT true,             -- Visible sur la page client
  ordre INT DEFAULT 0,                      -- Ordre d'affichage
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_exam_types_updated_at ON exam_types;
CREATE TRIGGER update_exam_types_updated_at
  BEFORE UPDATE ON exam_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Données initiales (ON CONFLICT pour éviter les doublons)
INSERT INTO exam_types (code, label, description, icon, color, visible, ordre) VALUES
  ('TEF_IRN', 'TEF IRN', 'Test d''Évaluation de Français pour l''Intégration, la Résidence et la Nationalité', 'BookOpen', 'blue', true, 1),
  ('CIVIQUE', 'Examen Civique', 'Test de connaissance des valeurs de la République française', 'FileText', 'emerald', true, 2)
ON CONFLICT (code) DO NOTHING;

-- RLS
ALTER TABLE exam_types ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated = CRUD, anon = SELECT (pour page client)
DROP POLICY IF EXISTS "Authenticated full access" ON exam_types;
DROP POLICY IF EXISTS "Anon read" ON exam_types;
CREATE POLICY "Authenticated full access" ON exam_types FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read" ON exam_types FOR SELECT TO anon USING (true);
