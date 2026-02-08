-- =============================================
-- MIGRATION: Ajouter le rôle "commercial" et le lieu
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Ajouter la nouvelle contrainte avec le rôle commercial
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'staff', 'commercial'));

-- Ajouter la colonne lieu
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lieu TEXT DEFAULT NULL;

-- Ajouter la contrainte sur lieu
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_lieu_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_lieu_check
CHECK (lieu IS NULL OR lieu IN ('Gagny', 'Sarcelles'));

-- Mettre à jour le trigger pour supporter le nouveau rôle et le lieu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role, lieu)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    NEW.raw_user_meta_data->>'lieu'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
