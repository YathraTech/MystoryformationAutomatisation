-- Table pour les objectifs/motivations d'examen (gérés dynamiquement)
CREATE TABLE IF NOT EXISTS public.exam_objectifs (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  ordre INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les objectifs par défaut
INSERT INTO public.exam_objectifs (code, label, ordre, visible) VALUES
  ('nationalite_francaise', 'Accès à la nationalité française', 1, true),
  ('carte_resident', 'Demande de carte de résident', 2, true),
  ('titre_sejour', 'Demande de titre de séjour', 3, true),
  ('autre', 'Autre(s)', 99, true)
ON CONFLICT (code) DO NOTHING;
