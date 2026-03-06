-- Fix: réattribuer les examens au bon client_id en se basant sur l'email
-- Corrige les cas où le fallback par téléphone avait rattaché un examen au mauvais client

UPDATE examens e
SET client_id = c.id
FROM clients c
WHERE LOWER(e.email) = LOWER(c.email)
  AND (e.client_id IS NULL OR e.client_id != c.id);

-- Idem pour les inscriptions
UPDATE inscriptions i
SET client_id = c.id
FROM clients c
WHERE LOWER(i.email) = LOWER(c.email)
  AND (i.client_id IS NULL OR i.client_id != c.id);
