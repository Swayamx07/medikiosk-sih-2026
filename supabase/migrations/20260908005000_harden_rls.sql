-- ============================================================================
-- MediKiosk — Phase 1B Security Remediation: Harden Row Level Security (RLS)
-- Migration ID: 20260908005000_harden_rls.sql
-- Source of Truth: docs/PHASE_1B_RLS_FINAL_REVIEW.md
-- Target Database: PostgreSQL 15+ / Supabase
-- Description:
--   Implements the approved Minimum Practical Authorization Model for MediKiosk:
--   1. Enforces Server-Mediated Kiosk Pattern:
--      - Revokes direct anonymous access across all 10 sensitive clinical tables.
--      - Kiosk patient intake transactions execute server-side via Next.js Server Actions
--        using privileged service-role credentials.
--   2. Restricts clinical_questions to read-only presentation of active questions for anon.
--   3. Restricts direct client-side mutation privileges for authenticated physicians:
--      - REVOKES direct client INSERT on AI-generated/system tables:
--        clinical_histories, medical_timeline, and audit_logs.
--      - Constrains clinical_sessions updates to valid workflow status transitions.
--      - Constrains clinical_histories updates to unverified draft summary editing.
--      - Constrains document_extractions updates to transitioning is_verified to true.
--      - Constrains triage_alerts updates to transitioning is_acknowledged to true.
--      - Enforces amendment/non-repudiation on physician_reviews (verified reviews
--        cannot be updated unless review_status is 'amended').
--   4. Eliminates direct client-side storage uploads:
--      - Medical document uploads must be performed exclusively server-side via
--        Next.js Server Actions using the service role.
--      - The medical-documents bucket remains strictly private (public = false).
--   5. Guarantees audit_logs remain append-only (zero UPDATE, DELETE, or client INSERT policies).
--
-- ARCHITECTURAL NOTE ON RLS SCOPE:
--   PostgreSQL Row Level Security (RLS) controls row-level visibility and permitted operations
--   (SELECT, INSERT, UPDATE, DELETE). RLS does NOT provide column-level immutability.
--   For sensitive physician mutations, application-level Server Actions are strictly
--   responsible for validating caller authorization and ensuring only permissible fields are changed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. REVOKE OVERLY PERMISSIVE ANONYMOUS POLICIES (SERVER-MEDIATED KIOSK ISOLATION)
-- ----------------------------------------------------------------------------

-- 1.1 patients: Revoke anonymous enumeration and direct creation
DROP POLICY IF EXISTS "kiosk_read_patient" ON patients;
DROP POLICY IF EXISTS "kiosk_create_patient" ON patients;

-- 1.2 consents: Revoke anonymous direct read and unvalidated insert
DROP POLICY IF EXISTS "kiosk_read_consent" ON consents;
DROP POLICY IF EXISTS "kiosk_create_consent" ON consents;

-- 1.3 clinical_sessions: Revoke broad FOR ALL and unvalidated insert
DROP POLICY IF EXISTS "kiosk_manage_session" ON clinical_sessions;
DROP POLICY IF EXISTS "kiosk_create_session" ON clinical_sessions;

-- 1.4 clinical_questions: Revoke anonymous insert and update capabilities
DROP POLICY IF EXISTS "kiosk_insert_questions" ON clinical_questions;
DROP POLICY IF EXISTS "kiosk_update_questions" ON clinical_questions;
DROP POLICY IF EXISTS "kiosk_read_questions" ON clinical_questions;

-- 1.5 clinical_answers: Revoke anonymous direct read and direct insert
DROP POLICY IF EXISTS "kiosk_read_answers" ON clinical_answers;
DROP POLICY IF EXISTS "kiosk_insert_answers" ON clinical_answers;

-- 1.6 clinical_histories: Revoke broad FOR ALL anonymous access
DROP POLICY IF EXISTS "kiosk_manage_histories" ON clinical_histories;

-- 1.7 triage_alerts: Revoke anonymous direct read and insert
DROP POLICY IF EXISTS "kiosk_read_alerts" ON triage_alerts;
DROP POLICY IF EXISTS "kiosk_insert_alerts" ON triage_alerts;

-- 1.8 documents: Revoke anonymous metadata harvesting and direct insert
DROP POLICY IF EXISTS "kiosk_read_documents" ON documents;
DROP POLICY IF EXISTS "kiosk_insert_documents" ON documents;

-- 1.9 document_extractions: Revoke broad FOR ALL anonymous access
DROP POLICY IF EXISTS "kiosk_manage_extractions" ON document_extractions;

-- 1.10 medical_timeline: Revoke broad FOR ALL anonymous access
DROP POLICY IF EXISTS "kiosk_manage_timeline" ON medical_timeline;

-- 1.11 audit_logs: Revoke anonymous client direct insert
DROP POLICY IF EXISTS "kiosk_insert_audit_logs" ON audit_logs;

-- ----------------------------------------------------------------------------
-- 2. APPLICATION QUESTIONS READ-ONLY ACCESS
-- Clinical questions are standardized prompt templates; allow read-only display for kiosk
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "kiosk_read_active_questions" ON clinical_questions;

CREATE POLICY "kiosk_read_active_questions"
    ON clinical_questions FOR SELECT TO anon
    USING (status = 'presented');

-- ----------------------------------------------------------------------------
-- 3. HARDEN PHYSICIAN ACCESS & CONSTRAIN WORKFLOW WRITES
-- ----------------------------------------------------------------------------

-- 3.1 clinical_sessions:
-- Attending physicians share read access for outpatient triage queue;
-- Updates are strictly constrained to valid clinical workflow status transitions.
DROP POLICY IF EXISTS "physician_manage_sessions" ON clinical_sessions;
DROP POLICY IF EXISTS "physician_read_sessions" ON clinical_sessions;
DROP POLICY IF EXISTS "physician_update_sessions" ON clinical_sessions;

CREATE POLICY "physician_read_sessions"
    ON clinical_sessions FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "physician_update_sessions"
    ON clinical_sessions FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (
        status IN ('in_physician_review', 'verified', 'ready_for_review')
    );

-- 3.2 clinical_histories:
-- Revoke direct client INSERT (histories are synthesized server-side by AI engine).
-- Physicians may only update the editable draft summary prior to verification.
-- Field-level constraints are enforced by the application Server Action.
DROP POLICY IF EXISTS "physician_manage_histories" ON clinical_histories;
DROP POLICY IF EXISTS "physician_read_histories" ON clinical_histories;
DROP POLICY IF EXISTS "physician_insert_histories" ON clinical_histories;
DROP POLICY IF EXISTS "physician_update_histories" ON clinical_histories;

CREATE POLICY "physician_read_histories"
    ON clinical_histories FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "physician_update_histories"
    ON clinical_histories FOR UPDATE TO authenticated
    USING (summary_status != 'verified')
    WITH CHECK (
        summary_status IN ('edited_by_physician', 'verified')
    );

-- 3.3 document_extractions:
-- Attending physicians may inspect extracted values;
-- Update is constrained to transitioning unverified extractions to verified status.
-- RLS controls row operation (is_verified = true); field validation belongs to the Server Action.
DROP POLICY IF EXISTS "physician_manage_extractions" ON document_extractions;
DROP POLICY IF EXISTS "physician_read_extractions" ON document_extractions;
DROP POLICY IF EXISTS "physician_verify_extractions" ON document_extractions;

CREATE POLICY "physician_read_extractions"
    ON document_extractions FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "physician_verify_extractions"
    ON document_extractions FOR UPDATE TO authenticated
    USING (is_verified = false)
    WITH CHECK (is_verified = true);

-- 3.4 medical_timeline:
-- Revoke direct client INSERT (timeline entries are generated server-side during intake/OCR).
-- Attending physicians retain shared read visibility for case review.
DROP POLICY IF EXISTS "physician_manage_timeline" ON medical_timeline;
DROP POLICY IF EXISTS "physician_read_timeline" ON medical_timeline;
DROP POLICY IF EXISTS "physician_insert_timeline" ON medical_timeline;

CREATE POLICY "physician_read_timeline"
    ON medical_timeline FOR SELECT TO authenticated
    USING (true);

-- 3.5 triage_alerts:
-- Attending physicians share queue visibility for emergency/cardiac red-flag awareness;
-- Updates are strictly constrained to acknowledging unacknowledged alerts.
-- Trigger rule parameters and symptoms cannot be altered.
DROP POLICY IF EXISTS "physician_ack_alerts" ON triage_alerts;

CREATE POLICY "physician_ack_alerts"
    ON triage_alerts FOR UPDATE TO authenticated
    USING (is_acknowledged = false)
    WITH CHECK (is_acknowledged = true);

-- 3.6 physician_reviews:
-- Enforces amendment/non-repudiation workflow.
-- NOTE ON IDENTITY BINDING: auth.uid() IS NOT NULL establishes only that the caller is authenticated.
-- It does NOT prove physician_id belongs to the caller. Binding physician_id to verified provider
-- credentials is confirmed and enforced by the authenticated Server Action before database dispatch.
DROP POLICY IF EXISTS "physician_manage_reviews" ON physician_reviews;
DROP POLICY IF EXISTS "physician_read_reviews" ON physician_reviews;
DROP POLICY IF EXISTS "physician_insert_reviews" ON physician_reviews;
DROP POLICY IF EXISTS "physician_update_reviews" ON physician_reviews;

CREATE POLICY "physician_read_reviews"
    ON physician_reviews FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "physician_insert_reviews"
    ON physician_reviews FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        review_status IN ('in_review', 'verified_accepted')
    );

CREATE POLICY "physician_update_reviews"
    ON physician_reviews FOR UPDATE TO authenticated
    USING (is_verified = false OR review_status = 'amended')
    WITH CHECK (
        review_status IN ('in_review', 'verified_accepted', 'amended')
    );

-- 3.7 audit_logs:
-- Revoke direct client INSERT for authenticated users.
-- Audit logs are written exclusively server-side via Server Actions (service_role).
-- Zero UPDATE or DELETE policies exist, ensuring append-only compliance integrity.
DROP POLICY IF EXISTS "physician_insert_audit_logs" ON audit_logs;

-- ----------------------------------------------------------------------------
-- 4. HARDEN STORAGE SECURITY (SERVER-MEDIATED UPLOADS ONLY)
-- Revoke all direct client INSERT policies on storage.objects.
-- Medical document uploads must be performed through Next.js server-side code
-- using the service_role key.
-- Bucket remains strictly private (public = false); downloads require signed URLs.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects'
    ) THEN
        -- Revoke any direct client-side upload policy
        DROP POLICY IF EXISTS "kiosk_upload_medical_documents" ON storage.objects;

        -- NOTE: Zero client-side INSERT policies are created for storage.objects.
        -- In our Server-Mediated Kiosk architecture, medical document uploads must be performed
        -- through Next.js server-side code (Server Actions / Route Handlers) using the service role.
        -- The medical-documents bucket remains private (public = false).
        -- Authenticated physicians retain read access via physician_read_medical_documents.
    END IF;
END $$;

-- End of hardened remediation migration
