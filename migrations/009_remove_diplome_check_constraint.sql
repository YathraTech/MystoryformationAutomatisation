-- =============================================
-- MIGRATION: Supprimer la contrainte CHECK sur diplome
-- Pour permettre les codes d'examen dynamiques
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Supprimer la contrainte CHECK existante sur la colonne diplome
-- Le nom de la contrainte peut varier, on utilise une requête dynamique

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Trouver le nom de la contrainte CHECK sur la colonne diplome
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'public.examens'::regclass
    AND c.contype = 'c'
    AND a.attname = 'diplome';

    -- Si une contrainte existe, la supprimer
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.examens DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE 'Contrainte % supprimée avec succès', constraint_name;
    ELSE
        RAISE NOTICE 'Aucune contrainte CHECK trouvée sur la colonne diplome';
    END IF;
END $$;

-- Vérification : la colonne diplome accepte maintenant n'importe quelle valeur TEXT
-- Les validations se feront côté application via la table exam_options
