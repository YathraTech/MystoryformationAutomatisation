-- Migration 022: piece_identite becomes a JSON array of storage paths
-- Previously stored a single filename as text, now stores a JSON array of paths

-- Convert existing non-null values to JSON array format
UPDATE examens
SET piece_identite = '["' || piece_identite || '"]'
WHERE piece_identite IS NOT NULL
  AND piece_identite != ''
  AND piece_identite NOT LIKE '[%';

-- Update column comment
COMMENT ON COLUMN examens.piece_identite IS 'JSON array of storage paths for identity document files';
