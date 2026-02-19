-- =============================================
-- MIGRATION: Ajouter les nouveaux champs d'inscription examen
-- Nationalité, lieu de naissance, langue maternelle, objectif administratif, etc.
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Ajouter les nouvelles colonnes à la table examens
ALTER TABLE public.examens
ADD COLUMN IF NOT EXISTS nationalite VARCHAR(100),
ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR(255),
ADD COLUMN IF NOT EXISTS langue_maternelle VARCHAR(100),
ADD COLUMN IF NOT EXISTS objectif_administratif VARCHAR(50),
ADD COLUMN IF NOT EXISTS source_connaissance VARCHAR(50),
ADD COLUMN IF NOT EXISTS piece_identite TEXT;

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.examens.nationalite IS 'Nationalité du candidat';
COMMENT ON COLUMN public.examens.lieu_naissance IS 'Lieu de naissance (Ville + Pays)';
COMMENT ON COLUMN public.examens.langue_maternelle IS 'Langue maternelle du candidat';
COMMENT ON COLUMN public.examens.objectif_administratif IS 'Objectif: carte_4_ans, carte_10_ans, naturalisation, cnaps, autre';
COMMENT ON COLUMN public.examens.source_connaissance IS 'Comment le client nous a connu: google, bouche_a_oreille, reseaux_sociaux, autre';
COMMENT ON COLUMN public.examens.piece_identite IS 'URL ou nom du fichier de la pièce d''identité uploadée';
