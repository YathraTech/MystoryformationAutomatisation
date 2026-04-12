-- ============================================================
-- Migration 036: Ajout type_test aux questions QCM (initial / final)
-- ============================================================

ALTER TABLE qcm_questions ADD COLUMN IF NOT EXISTS type_test TEXT DEFAULT 'initial' CHECK (type_test IN ('initial', 'final'));
CREATE INDEX IF NOT EXISTS idx_qcm_questions_type_test ON qcm_questions(type_test);
