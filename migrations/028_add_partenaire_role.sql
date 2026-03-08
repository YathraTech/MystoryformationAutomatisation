-- Migration 028: Add partenaire role and organisation field to profiles
-- Extends role check to include 'partenaire' and adds organisation text field

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'staff', 'commercial', 'partenaire'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organisation TEXT DEFAULT NULL;

-- Update the handle_new_user trigger to pass organisation from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role, lieu, organisation)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    NEW.raw_user_meta_data->>'lieu',
    NEW.raw_user_meta_data->>'organisation'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
