-- Add pdf_versions column to store historical PDF versions
ALTER TABLE examens ADD COLUMN IF NOT EXISTS pdf_versions jsonb DEFAULT '[]';
