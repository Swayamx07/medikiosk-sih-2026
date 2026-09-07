# MediKiosk — Phase 1B Security & RLS Review

> **Document Status:** SECURITY REVIEW & AUDIT REPORT  
> **Target File Under Review:** [`supabase/migrations/20260908003600_initial_schema.sql`](file:///d:/casex-sih/supabase/migrations/20260908003600_initial_schema.sql)  
> **Supporting Files:** [`supabase/config.toml`](file:///d:/casex-sih/supabase/config.toml), [`docs/PHASE_1A_DATABASE_SCHEMA.md`](file:///d:/casex-sih/docs/PHASE_1A_DATABASE_SCHEMA.md)  
> **Review Date:** 2026-09-08  
> **Reviewer:** Senior Developer / Clinical Systems Security Auditor  
> **Remote Database Execution Status:** **NOT EXECUTED — ZERO REMOTE CHANGES APPLIED**

---

## 1. Executive Summary & Security Verdict

### 1.1 Overall Security Verdict
**VERDICT: CONDITIONAL PASS — REQUIRES RLS HARDENING PRIOR TO REMOTE EXECUTION**

The relational architecture, table structures, UUID conventions, constraints, triggers, indexes, and storage bucket definitions in `20260908003600_initial_schema.sql` are **technically sound, normalized, and compliant** with the clinical design requirements established in Phase 1A.

However, the **Row Level Security (RLS) policies for the `anon` (kiosk) role are currently overly permissive** (`USING (true)` / `WITH CHECK (true)`). If executed in this current state on a public Supabase instance, any anonymous client possessing the public `anon` key could read, mutate, or delete records belonging to other kiosk sessions across several core clinical tables.

Because MediKiosk utilizes Next.js server-side operations (Server Actions / Route Handlers) for privileged coordination:
- The `anon` client should have **zero direct read or write access** to sensitive consolidated clinical records, OR
- Access must be strictly scoped via a server-generated session token / header claim (e.g., `current_setting('app.current_session_id', true)`), OR
- All patient-facing writes must be mediated by server-side actions utilizing the service role.

---

## 2. Table-by-Table & Component Review

| Component / Table | Definition & Constraints | Indexes & Triggers | RLS Enabled | Anon Security Status | Authenticated Security Status | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. `patients`** | PASS (`UUID`, derived age) | PASS (2 indexes, trigger) | PASS | **HIGH RISK:** Can read all demo patients | PASS (Can view all) | **HIGH** |
| **2. `clinical_sessions`** | PASS (`CHECK` constraints) | PASS (4 indexes, trigger) | PASS | **CRITICAL:** `FOR ALL TO anon USING (true)` | PASS (Physician manage) | **CRITICAL** |
| **3. `consents`** | PASS (Scope checks) | PASS (3 indexes) | PASS | **MEDIUM:** `SELECT TO anon USING (true)` | PASS (Physician read) | **MEDIUM** |
| **4. `clinical_questions`** | PASS (`step_number >= 1`) | PASS (2 indexes) | PASS | **MEDIUM:** `UPDATE TO anon USING (true)` | PASS (Physician read) | **MEDIUM** |
| **5. `clinical_answers`** | PASS (Range checks) | PASS (2 indexes) | PASS | **CRITICAL:** `SELECT TO anon USING (true)` | PASS (Read-only for doctor) | **CRITICAL** |
| **6. `clinical_histories`** | PASS (`JSONB`, triggers) | PASS (2 indexes, trigger) | PASS | **CRITICAL:** `FOR ALL TO anon USING (true)` | PASS (Physician manage) | **CRITICAL** |
| **7. `triage_alerts`** | PASS (Alert levels) | PASS (4 indexes incl. partial) | PASS | **HIGH:** `SELECT TO anon USING (true)` | PASS (Can acknowledge) | **HIGH** |
| **8. `documents`** | PASS (MIME & 15MB checks) | PASS (3 indexes) | PASS | **MEDIUM:** `SELECT TO anon USING (true)` | PASS (Physician read) | **MEDIUM** |
| **9. `document_extractions`**| PASS (Normalized JSONB) | PASS (2 indexes, trigger) | PASS | **CRITICAL:** `FOR ALL TO anon USING (true)` | PASS (Physician manage) | **CRITICAL** |
| **10. `medical_timeline`** | PASS (Event types) | PASS (4 indexes incl. partial) | PASS | **CRITICAL:** `FOR ALL TO anon USING (true)` | PASS (Physician manage) | **CRITICAL** |
| **11. `physician_reviews`** | PASS (Sign-off & FHIR) | PASS (3 indexes, trigger) | PASS | **PASS:** `anon` completely blocked | **MEDIUM:** Unrestricted post-verification | **MEDIUM** |
| **12. `audit_logs`** | PASS (Event taxonomy) | PASS (4 indexes) | PASS | **PASS:** Append-only (no update/delete) | PASS (Read & Append only) | **PASS** |
| **Storage Bucket** | PASS (Private, 15MB) | N/A | PASS | **HIGH:** Upload path unconstrained | PASS (Read-only for doctor) | **HIGH** |

---

## 3. Detailed Verification Against Specific Security Inquiries

### Question 1: Can an anonymous kiosk user read another patient's data?
- **Finding:** **YES (CRITICAL / HIGH VULNERABILITY)**
- **Technical Evidence in Migration:**
  - `clinical_answers`: Policy `"kiosk_read_answers"` on `clinical_answers FOR SELECT TO anon USING (true);` allows any unauthenticated client to query and extract verbatim statements and extracted symptoms of every patient in the database.
  - `clinical_histories`: Policy `"kiosk_manage_histories"` on `clinical_histories FOR ALL TO anon USING (true)` allows complete read access to every synthesized clinical history, current medications, allergies, and diagnoses.
  - `document_extractions`: Policy `"kiosk_manage_extractions"` on `document_extractions FOR ALL TO anon USING (true)` exposes all extracted laboratory test results (e.g. HbA1c, biopsy results) and medication prescriptions.
  - `medical_timeline`: Policy `"kiosk_manage_timeline"` on `medical_timeline FOR ALL TO anon USING (true)` exposes all chronological disease histories and abnormal flags.
  - `patients`: Policy `"kiosk_read_patient"` allows selecting any patient record where `is_demo = true`. Since all demonstration patients have `is_demo = true`, any kiosk user can list all demo patients.
  - `triage_alerts`: Policy `"kiosk_read_alerts"` allows selecting all active and past red-flag alerts.
- **Classification:** **CRITICAL**

---

### Question 2: Can an anonymous user modify or delete another patient's data?
- **Finding:** **YES (CRITICAL VULNERABILITY)**
- **Technical Evidence in Migration:**
  - `clinical_sessions`: Policy `"kiosk_manage_session"` specifies `FOR ALL TO anon USING (true) WITH CHECK (true);`. This allows an anonymous user to execute `UPDATE` or `DELETE` on any other patient's intake session.
  - `clinical_histories`: Policy `"kiosk_manage_histories"` specifies `FOR ALL TO anon USING (true) WITH CHECK (true);`. An anonymous actor can overwrite or delete another patient's consolidated clinical history.
  - `document_extractions`: Policy `"kiosk_manage_extractions"` specifies `FOR ALL TO anon USING (true) WITH CHECK (true);`. An anonymous user can alter extracted lab values or delete extraction records.
  - `medical_timeline`: Policy `"kiosk_manage_timeline"` specifies `FOR ALL TO anon USING (true) WITH CHECK (true);`. An anonymous user can delete or tamper with timeline entries.
  - `clinical_questions`: Policy `"kiosk_update_questions"` specifies `FOR UPDATE TO anon USING (true);`. An anonymous user can alter question texts or options presented to other users.
- **Classification:** **CRITICAL**

---

### Question 3: Can an anonymous user access medical documents belonging to another patient?
- **Finding:** **PARTIALLY MITIGATED (MEDIUM / HIGH RISK)**
- **Technical Evidence in Migration:**
  - **Storage Object Binary Access (PASS):** In `storage.objects`, policy `"physician_read_medical_documents"` is restricted to `authenticated`. The `anon` role has **zero** `SELECT` policy on `storage.objects`. Therefore, an anonymous user cannot download binary files directly from the storage bucket.
  - **Storage Metadata Exposure (MEDIUM):** In the `documents` table, policy `"kiosk_read_documents"` permits `SELECT TO anon USING (true);`. An anonymous user can view metadata for all uploaded documents (including original filenames, storage paths, file sizes, and processing statuses).
  - **Storage Overwrite / Path Traversal Risk (HIGH):** In `storage.objects`, policy `"kiosk_upload_medical_documents"` specifies:
    ```sql
    CREATE POLICY "kiosk_upload_medical_documents"
        ON storage.objects FOR INSERT TO anon, authenticated
        WITH CHECK (bucket_id = 'medical-documents');
    ```
    There is no folder or session path constraint enforcing `storage.foldername(name)[1] = 'patients'`. An anonymous user could upload files to arbitrary paths or collide with another patient's object key.
- **Classification:** **HIGH**

---

### Question 4: Can an authenticated physician access patient records appropriately?
- **Finding:** **YES (PASS)**
- **Technical Evidence in Migration:**
  - Authenticated physicians have explicit `SELECT` or `ALL` access to:
    - `patients` (`physician_read_patients`)
    - `clinical_sessions` (`physician_manage_sessions`)
    - `consents` (`physician_read_consents`)
    - `clinical_questions` (`physician_read_questions`)
    - `clinical_answers` (`physician_read_answers`)
    - `clinical_histories` (`physician_manage_histories`)
    - `triage_alerts` (`physician_read_alerts` & `physician_ack_alerts`)
    - `documents` (`physician_read_documents`)
    - `document_extractions` (`physician_manage_extractions`)
    - `medical_timeline` (`physician_manage_timeline`)
    - `physician_reviews` (`physician_manage_reviews`)
    - `audit_logs` (`physician_read_audit_logs`)
    - `storage.objects` (`physician_read_medical_documents`)
- **Classification:** **PASS**

---

### Question 5: Can a physician accidentally modify raw patient answers?
- **Finding:** **NO (PASS)**
- **Technical Evidence in Migration:**
  - On `clinical_answers`, the policy for `authenticated` is:
    ```sql
    CREATE POLICY "physician_read_answers"
        ON clinical_answers FOR SELECT TO authenticated
        USING (true);
    ```
  - There is **no `UPDATE` or `DELETE` policy** defined for `authenticated` on `clinical_answers`.
  - A physician query attempting `UPDATE clinical_answers SET raw_answer_text = ...` will be rejected by PostgreSQL RLS. Raw patient testimony is protected.
- **Classification:** **PASS**

---

### Question 6: Can a physician modify verified clinical information?
- **Finding:** **YES (MEDIUM RISK)**
- **Technical Evidence in Migration:**
  - On `physician_reviews`:
    ```sql
    CREATE POLICY "physician_manage_reviews"
        ON physician_reviews FOR ALL TO authenticated
        USING (true);
    ```
  - On `clinical_histories`:
    ```sql
    CREATE POLICY "physician_manage_histories"
        ON clinical_histories FOR ALL TO authenticated
        USING (true);
    ```
  - There is no conditional check preventing `UPDATE` or `DELETE` once `is_verified = true`. A physician can overwrite or delete an already finalized and verified medical record. In medical legal systems, verified records should be immutable or require an amendment entry.
- **Classification:** **MEDIUM**

---

### Question 7: Are service-role credentials required anywhere in the browser?
- **Finding:** **NO (PASS)**
- **Technical Evidence in Migration:**
  - The schema and policies do not depend on exposing `SUPABASE_SERVICE_ROLE_KEY` in client components.
  - Client components only ever interact via the public `anon` key or authenticated user JWT.
  - Privileged backend operations (AI extraction pipelines, deterministic triage rule evaluations, system audit writes) occur server-side within Next.js Server Actions.
- **Classification:** **PASS**

---

### Question 8: Are there any policies using overly broad conditions such as `USING (true)` or `WITH CHECK (true)`?
- **Finding:** **YES (MULTIPLE CRITICAL / HIGH INSTANCES)**
- **Technical Evidence in Migration:**
  - **`anon` policies with `USING (true)` / `WITH CHECK (true)`:**
    1. `consents`: `kiosk_create_consent` (`WITH CHECK (true)`), `kiosk_read_consent` (`USING (true)`)
    2. `clinical_sessions`: `kiosk_create_session` (`WITH CHECK (true)`), `kiosk_manage_session` (`USING (true) WITH CHECK (true)`)
    3. `clinical_questions`: `kiosk_read_questions` (`USING (true)`), `kiosk_insert_questions` (`WITH CHECK (true)`), `kiosk_update_questions` (`USING (true)`)
    4. `clinical_answers`: `kiosk_insert_answers` (`WITH CHECK (true)`), `kiosk_read_answers` (`USING (true)`)
    5. `clinical_histories`: `kiosk_manage_histories` (`USING (true) WITH CHECK (true)`)
    6. `triage_alerts`: `kiosk_insert_alerts` (`WITH CHECK (true)`), `kiosk_read_alerts` (`USING (true)`)
    7. `documents`: `kiosk_insert_documents` (`WITH CHECK (true)`), `kiosk_read_documents` (`USING (true)`)
    8. `document_extractions`: `kiosk_manage_extractions` (`USING (true) WITH CHECK (true)`)
    9. `medical_timeline`: `kiosk_manage_timeline` (`USING (true) WITH CHECK (true)`)
    10. `storage.objects`: `kiosk_upload_medical_documents` (`WITH CHECK (bucket_id = 'medical-documents')`)
- **Classification:** **CRITICAL**

---

### Question 9: Are there any tables accidentally left without RLS?
- **Finding:** **NO (PASS)**
- **Technical Evidence in Migration (Lines 481-492):**
  - All 12 tables explicitly execute `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.
  - In addition, `storage.objects` explicitly executes `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`.
  - Zero tables are left unprotected.
- **Classification:** **PASS**

---

## 4. Comprehensive Issues & Risk Registry

| ID | Issue Description | Affected Object | Severity | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Anonymous users can read all clinical histories, answers, extractions, and timeline events | `clinical_histories`, `clinical_answers`, `document_extractions`, `medical_timeline` | **CRITICAL** | Severe PHI data leakage across kiosk sessions |
| **SEC-02** | Anonymous users can update or delete sessions, histories, extractions, and timelines | `clinical_sessions`, `clinical_histories`, `document_extractions`, `medical_timeline` | **CRITICAL** | Data tampering, denial of service, session hijacking |
| **SEC-03** | Anonymous users can read all active red-flag triage alerts | `triage_alerts` | **HIGH** | Clinical safety status leakage |
| **SEC-04** | Anonymous users can view document metadata for all uploaded patient records | `documents` | **MEDIUM** | Metadata / filename leakage |
| **SEC-05** | Storage upload path is unconstrained to specific session folders | `storage.objects` | **HIGH** | Potential file collision or arbitrary file upload in bucket |
| **SEC-06** | Verified physician reviews and clinical histories can be modified post-verification | `physician_reviews`, `clinical_histories` | **MEDIUM** | Breach of medical record non-repudiation |
| **SEC-07** | Anonymous users can read all demo patient demographic rows | `patients` | **HIGH** | Synthetic PII enumeration |

---

## 5. Recommended Fixes (To Be Implemented in Schema Remediation)

### Strategy: Server-Mediated Kiosk Pattern (Recommended Architecture)
Since MediKiosk is built on Next.js 16 App Router with Server Actions:
1. **Revoke direct `anon` read access on consolidated clinical tables:**
   - Remove `kiosk_read_answers`, `kiosk_manage_histories`, `kiosk_manage_extractions`, `kiosk_manage_timeline`, `kiosk_read_alerts`, and `kiosk_read_documents` for `anon`.
   - The kiosk UI does not need direct Supabase client `SELECT` access to raw tables; it receives its session state directly from Next.js Server Actions which validate the active session in memory/cookies.
2. **Restrict `anon` mutations strictly to `INSERT`:**
   - Change `FOR ALL TO anon` on `clinical_sessions`, `clinical_histories`, `document_extractions`, and `medical_timeline` to **`FOR INSERT TO anon`** only (or handle insertion exclusively via server actions using service-role).
   - Drop `kiosk_update_questions` (`anon` should never update questions).
3. **Restrict Storage Object Upload Paths:**
   - Add path constraint in storage policy:
     ```sql
     CREATE POLICY "kiosk_upload_medical_documents"
         ON storage.objects FOR INSERT TO anon, authenticated
         WITH CHECK (
             bucket_id = 'medical-documents' AND
             (storage.foldername(name))[1] = 'patients'
         );
     ```
4. **Enforce Post-Verification Immutability:**
   - In `physician_reviews`, add a `WITH CHECK` constraint ensuring that once `is_verified = true`, updates are blocked or only allow specific status transitions:
     ```sql
     CREATE POLICY "physician_update_reviews"
         ON physician_reviews FOR UPDATE TO authenticated
         USING (is_verified = false OR review_status = 'amended')
         WITH CHECK (true);
     ```

---

## 6. Remote Database Verification Status

> **CONFIRMATION:**  
> - **Remote Supabase Instance:** NOT CONNECTED / NOT MODIFIED.  
> - **Migration Execution:** 0 migrations executed.  
> - **Database Tables:** 0 tables created remotely.  
> - **Application Code:** 0 files modified.  
> - **Seed Data:** 0 rows inserted.  
> 
> All findings in this document represent a **pre-execution static security audit** of [`supabase/migrations/20260908003600_initial_schema.sql`](file:///d:/casex-sih/supabase/migrations/20260908003600_initial_schema.sql).
