-- Migration: Système de paramètres d'examen dynamiques
-- Créneaux horaires + Options d'examen + Packs

-- Table des créneaux horaires d'examen
CREATE TABLE IF NOT EXISTS public.exam_time_slots (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  jour VARCHAR(20) NOT NULL,
  heure TIME NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des options d'examen (individuels et packs)
CREATE TABLE IF NOT EXISTS public.exam_options (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  categorie VARCHAR(50),
  est_pack BOOLEAN DEFAULT false,
  visible_public BOOLEAN DEFAULT true,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table de liaison pack -> options incluses
CREATE TABLE IF NOT EXISTS public.exam_pack_items (
  id SERIAL PRIMARY KEY,
  pack_id INT NOT NULL REFERENCES public.exam_options(id) ON DELETE CASCADE,
  option_id INT NOT NULL REFERENCES public.exam_options(id) ON DELETE CASCADE,
  UNIQUE(pack_id, option_id)
);

-- Table de liaison option -> créneaux disponibles
CREATE TABLE IF NOT EXISTS public.exam_option_slots (
  id SERIAL PRIMARY KEY,
  option_id INT NOT NULL REFERENCES public.exam_options(id) ON DELETE CASCADE,
  slot_id INT NOT NULL REFERENCES public.exam_time_slots(id) ON DELETE CASCADE,
  UNIQUE(option_id, slot_id)
);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_exam_time_slots_updated_at ON exam_time_slots;
CREATE TRIGGER update_exam_time_slots_updated_at
  BEFORE UPDATE ON exam_time_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_options_updated_at ON exam_options;
CREATE TRIGGER update_exam_options_updated_at
  BEFORE UPDATE ON exam_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données initiales : créneaux horaires
INSERT INTO exam_time_slots (label, jour, heure) VALUES
  ('Lundi après-midi', 'lundi', '14:00'),
  ('Vendredi matin', 'vendredi', '09:00')
ON CONFLICT DO NOTHING;

-- Données initiales : options d'examen (migration des diplômes existants)
INSERT INTO exam_options (code, label, categorie, visible_public, ordre) VALUES
  ('A1', 'Diplôme A1', 'niveau', true, 1),
  ('A2', 'Diplôme A2', 'niveau', true, 2),
  ('B1', 'Diplôme B1', 'niveau', true, 3),
  ('B2', 'Diplôme B2', 'niveau', true, 4),
  ('carte_pluriannuelle', 'Carte de séjour pluriannuelle', 'carte', true, 10),
  ('carte_residence', 'Carte de résident', 'carte', true, 11),
  ('naturalisation', 'Naturalisation', 'carte', true, 12)
ON CONFLICT (code) DO NOTHING;

-- Associer tous les créneaux à toutes les options par défaut
INSERT INTO exam_option_slots (option_id, slot_id)
SELECT o.id, s.id
FROM exam_options o
CROSS JOIN exam_time_slots s
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE exam_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_pack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_option_slots ENABLE ROW LEVEL SECURITY;

-- Policies pour exam_time_slots
DROP POLICY IF EXISTS "Authenticated full access time_slots" ON exam_time_slots;
CREATE POLICY "Authenticated full access time_slots" ON exam_time_slots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon read time_slots" ON exam_time_slots;
CREATE POLICY "Anon read time_slots" ON exam_time_slots
  FOR SELECT TO anon USING (true);

-- Policies pour exam_options
DROP POLICY IF EXISTS "Authenticated full access options" ON exam_options;
CREATE POLICY "Authenticated full access options" ON exam_options
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon read options" ON exam_options;
CREATE POLICY "Anon read options" ON exam_options
  FOR SELECT TO anon USING (true);

-- Policies pour exam_pack_items
DROP POLICY IF EXISTS "Authenticated full access pack_items" ON exam_pack_items;
CREATE POLICY "Authenticated full access pack_items" ON exam_pack_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon read pack_items" ON exam_pack_items;
CREATE POLICY "Anon read pack_items" ON exam_pack_items
  FOR SELECT TO anon USING (true);

-- Policies pour exam_option_slots
DROP POLICY IF EXISTS "Authenticated full access option_slots" ON exam_option_slots;
CREATE POLICY "Authenticated full access option_slots" ON exam_option_slots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon read option_slots" ON exam_option_slots;
CREATE POLICY "Anon read option_slots" ON exam_option_slots
  FOR SELECT TO anon USING (true);
