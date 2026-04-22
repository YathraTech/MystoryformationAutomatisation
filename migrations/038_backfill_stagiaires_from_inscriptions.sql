-- ============================================================
-- Migration 038: Lien inscription → stagiaire + backfill
-- ============================================================
-- Prérequis : migration 037 doit être appliquée (colonnes nullables).
-- Les statements DROP NOT NULL suivants sont idempotents et réappliquent
-- 037 par sécurité si elle n'a pas été jouée.

ALTER TABLE stagiaires_formation ALTER COLUMN nationalite DROP NOT NULL;
ALTER TABLE stagiaires_formation ALTER COLUMN numero_piece_identite DROP NOT NULL;
ALTER TABLE stagiaires_formation ALTER COLUMN type_piece DROP NOT NULL;
ALTER TABLE stagiaires_formation ALTER COLUMN agence DROP NOT NULL;

-- ============================================================
-- Ajout du lien inscription_id (traçabilité + idempotence backfill)
-- ============================================================
ALTER TABLE stagiaires_formation
  ADD COLUMN IF NOT EXISTS inscription_id INTEGER
  REFERENCES inscriptions(id) ON DELETE SET NULL;

-- Une inscription publique ne doit produire qu'un seul stagiaire
CREATE UNIQUE INDEX IF NOT EXISTS idx_stagiaires_formation_inscription_unique
  ON stagiaires_formation (inscription_id)
  WHERE inscription_id IS NOT NULL;

-- ============================================================
-- Backfill : créer un stagiaire pour chaque inscription FORMATION
-- (on exclut les lignes "examen") qui n'en a pas encore.
-- ============================================================
INSERT INTO stagiaires_formation (
  inscription_id,
  client_id,
  civilite,
  nom,
  prenom,
  date_naissance,
  email,
  telephone,
  adresse_postale,
  agence,
  source_provenance,
  type_prestation,
  statut,
  heures_prevues,
  montant_total,
  numero_dossier_cpf,
  mode_paiement,
  created_at,
  updated_at
)
SELECT
  i.id,
  i.client_id,
  NULLIF(i.civilite, ''),
  UPPER(NULLIF(i.nom, '')),
  NULLIF(i.prenom, ''),
  -- date_naissance est TEXT dans inscriptions : on caste seulement si format ISO
  CASE
    WHEN i.date_naissance ~ '^\d{4}-\d{2}-\d{2}'
      THEN (substring(i.date_naissance from '^\d{4}-\d{2}-\d{2}'))::date
    ELSE NULL
  END,
  LOWER(NULLIF(i.email, '')),
  NULLIF(i.telephone, ''),
  NULLIF(
    trim(both ', ' FROM CONCAT_WS(', ',
      NULLIF(i.adresse, ''),
      NULLIF(i.code_postal, ''),
      NULLIF(i.ville, '')
    )),
    ''
  ),
  CASE WHEN i.lieu IN ('Gagny', 'Sarcelles', 'Rosny') THEN i.lieu ELSE NULL END,
  'Site',
  'Formation TEF IRN',
  'inscription',
  COALESCE(f.duree_heures, 0),
  f.prix,
  NULLIF(i.numero_cpf, ''),
  CASE WHEN i.mode_financement = 'CPF' THEN 'CPF' ELSE NULL END,
  -- Conserver la date d'origine de l'inscription si possible
  COALESCE(
    CASE
      WHEN i.timestamp ~ '^\d{4}-\d{2}-\d{2}T'
        THEN i.timestamp::timestamptz
      ELSE NULL
    END,
    i.created_at,
    NOW()
  ),
  NOW()
FROM inscriptions i
LEFT JOIN formations f ON f.id = i.formation_id
WHERE
  -- Doit avoir une formation choisie
  COALESCE(i.formation_id, '') <> ''
  -- Exclure les inscriptions "examen" (elles ne vont pas en suivi formation)
  AND COALESCE(i.formation_nom, '') NOT ILIKE '%examen%'
  -- Le nom et l'email minimum pour identifier la personne
  AND COALESCE(i.nom, '') <> ''
  AND COALESCE(i.email, '') <> ''
  -- Idempotence : ne pas recréer si déjà lié
  AND NOT EXISTS (
    SELECT 1 FROM stagiaires_formation s
    WHERE s.inscription_id = i.id
  );
