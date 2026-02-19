-- Ajout des champs numéro de passeport et numéro de CNI
ALTER TABLE examens ADD COLUMN IF NOT EXISTS numero_passeport VARCHAR(50);
ALTER TABLE examens ADD COLUMN IF NOT EXISTS numero_cni VARCHAR(50);

-- Renommer lieu_naissance en pays_naissance pour plus de clarté
-- (optionnel - on garde le même nom de colonne mais on change juste le label dans l'interface)
