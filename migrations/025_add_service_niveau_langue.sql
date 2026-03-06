-- Add service_souhaite, niveau, and langue columns to examens table
ALTER TABLE examens ADD COLUMN IF NOT EXISTS service_souhaite TEXT DEFAULT NULL;
ALTER TABLE examens ADD COLUMN IF NOT EXISTS niveau TEXT DEFAULT NULL;
ALTER TABLE examens ADD COLUMN IF NOT EXISTS langue TEXT DEFAULT NULL;
