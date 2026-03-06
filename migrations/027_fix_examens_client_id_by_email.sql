-- Fix: créer les clients manquants puis réattribuer examens/inscriptions par email
-- Corrige les cas où le fallback par téléphone avait rattaché un examen au mauvais client

-- Étape 1 : Créer un client pour chaque email présent dans examens mais absent de clients
INSERT INTO clients (email, telephone, civilite, nom, prenom, date_naissance, adresse, code_postal, ville)
SELECT DISTINCT ON (LOWER(e.email))
  LOWER(e.email),
  e.telephone,
  e.civilite,
  e.nom,
  e.prenom,
  e.date_naissance,
  e.adresse,
  e.code_postal,
  e.ville
FROM examens e
WHERE NOT EXISTS (
  SELECT 1 FROM clients c WHERE LOWER(c.email) = LOWER(e.email)
)
ORDER BY LOWER(e.email), e.created_at DESC;

-- Étape 2 : Idem pour les inscriptions
INSERT INTO clients (email, telephone, civilite, nom, prenom, date_naissance, adresse, code_postal, ville)
SELECT DISTINCT ON (LOWER(i.email))
  LOWER(i.email),
  i.telephone,
  i.civilite,
  i.nom,
  i.prenom,
  i.date_naissance,
  i.adresse,
  i.code_postal,
  i.ville
FROM inscriptions i
WHERE NOT EXISTS (
  SELECT 1 FROM clients c WHERE LOWER(c.email) = LOWER(i.email)
)
ORDER BY LOWER(i.email), i.created_at DESC;

-- Étape 3 : Réattribuer les examens au bon client_id par email
UPDATE examens e
SET client_id = c.id
FROM clients c
WHERE LOWER(e.email) = LOWER(c.email)
  AND (e.client_id IS NULL OR e.client_id != c.id);

-- Étape 4 : Réattribuer les inscriptions au bon client_id par email
UPDATE inscriptions i
SET client_id = c.id
FROM clients c
WHERE LOWER(i.email) = LOWER(c.email)
  AND (i.client_id IS NULL OR i.client_id != c.id);
