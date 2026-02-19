-- Ajouter le centre de formation (lieu) aux inscriptions
-- Permet de filtrer les inscriptions par centre pour les commerciaux
ALTER TABLE public.inscriptions ADD COLUMN IF NOT EXISTS lieu TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_inscriptions_lieu ON public.inscriptions(lieu);
