-- 032: Table pour les notes générales par centre de formation
CREATE TABLE IF NOT EXISTS public.centre_notes (
  centre TEXT PRIMARY KEY CHECK (centre IN ('Gagny', 'Sarcelles')),
  content TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insérer les deux centres par défaut
INSERT INTO public.centre_notes (centre) VALUES ('Gagny'), ('Sarcelles')
ON CONFLICT (centre) DO NOTHING;
