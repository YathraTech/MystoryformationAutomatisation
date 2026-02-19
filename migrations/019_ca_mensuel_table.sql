-- =============================================
-- MIGRATION 019: Table CA mensuel par commercial
-- Stocke le snapshot du CA par commercial et par mois
-- =============================================

CREATE TABLE IF NOT EXISTS public.ca_mensuel (
  id            SERIAL PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mois          DATE NOT NULL,  -- Toujours le 1er du mois (ex: '2026-02-01')
  montant       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Une seule ligne par commercial par mois
  CONSTRAINT uq_ca_mensuel_commercial_mois UNIQUE (commercial_id, mois)
);

CREATE INDEX IF NOT EXISTS idx_ca_mensuel_commercial ON public.ca_mensuel (commercial_id);
CREATE INDEX IF NOT EXISTS idx_ca_mensuel_mois ON public.ca_mensuel (mois);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_ca_mensuel_updated_at
  BEFORE UPDATE ON public.ca_mensuel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.ca_mensuel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_ca_mensuel"
  ON public.ca_mensuel FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_ca_mensuel"
  ON public.ca_mensuel FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_ca_mensuel"
  ON public.ca_mensuel FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_ca_mensuel"
  ON public.ca_mensuel FOR DELETE TO authenticated USING (true);

-- Backfill : peupler ca_mensuel depuis les examens existants
INSERT INTO public.ca_mensuel (commercial_id, mois, montant)
SELECT
  commercial_id,
  date_trunc('month', created_at)::date AS mois,
  SUM(prix) AS montant
FROM public.examens
WHERE commercial_id IS NOT NULL
  AND prix IS NOT NULL
  AND prix > 0
GROUP BY commercial_id, date_trunc('month', created_at)
ON CONFLICT (commercial_id, mois) DO UPDATE SET montant = EXCLUDED.montant;
