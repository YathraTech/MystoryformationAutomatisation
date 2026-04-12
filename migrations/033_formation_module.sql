-- ============================================================
-- Migration 033: Module Formation complet (Qualiopi)
-- ============================================================

-- ======================
-- TABLE: stagiaires_formation
-- Fiche stagiaire liée au client, avec tout le parcours formation
-- ======================
CREATE TABLE IF NOT EXISTS stagiaires_formation (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,

  -- Infos personnelles (reprises du client + compléments)
  civilite TEXT NOT NULL,
  nom TEXT NOT NULL,
  nom_jeune_fille TEXT,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  nationalite TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT NOT NULL,
  adresse_postale TEXT NOT NULL,
  numero_piece_identite TEXT NOT NULL,
  type_piece TEXT NOT NULL CHECK (type_piece IN ('Passeport', 'CNI', 'Titre de séjour')),
  photo_piece_identite TEXT[], -- URLs Supabase Storage
  photo_candidat TEXT[], -- URLs Supabase Storage

  -- Agence & commercial
  agence TEXT NOT NULL CHECK (agence IN ('Gagny', 'Sarcelles', 'Rosny')),
  commerciale_id TEXT, -- UUID du staff
  commerciale_nom TEXT,
  source_provenance TEXT CHECK (source_provenance IN ('Appel', 'WhatsApp', 'CPF', 'Site', 'Bouche-à-oreille', 'Réseau social', 'Partenaire')),
  type_prestation TEXT NOT NULL CHECK (type_prestation IN ('Formation TEF IRN', 'Examen TEF IRN', 'Examen civique', 'Pack TEF+Civique', 'Pack complet')),

  -- Formatrice assignée
  formatrice_id TEXT,
  formatrice_nom TEXT,

  -- Planning formation
  jours_formation TEXT[], -- ['Lundi', 'Mardi', ...]
  horaires_formation TEXT, -- '9h30-12h30' etc.

  -- Paiement
  mode_paiement TEXT CHECK (mode_paiement IN ('CB', 'Espèces', 'Virement', 'CPF', 'Mixte')),
  montant_total NUMERIC(10,2),
  paiement_plusieurs_fois BOOLEAN DEFAULT false,
  nombre_echeances INTEGER, -- 2, 3 ou 4
  numero_dossier_cpf TEXT,
  statut_paiement TEXT DEFAULT 'En attente' CHECK (statut_paiement IN ('Payé', 'En attente', 'Partiel', 'Impayé')),

  -- Suivi global
  statut TEXT DEFAULT 'inscription' CHECK (statut IN (
    'inscription', 'test_initial', 'analyse_besoin', 'evaluation_initiale',
    'en_formation', 'test_final', 'evaluation_finale', 'terminee', 'abandonnee'
  )),
  heures_prevues NUMERIC(6,1) DEFAULT 0,
  heures_effectuees NUMERIC(6,1) DEFAULT 0,
  date_debut_formation DATE,
  date_fin_formation DATE,
  referent_handicap BOOLEAN DEFAULT false,
  situation_handicap_detail TEXT,

  -- Documents générés (URLs PDF)
  pdf_convention TEXT,
  pdf_convocation TEXT,
  pdf_programme TEXT,
  pdf_attestation_fin TEXT,

  -- Mails envoyés
  mail_inscription_envoye BOOLEAN DEFAULT false,
  mail_rappel_envoye BOOLEAN DEFAULT false,
  mail_attestation_envoye BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_stagiaires_formation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stagiaires_formation_updated_at
  BEFORE UPDATE ON stagiaires_formation
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

-- Index
CREATE INDEX idx_stagiaires_formation_client ON stagiaires_formation(client_id);
CREATE INDEX idx_stagiaires_formation_email ON stagiaires_formation(email);
CREATE INDEX idx_stagiaires_formation_statut ON stagiaires_formation(statut);
CREATE INDEX idx_stagiaires_formation_agence ON stagiaires_formation(agence);
CREATE INDEX idx_stagiaires_formation_commerciale ON stagiaires_formation(commerciale_id);

-- RLS
ALTER TABLE stagiaires_formation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read stagiaires_formation" ON stagiaires_formation
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert stagiaires_formation" ON stagiaires_formation
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update stagiaires_formation" ON stagiaires_formation
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete stagiaires_formation" ON stagiaires_formation
  FOR DELETE TO authenticated USING (true);

-- ======================
-- TABLE: tests_formation (test initial + test final)
-- ======================
CREATE TABLE IF NOT EXISTS tests_formation (
  id SERIAL PRIMARY KEY,
  stagiaire_id INTEGER NOT NULL REFERENCES stagiaires_formation(id) ON DELETE CASCADE,
  type_test TEXT NOT NULL CHECK (type_test IN ('initial', 'final')),

  date_test DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Scores /20
  score_ce NUMERIC(4,1) NOT NULL DEFAULT 0, -- Compréhension écrite (auto)
  score_co NUMERIC(4,1) NOT NULL DEFAULT 0, -- Compréhension orale (auto)
  score_ee NUMERIC(4,1) NOT NULL DEFAULT 0, -- Expression écrite (manuel)
  score_eo NUMERIC(4,1) NOT NULL DEFAULT 0, -- Expression orale (manuel)

  -- Calculs auto
  score_global NUMERIC(5,1) GENERATED ALWAYS AS (score_ce + score_co + score_ee + score_eo) STORED,
  niveau_estime TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (score_ce + score_co + score_ee + score_eo) >= 19 THEN 'B2'
      WHEN (score_ce + score_co + score_ee + score_eo) >= 15 THEN 'B1'
      WHEN (score_ce + score_co + score_ee + score_eo) >= 10 THEN 'A2'
      WHEN (score_ce + score_co + score_ee + score_eo) >= 5 THEN 'A1'
      ELSE 'A0'
    END
  ) STORED,

  -- Profil pédagogique
  profil_pedagogique TEXT CHECK (profil_pedagogique IN ('Alphabétisation', 'FLE')),

  -- QCM CO + CE (réponses pour correction auto)
  reponses_ce JSONB, -- [{question: 1, reponse: 'A', correct: true}, ...]
  reponses_co JSONB, -- idem

  -- PDF
  pdf_rapport TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_tests_formation_updated_at
  BEFORE UPDATE ON tests_formation
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

CREATE INDEX idx_tests_formation_stagiaire ON tests_formation(stagiaire_id);
CREATE INDEX idx_tests_formation_type ON tests_formation(type_test);

ALTER TABLE tests_formation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all tests_formation" ON tests_formation
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: analyses_besoin
-- ======================
CREATE TABLE IF NOT EXISTS analyses_besoin (
  id SERIAL PRIMARY KEY,
  stagiaire_id INTEGER NOT NULL UNIQUE REFERENCES stagiaires_formation(id) ON DELETE CASCADE,

  -- Section 2: Objectif
  objectif_formation TEXT[] NOT NULL DEFAULT '{}', -- checkboxes multiples
  -- 'Carte de résidence longue durée', 'Naturalisation', 'Améliorer français pro', 'Emploi', 'Mobilité pro', 'Maintien résidence'

  -- Section 3: Niveau
  niveau_estime TEXT, -- Pré-rempli depuis test initial
  methode_positionnement TEXT CHECK (methode_positionnement IN ('Test', 'Attestation de niveau', 'Autre')),

  -- Section 4: Situation
  situation_professionnelle TEXT CHECK (situation_professionnelle IN (
    'Salarié', 'Demandeur d''emploi', 'Indépendant', 'Étudiant', 'Retraité', 'Sans activité', 'Chef d''entreprise', 'Autre'
  )),
  disponibilites TEXT[] DEFAULT '{}', -- '1x/sem (3h)', '2x/sem (6h)', etc.
  situation_handicap BOOLEAN DEFAULT false,
  situation_handicap_detail TEXT,

  -- Section 5: Analyse
  duree_estimee_formation TEXT NOT NULL, -- Nombre d'heures
  niveau_vise TEXT NOT NULL CHECK (niveau_vise IN ('A1', 'A2', 'B1', 'B2')),
  type_certification_visee TEXT[] DEFAULT '{}', -- 'TEF IRN', 'LEVEL TEL', 'LE ROBERT'
  mode_financement TEXT CHECK (mode_financement IN ('CPF', 'Fonds propres', 'Mixte')),
  commentaires TEXT,

  date_remplissage DATE NOT NULL DEFAULT CURRENT_DATE,
  commerciale_nom TEXT,

  -- PDF
  pdf_analyse TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_analyses_besoin_updated_at
  BEFORE UPDATE ON analyses_besoin
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

ALTER TABLE analyses_besoin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all analyses_besoin" ON analyses_besoin
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: evaluations (initiale + finale)
-- ======================
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  stagiaire_id INTEGER NOT NULL REFERENCES stagiaires_formation(id) ON DELETE CASCADE,
  type_evaluation TEXT NOT NULL CHECK (type_evaluation IN ('initiale', 'finale')),

  -- Page 1: Recueil d'infos (éval initiale)
  scolarisation_france BOOLEAN,
  scolarisation_etranger BOOLEAN,
  alphabetisation BOOLEAN,
  cours_francais BOOLEAN,
  cours_francais_detail TEXT,
  diplomes_langues TEXT, -- DELF, DALF, TCF, etc.
  anglais BOOLEAN,
  langues_parlees TEXT,
  usage_ordinateur BOOLEAN,
  maitrise_clavier BOOLEAN,
  smartphone_tablette BOOLEAN,
  ordinateur_maison BOOLEAN,
  acces_internet BOOLEAN,
  utilisation_boite_mail BOOLEAN,
  session_ordinateur BOOLEAN,
  motivation TEXT,
  apres_formation TEXT,
  besoins_vie_quotidienne INTEGER CHECK (besoins_vie_quotidienne BETWEEN 0 AND 5),
  besoins_vie_professionnelle INTEGER CHECK (besoins_vie_professionnelle BETWEEN 0 AND 5),
  certification_visee BOOLEAN,
  certification_visee_detail TEXT,

  -- Page 2: Résultats (depuis test)
  profil_pedagogique TEXT CHECK (profil_pedagogique IN ('Alphabétisation', 'FLE')),
  score_ce NUMERIC(4,1),
  score_co NUMERIC(4,1),
  score_ee NUMERIC(4,1),
  score_eo NUMERIC(4,1),
  niveau_global TEXT,

  -- Grilles par compétence (JSON: {CE: 'A2', CO: 'B1', EE: 'A1', EO: 'A2'})
  grille_niveaux JSONB,

  -- Éval finale: comparaison
  comparaison_initiale_finale JSONB, -- {CE: {initial: 12, final: 16}, ...}
  remarques TEXT,
  axes_progression TEXT[], -- jusqu'à 4 axes

  signature_intervenant TEXT, -- Nom

  -- PDF
  pdf_evaluation TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

CREATE INDEX idx_evaluations_stagiaire ON evaluations(stagiaire_id);
CREATE INDEX idx_evaluations_type ON evaluations(type_evaluation);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all evaluations" ON evaluations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: cours_sessions (séances de cours)
-- ======================
CREATE TABLE IF NOT EXISTS cours_sessions (
  id SERIAL PRIMARY KEY,
  date_cours DATE NOT NULL,
  agence TEXT NOT NULL CHECK (agence IN ('Gagny', 'Sarcelles', 'Rosny')),
  formatrice_id TEXT,
  formatrice_nom TEXT,
  horaire TEXT, -- '9h30-12h30'
  duree_heures NUMERIC(4,1) DEFAULT 3,
  notes TEXT,

  -- Feuille d'émargement
  pdf_emargement TEXT,
  scan_emargement TEXT, -- Upload du scan papier

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_cours_sessions_updated_at
  BEFORE UPDATE ON cours_sessions
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

CREATE INDEX idx_cours_sessions_date ON cours_sessions(date_cours);
CREATE INDEX idx_cours_sessions_agence ON cours_sessions(agence);

ALTER TABLE cours_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all cours_sessions" ON cours_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: emargements (présences par stagiaire par séance)
-- ======================
CREATE TABLE IF NOT EXISTS emargements (
  id SERIAL PRIMARY KEY,
  cours_session_id INTEGER NOT NULL REFERENCES cours_sessions(id) ON DELETE CASCADE,
  stagiaire_id INTEGER NOT NULL REFERENCES stagiaires_formation(id) ON DELETE CASCADE,

  present BOOLEAN DEFAULT false,
  signature_electronique TEXT, -- Base64 ou URL

  -- Absence
  justificatif_recu BOOLEAN DEFAULT false,
  justificatif_upload TEXT, -- URL du justificatif
  mail_relance_envoye BOOLEAN DEFAULT false,
  date_relance DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cours_session_id, stagiaire_id)
);

CREATE TRIGGER trg_emargements_updated_at
  BEFORE UPDATE ON emargements
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

CREATE INDEX idx_emargements_cours ON emargements(cours_session_id);
CREATE INDEX idx_emargements_stagiaire ON emargements(stagiaire_id);

ALTER TABLE emargements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all emargements" ON emargements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: satisfaction_chaud
-- ======================
CREATE TABLE IF NOT EXISTS satisfaction_chaud (
  id SERIAL PRIMARY KEY,
  stagiaire_id INTEGER NOT NULL REFERENCES stagiaires_formation(id) ON DELETE CASCADE,
  cours_session_id INTEGER REFERENCES cours_sessions(id) ON DELETE SET NULL,
  formatrice_id TEXT,
  formatrice_nom TEXT,

  q1_contenu_clair INTEGER NOT NULL CHECK (q1_contenu_clair BETWEEN 1 AND 5),
  q2_formateur_explique INTEGER NOT NULL CHECK (q2_formateur_explique BETWEEN 1 AND 5),
  q3_progression INTEGER NOT NULL CHECK (q3_progression BETWEEN 1 AND 5),
  q4_accueil INTEGER NOT NULL CHECK (q4_accueil BETWEEN 1 AND 5),
  q5_recommandation INTEGER NOT NULL CHECK (q5_recommandation BETWEEN 1 AND 5),
  commentaire TEXT,

  date_reponse DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_satisfaction_chaud_stagiaire ON satisfaction_chaud(stagiaire_id);
CREATE INDEX idx_satisfaction_chaud_formatrice ON satisfaction_chaud(formatrice_id);

ALTER TABLE satisfaction_chaud ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all satisfaction_chaud" ON satisfaction_chaud
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: satisfaction_froid
-- ======================
CREATE TABLE IF NOT EXISTS satisfaction_froid (
  id SERIAL PRIMARY KEY,
  stagiaire_id INTEGER NOT NULL UNIQUE REFERENCES stagiaires_formation(id) ON DELETE CASCADE,

  q1_utilite INTEGER NOT NULL CHECK (q1_utilite BETWEEN 1 AND 5),
  q2_reussite_examen TEXT NOT NULL CHECK (q2_reussite_examen IN ('Oui', 'Non', 'Pas encore')),
  q3_recommandation INTEGER NOT NULL CHECK (q3_recommandation BETWEEN 1 AND 5),
  commentaire TEXT,

  date_envoi DATE, -- Date d'envoi du mail auto (J+30)
  date_reponse DATE,
  mail_envoye BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_satisfaction_froid_stagiaire ON satisfaction_froid(stagiaire_id);

ALTER TABLE satisfaction_froid ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all satisfaction_froid" ON satisfaction_froid
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: reclamations
-- ======================
CREATE TABLE IF NOT EXISTS reclamations (
  id SERIAL PRIMARY KEY,
  stagiaire_id INTEGER REFERENCES stagiaires_formation(id) ON DELETE SET NULL,

  objet TEXT NOT NULL,
  description TEXT NOT NULL,
  statut TEXT DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'en_cours', 'resolue', 'fermee')),
  reponse TEXT,
  date_reclamation DATE NOT NULL DEFAULT CURRENT_DATE,
  date_resolution DATE,
  traite_par TEXT, -- Nom du staff

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_reclamations_updated_at
  BEFORE UPDATE ON reclamations
  FOR EACH ROW EXECUTE FUNCTION update_stagiaires_formation_updated_at();

CREATE INDEX idx_reclamations_stagiaire ON reclamations(stagiaire_id);
CREATE INDEX idx_reclamations_statut ON reclamations(statut);

ALTER TABLE reclamations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all reclamations" ON reclamations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================
-- TABLE: qcm_questions (banque de questions pour test CO/CE)
-- ======================
CREATE TABLE IF NOT EXISTS qcm_questions (
  id SERIAL PRIMARY KEY,
  type_competence TEXT NOT NULL CHECK (type_competence IN ('CE', 'CO')),
  niveau TEXT NOT NULL CHECK (niveau IN ('A0', 'A1', 'A2', 'B1', 'B2')),
  question TEXT NOT NULL,
  choix JSONB NOT NULL, -- ['choix A', 'choix B', 'choix C', 'choix D']
  reponse_correcte TEXT NOT NULL, -- 'A', 'B', 'C' ou 'D'
  media_url TEXT, -- URL audio pour CO
  points NUMERIC(3,1) DEFAULT 1,
  actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qcm_questions_type ON qcm_questions(type_competence);
CREATE INDEX idx_qcm_questions_niveau ON qcm_questions(niveau);

ALTER TABLE qcm_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated all qcm_questions" ON qcm_questions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
