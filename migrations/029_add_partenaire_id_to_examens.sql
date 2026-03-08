-- Migration 029: Add partenaire_id to examens table
-- Tracks which partner registered each candidate

ALTER TABLE public.examens ADD COLUMN IF NOT EXISTS partenaire_id UUID DEFAULT NULL
  REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_examens_partenaire_id ON public.examens (partenaire_id);
