-- Table de liaison entre exam_types et exam_options
-- Permet d'associer des options d'examen (A1, A2, B1, etc.) à chaque type d'examen (TEF IRN, Civique)

CREATE TABLE IF NOT EXISTS public.exam_type_options (
  id SERIAL PRIMARY KEY,
  exam_type_id INT NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
  exam_option_id INT NOT NULL REFERENCES public.exam_options(id) ON DELETE CASCADE,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exam_type_id, exam_option_id)
);

-- RLS
ALTER TABLE exam_type_options ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Authenticated full access" ON exam_type_options;
DROP POLICY IF EXISTS "Anon read" ON exam_type_options;
CREATE POLICY "Authenticated full access" ON exam_type_options FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read" ON exam_type_options FOR SELECT TO anon USING (true);
