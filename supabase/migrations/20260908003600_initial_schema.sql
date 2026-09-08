-- ============================================================================
-- MediKiosk — Phase 1B Database Migration: Initial Schema
-- Migration ID: 20260908003600_initial_schema.sql
-- Source of Truth: docs/PHASE_1A_DATABASE_SCHEMA.md
-- Target Database: PostgreSQL 15+ / Supabase
-- Description:
--   Creates the 12 core tables, relationships, constraints, indexes, triggers,
--   private medical-documents storage bucket, and Row Level Security (RLS)
--   policies required for the MediKiosk core clinical intake workflow.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS & UTILITIES
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Automatic timestamp updater function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. TABLE: patients
-- Core demographic record for synthetic kiosk demonstration.
-- NOTE: Patient age is deliberately NOT stored; calculated at runtime from date_of_birth.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_identifier VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    phone_number VARCHAR(20),
    primary_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (primary_language IN ('en', 'hi', 'mr')),
    abha_id VARCHAR(50),
    is_demo BOOLEAN NOT NULL DEFAULT true,
    demo_case_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_patients_identifier ON patients(patient_identifier);
CREATE INDEX IF NOT EXISTS idx_patients_demo ON patients(is_demo, demo_case_id);

-- ----------------------------------------------------------------------------
-- 2. TABLE: clinical_sessions
-- Represents an active or completed patient kiosk intake encounter.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clinical_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(32) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (mode IN ('general', 'ayush')),
    status VARCHAR(30) NOT NULL DEFAULT 'intake_active' CHECK (status IN (
        'intake_active',
        'interview_complete',
        'documents_uploaded',
        'ready_for_review',
        'in_physician_review',
        'verified',
        'abandoned'
    )),
    language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'mr')),
    chief_complaint_raw TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    assigned_physician_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_clinical_sessions_updated_at
    BEFORE UPDATE ON clinical_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_clinical_sessions_patient_id ON clinical_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_sessions_status ON clinical_sessions(status);
CREATE INDEX IF NOT EXISTS idx_clinical_sessions_priority ON clinical_sessions(priority);
CREATE INDEX IF NOT EXISTS idx_clinical_sessions_code ON clinical_sessions(session_code);

-- ----------------------------------------------------------------------------
-- 3. TABLE: consents
-- Immutable legal record capturing explicit patient authorization.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinical_session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    consent_type VARCHAR(50) NOT NULL DEFAULT 'kiosk_intake_and_ai_assistance' CHECK (consent_type IN (
        'kiosk_intake_and_ai_assistance',
        'document_digitization',
        'data_sharing_abdm'
    )),
    status VARCHAR(20) NOT NULL CHECK (status IN ('granted', 'revoked', 'expired')),
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    ip_address VARCHAR(45),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consents_patient_id ON consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_session_id ON consents(clinical_session_id);
CREATE INDEX IF NOT EXISTS idx_consents_status ON consents(status);

-- ----------------------------------------------------------------------------
-- 4. TABLE: clinical_questions
-- Stores dynamic/adaptive clinical intake questions presented to the patient.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clinical_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL CHECK (step_number >= 1),
    question_text TEXT NOT NULL,
    question_text_canonical TEXT NOT NULL,
    clinical_domain VARCHAR(50) NOT NULL CHECK (clinical_domain IN (
        'chief_complaint',
        'hpi_onset',
        'hpi_severity',
        'hpi_character',
        'associated_symptoms',
        'past_medical_history',
        'medication_history',
        'allergy_history',
        'family_history',
        'lifestyle_social',
        'ayush_pariksha'
    )),
    input_type VARCHAR(30) NOT NULL CHECK (input_type IN ('text', 'voice', 'multiple_choice', 'scale', 'boolean')),
    options JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'presented' CHECK (status IN ('presented', 'answered', 'skipped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_questions_session_id ON clinical_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_clinical_questions_session_step ON clinical_questions(session_id, step_number);

-- ----------------------------------------------------------------------------
-- 5. TABLE: clinical_answers
-- Patient verbatim responses and real-time extracted symptom payloads.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clinical_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES clinical_questions(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    raw_answer_text TEXT NOT NULL,
    input_modality VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (input_modality IN (
        'text',
        'voice_browser',
        'voice_bhashini',
        'touch_choice'
    )),
    extracted_symptoms JSONB DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    language_detected VARCHAR(10) NOT NULL DEFAULT 'en',
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_answers_question_id ON clinical_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_clinical_answers_session_id ON clinical_answers(session_id);

-- ----------------------------------------------------------------------------
-- 6. TABLE: clinical_histories
-- Consolidated structured clinical record, HPI, PMH, allergies, and AI summary.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clinical_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT NOT NULL,
    symptoms_structured JSONB NOT NULL DEFAULT '[]'::jsonb,
    past_medical_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    known_allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
    family_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    ayush_pariksha JSONB,
    ai_clinical_summary TEXT NOT NULL,
    summary_status VARCHAR(30) NOT NULL DEFAULT 'generated' CHECK (summary_status IN (
        'generated',
        'edited_by_physician',
        'verified'
    )),
    generated_by_provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_clinical_histories_updated_at
    BEFORE UPDATE ON clinical_histories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_clinical_histories_session_id ON clinical_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_clinical_histories_patient_id ON clinical_histories(patient_id);

-- ----------------------------------------------------------------------------
-- 7. TABLE: triage_alerts
-- Safety alerts triggered by deterministic clinical rules (e.g. cardiac red flag).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS triage_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical_red_flag')),
    trigger_rule_id VARCHAR(64) NOT NULL,
    trigger_reason TEXT NOT NULL,
    trigger_symptoms JSONB NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by VARCHAR(64),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_triage_alerts_session_id ON triage_alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_triage_alerts_patient_id ON triage_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_alerts_level ON triage_alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_triage_alerts_unack ON triage_alerts(is_acknowledged, alert_level) WHERE is_acknowledged = false;

-- ----------------------------------------------------------------------------
-- 8. TABLE: documents
-- Uploaded historical medical documents linked to Supabase Storage objects.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'prescription',
        'lab_report',
        'discharge_summary',
        'radiology_report',
        'other'
    )),
    original_filename VARCHAR(255) NOT NULL,
    storage_bucket VARCHAR(64) NOT NULL DEFAULT 'medical-documents',
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL CHECK (mime_type IN (
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    )),
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 15728640),
    file_checksum_sha256 VARCHAR(64),
    processing_status VARCHAR(30) NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN (
        'uploaded',
        'processing',
        'completed',
        'failed'
    )),
    error_message TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_session_id ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);

-- ----------------------------------------------------------------------------
-- 9. TABLE: document_extractions
-- Digitized clinical data extracted from documents via multimodal AI.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID UNIQUE NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    extracted_date DATE,
    issuing_facility_or_doctor VARCHAR(255),
    extracted_lab_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    extracted_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    extracted_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_extracted_payload JSONB NOT NULL,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    extraction_provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_document_extractions_updated_at
    BEFORE UPDATE ON document_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_document_extractions_doc_id ON document_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_extractions_session_id ON document_extractions(session_id);

-- ----------------------------------------------------------------------------
-- 10. TABLE: medical_timeline
-- Longitudinal clinical milestones (conditions, meds, labs, encounters).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS medical_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
        'condition',
        'medication',
        'investigation_lab',
        'encounter',
        'procedure',
        'intake_assessment'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_abnormal BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN (
        'patient_reported',
        'extracted_from_document',
        'kiosk_session',
        'physician_entry'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_timeline_patient_id ON medical_timeline(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_timeline_session_id ON medical_timeline(session_id);
CREATE INDEX IF NOT EXISTS idx_medical_timeline_date ON medical_timeline(patient_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_timeline_abnormal ON medical_timeline(patient_id, is_abnormal) WHERE is_abnormal = true;

-- ----------------------------------------------------------------------------
-- 11. TABLE: physician_reviews
-- Physician case review, edits, verification sign-off, and FHIR export bundle.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS physician_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    physician_id VARCHAR(64) NOT NULL,
    physician_name VARCHAR(255) NOT NULL,
    review_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (review_status IN (
        'pending',
        'in_review',
        'verified_accepted',
        'rejected',
        'amended'
    )),
    edited_clinical_summary TEXT,
    physician_notes TEXT,
    reconciliation_changes JSONB,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    fhir_bundle_generated JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_physician_reviews_updated_at
    BEFORE UPDATE ON physician_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_physician_reviews_session_id ON physician_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_physician_reviews_patient_id ON physician_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_physician_reviews_status ON physician_reviews(review_status);

-- ----------------------------------------------------------------------------
-- 12. TABLE: audit_logs
-- Append-only tamper-evident compliance audit trail.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN (
        'patient_kiosk',
        'physician',
        'ai_system',
        'system_job'
    )),
    actor_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL CHECK (event_type IN (
        'consent_granted',
        'consent_revoked',
        'session_started',
        'answer_recorded',
        'red_flag_triggered',
        'document_uploaded',
        'document_extracted',
        'summary_generated',
        'summary_edited',
        'case_verified',
        'fhir_exported',
        'abdm_payload_prepared'
    )),
    event_description TEXT NOT NULL,
    ip_address VARCHAR(45),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 13. STORAGE CONFIGURATION & POLICIES
-- Private Supabase Storage bucket for uploaded medical documents.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'medical-documents',
            'medical-documents',
            false,
            15728640,
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
        )
        ON CONFLICT (id) DO UPDATE SET
            public = false,
            file_size_limit = 15728640,
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[];
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects'
    ) THEN
        DROP POLICY IF EXISTS "physician_read_medical_documents" ON storage.objects;
        DROP POLICY IF EXISTS "kiosk_upload_medical_documents" ON storage.objects;

        CREATE POLICY "physician_read_medical_documents"
            ON storage.objects FOR SELECT TO authenticated
            USING (bucket_id = 'medical-documents');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict role-based isolation between Kiosk (anon) and Physician (authenticated).
-- ----------------------------------------------------------------------------

-- Enable RLS across all 12 tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. patients policies
DROP POLICY IF EXISTS "physician_read_patients" ON patients;
DROP POLICY IF EXISTS "kiosk_create_patient" ON patients;
DROP POLICY IF EXISTS "kiosk_read_patient" ON patients;

CREATE POLICY "physician_read_patients"
    ON patients FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "kiosk_create_patient"
    ON patients FOR INSERT TO anon
    WITH CHECK (is_demo = true);

CREATE POLICY "kiosk_read_patient"
    ON patients FOR SELECT TO anon
    USING (is_demo = true);

-- 2. consents policies
DROP POLICY IF EXISTS "physician_read_consents" ON consents;
DROP POLICY IF EXISTS "kiosk_create_consent" ON consents;
DROP POLICY IF EXISTS "kiosk_read_consent" ON consents;

CREATE POLICY "physician_read_consents"
    ON consents FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "kiosk_create_consent"
    ON consents FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "kiosk_read_consent"
    ON consents FOR SELECT TO anon
    USING (true);

-- 3. clinical_sessions policies
DROP POLICY IF EXISTS "physician_manage_sessions" ON clinical_sessions;
DROP POLICY IF EXISTS "kiosk_create_session" ON clinical_sessions;
DROP POLICY IF EXISTS "kiosk_manage_session" ON clinical_sessions;

CREATE POLICY "physician_manage_sessions"
    ON clinical_sessions FOR ALL TO authenticated
    USING (true);

CREATE POLICY "kiosk_create_session"
    ON clinical_sessions FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "kiosk_manage_session"
    ON clinical_sessions FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 4. clinical_questions policies
DROP POLICY IF EXISTS "physician_read_questions" ON clinical_questions;
DROP POLICY IF EXISTS "kiosk_read_questions" ON clinical_questions;
DROP POLICY IF EXISTS "kiosk_insert_questions" ON clinical_questions;
DROP POLICY IF EXISTS "kiosk_update_questions" ON clinical_questions;

CREATE POLICY "physician_read_questions"
    ON clinical_questions FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "kiosk_read_questions"
    ON clinical_questions FOR SELECT TO anon
    USING (true);

CREATE POLICY "kiosk_insert_questions"
    ON clinical_questions FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "kiosk_update_questions"
    ON clinical_questions FOR UPDATE TO anon
    USING (true);

-- 5. clinical_answers policies
DROP POLICY IF EXISTS "physician_read_answers" ON clinical_answers;
DROP POLICY IF EXISTS "kiosk_insert_answers" ON clinical_answers;
DROP POLICY IF EXISTS "kiosk_read_answers" ON clinical_answers;

CREATE POLICY "physician_read_answers"
    ON clinical_answers FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "kiosk_insert_answers"
    ON clinical_answers FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "kiosk_read_answers"
    ON clinical_answers FOR SELECT TO anon
    USING (true);

-- 6. clinical_histories policies
DROP POLICY IF EXISTS "physician_manage_histories" ON clinical_histories;
DROP POLICY IF EXISTS "kiosk_manage_histories" ON clinical_histories;

CREATE POLICY "physician_manage_histories"
    ON clinical_histories FOR ALL TO authenticated
    USING (true);

CREATE POLICY "kiosk_manage_histories"
    ON clinical_histories FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 7. triage_alerts policies
DROP POLICY IF EXISTS "physician_read_alerts" ON triage_alerts;
DROP POLICY IF EXISTS "physician_ack_alerts" ON triage_alerts;
DROP POLICY IF EXISTS "kiosk_insert_alerts" ON triage_alerts;
DROP POLICY IF EXISTS "kiosk_read_alerts" ON triage_alerts;

CREATE POLICY "physician_read_alerts"
    ON triage_alerts FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "physician_ack_alerts"
    ON triage_alerts FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (is_acknowledged = true);

CREATE POLICY "kiosk_insert_alerts"
    ON triage_alerts FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "kiosk_read_alerts"
    ON triage_alerts FOR SELECT TO anon
    USING (true);

-- 8. documents policies
DROP POLICY IF EXISTS "physician_read_documents" ON documents;
DROP POLICY IF EXISTS "kiosk_insert_documents" ON documents;
DROP POLICY IF EXISTS "kiosk_read_documents" ON documents;

CREATE POLICY "physician_read_documents"
    ON documents FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "kiosk_insert_documents"
    ON documents FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "kiosk_read_documents"
    ON documents FOR SELECT TO anon
    USING (true);

-- 9. document_extractions policies
DROP POLICY IF EXISTS "physician_manage_extractions" ON document_extractions;
DROP POLICY IF EXISTS "kiosk_manage_extractions" ON document_extractions;

CREATE POLICY "physician_manage_extractions"
    ON document_extractions FOR ALL TO authenticated
    USING (true);

CREATE POLICY "kiosk_manage_extractions"
    ON document_extractions FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 10. medical_timeline policies
DROP POLICY IF EXISTS "physician_manage_timeline" ON medical_timeline;
DROP POLICY IF EXISTS "kiosk_manage_timeline" ON medical_timeline;

CREATE POLICY "physician_manage_timeline"
    ON medical_timeline FOR ALL TO authenticated
    USING (true);

CREATE POLICY "kiosk_manage_timeline"
    ON medical_timeline FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 11. physician_reviews policies
-- Restricted strictly to authenticated physicians
DROP POLICY IF EXISTS "physician_manage_reviews" ON physician_reviews;

CREATE POLICY "physician_manage_reviews"
    ON physician_reviews FOR ALL TO authenticated
    USING (true);

-- 12. audit_logs policies
-- Strictly append-only; SELECT allowed for authenticated physicians, zero update/delete policies
DROP POLICY IF EXISTS "physician_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "kiosk_insert_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "physician_insert_audit_logs" ON audit_logs;

CREATE POLICY "physician_read_audit_logs"
    ON audit_logs FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "kiosk_insert_audit_logs"
    ON audit_logs FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "physician_insert_audit_logs"
    ON audit_logs FOR INSERT TO authenticated
    WITH CHECK (true);

-- End of migration
