-- Fix: find_or_create_client doit chercher uniquement par email, pas par téléphone
CREATE OR REPLACE FUNCTION find_or_create_client(
  p_email TEXT,
  p_telephone TEXT,
  p_civilite TEXT,
  p_nom TEXT,
  p_prenom TEXT,
  p_date_naissance TEXT DEFAULT NULL,
  p_adresse TEXT DEFAULT NULL,
  p_code_postal TEXT DEFAULT NULL,
  p_ville TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_client_id INTEGER;
BEGIN
  -- Chercher par email uniquement
  SELECT id INTO v_client_id FROM public.clients WHERE email = LOWER(p_email) LIMIT 1;

  -- Si pas trouvé, créer le client
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (email, telephone, civilite, nom, prenom, date_naissance, adresse, code_postal, ville)
    VALUES (LOWER(p_email), p_telephone, p_civilite, p_nom, p_prenom, p_date_naissance, p_adresse, p_code_postal, p_ville)
    RETURNING id INTO v_client_id;
  ELSE
    -- Mettre à jour les infos si le client existe
    UPDATE public.clients SET
      telephone = COALESCE(p_telephone, telephone),
      civilite = COALESCE(p_civilite, civilite),
      nom = COALESCE(p_nom, nom),
      prenom = COALESCE(p_prenom, prenom),
      date_naissance = COALESCE(p_date_naissance, date_naissance),
      adresse = COALESCE(p_adresse, adresse),
      code_postal = COALESCE(p_code_postal, code_postal),
      ville = COALESCE(p_ville, ville),
      updated_at = now()
    WHERE id = v_client_id;
  END IF;

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
