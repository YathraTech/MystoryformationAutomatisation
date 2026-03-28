-- 031: Add inscription_type, facilites, numero_cpf to examens
ALTER TABLE examens ADD COLUMN IF NOT EXISTS inscription_type TEXT;
ALTER TABLE examens ADD COLUMN IF NOT EXISTS facilites TEXT;
ALTER TABLE examens ADD COLUMN IF NOT EXISTS numero_cpf TEXT;
