-- =============================================
-- MIGRATION 020: Ajout ville de naissance aux examens
-- =============================================

ALTER TABLE public.examens
  ADD COLUMN IF NOT EXISTS ville_naissance TEXT;
