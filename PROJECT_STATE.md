# MediKiosk — CURRENT PROJECT STATE

> This file is updated after every meaningful development task.
> It tells AI agents exactly where the project currently stands.

---

# CURRENT PHASE

POST-PHASE 5 CLINICAL FOUNDATIONS & PHYSICIAN SECURITY HARDENING COMPLETE — PRODUCTION-READY CHECKPOINT

---

# CURRENT TASK

Physician Security Hardening & Home UI Finalization Complete (Commit `b1b1989`):
1. **Physician Portal Access Control & Hardening**:
   - Cryptographic HMAC-SHA256 session token management (`src/lib/auth/physician-session.ts`).
   - Edge-compatible route guard in `src/middleware.ts` intercepting all `/doctor/*` routes.
   - Unauthenticated visits redirected to `/doctor/login?redirect=...`.
   - Safe internal redirect parameter validation to prevent open-redirect vulnerabilities, defaulting to `/doctor`.
   - Server-side `getActivePhysicianSession()` verification enforced across physician server actions (`getPhysicianQueueAction`, `getPhysicianCaseDetailAction`, `getCanonicalEncounterJsonAction`).
   - Session invalidation on sign-out via `logoutPhysicianAction`.
   - `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` and `Pragma: no-cache` headers on protected doctor routes preventing browser history/bfcache exposure.
   - `SUPABASE_SERVICE_ROLE_KEY` verified server-only; never imported into client components or exposed to browser.
2. **Clinical Functionality Intact & Preserved**:
   - 7-step patient kiosk journey (`/patient/*`).
   - Multilingual conversational interview in English, Hindi, and Marathi.
   - Informed consent with timestamping and patient demographics identification (ABHA ID / demo cases).
   - Browser voice and text intake with real-time feedback.
   - Non-diagnostic chief complaint cleaning and multilingual semantic validation (`cleanChiefComplaint`).
   - Document upload, MIME/size validation, and private Supabase storage persistence.
   - Multimodal OCR clinical entity extraction (Gemini Vision + deterministic medical fallback).
   - Document-patient relevance verification (`verified`, `insufficient_info`, `mismatch`).
   - Provenance-anchored conversation structuring (symptoms, conditions, medications, allergies linked to kiosk step & verbatim quote).
   - Encounter-level canonical clinical JSON contract (`CanonicalEncounterRecord`).
   - Deterministic clinical safety and red-flag triage engine (`RULE_CARDIAC_CHEST_PAIN`).
   - Physician queue and interactive case review with canonical JSON viewer.
3. **Home Page UI Checkpoint**:
   - "Start Patient Intake" remains the dominant, high-contrast primary CTA.
   - "Attending Medical Staff Portal →" placed directly below the primary CTA (`mt-4`) as a subtle secondary text link.
   - Portal link sits at `~450px` from document top, visible within the initial 1366×768 desktop viewport without scrolling.
   - Trust badges (`Zero autonomous diagnosis`, `FHIR R4 Ready`) placed below the portal link.
   - Zero modifications to clinical, security, or backend logic for this UI refinement.
4. **All Verifications Passing**:
   - `npm run lint` → PASS (0 errors, 0 warnings).
   - `npx tsc --noEmit` → PASS (0 compilation errors).
   - `npm run build` → PASS (16/16 routes generated cleanly).
   - `npx tsx scripts/test-physician-auth.ts` → PASS (6/6 tests passed).
   - Protected route and server action access controls verified.

---

# COMPLETED

### 1. Foundation & Design System (Phase 0)
- [x] GitHub repository created and local workspace initialized
- [x] Next.js 16 initialized with App Router and TypeScript
- [x] Global healthcare design system tokens and Tailwind CSS configured
- [x] Accessible UI primitives (`Button`, `Card`, `Badge`, `Input`, `LoadingState`, `EmptyState`, `ErrorState`)
- [x] Layout components (`Navbar`, `Footer`, `PageContainer`)
- [x] MediKiosk landing page ("Capture. Structure. Review.")

### 2. Database, Storage & Security Hardening (Phase 1)
- [x] 12-table PostgreSQL schema with UUID PKs, check constraints, foreign-key indexes, and triggers (`20260908003600_initial_schema.sql`)
- [x] Private Supabase Storage bucket (`medical-documents`, 15 MB limit, PDF/image MIME restrictions)
- [x] Hardened RLS architecture (`20260908005000_harden_rls.sql`):
  - Anonymous client SELECT and direct mutation revoked across all 10 sensitive clinical tables
  - Direct client-side storage uploads eliminated (all uploads server-mediated via Next.js Server Actions using service role)
  - Append-only audit logging with zero client mutation policies
  - Strict status transition whitelisting for authenticated physicians
- [x] Migrations deployed to remote Supabase project via Supabase CLI
- [x] Synthetic demo fixtures deployed and verified (`lab_report_glycemic_aug2026.pdf` in storage + 43 seed rows across 3 demo cases in `supabase/seed.sql`)

### 3. Patient Intake Flow & Multilingual Conversational Engine (Phase 2)
- [x] Complete 7-step patient kiosk journey:
  - Step 1: `/patient` (Intake Hub & instructions)
  - Step 2: `/patient/language` (Language selection: English, Hindi, Marathi)
  - Step 3: `/patient/consent` (Informed consent with timestamping)
  - Step 4: `/patient/identify` (Patient demographics & ABHA ID / demo case selection)
  - Step 5: `/patient/mode` (General OPD vs AYUSH Pariksha)
  - Step 6: `/patient/interview` (Conversational intake experience)
  - Step 7: `/patient/review` (Summary review & kiosk submission)
- [x] Server-mediated persistence via Next.js Server Actions (`src/app/actions/intake.ts`):
  - `createOrResumeSessionAction`: binds session, consent, and patient profile in Supabase
  - `saveIntakeAnswerAction`: atomic persistence of questions and answers before conversation progresses
- [x] Multilingual conversational interview supporting English (`en`), Hindi (`hi`), and Marathi (`mr`)
- [x] Browser voice intake using Web Speech API with automatic speech recognition and graceful manual text editing fallback
- [x] Gemini question generation (`GeminiAIProvider`) with robust, deterministic rule-based fallback (`MockDeterministicProvider`) ensuring zero kiosk downtime

### 4. Deterministic Clinical Safety & Red-Flag Triage Engine (Phase 4)
- [x] Deterministic multilingual red-flag triage engine (`src/lib/clinical/triage.ts`)
- [x] Explainable safety evaluation without LLM hallucination risk
- [x] `RULE_CARDIAC_CHEST_PAIN`:
  - Triggers on acute chest pain/pressure/tightness + at least one secondary feature (diaphoresis, dyspnea, left arm/shoulder radiation, or severe intensity)
  - Evaluates cumulative patient responses across English, Hindi, and Marathi
- [x] Automatic session priority escalation: `clinical_sessions.priority` elevated to `'emergency'`
- [x] Server-mediated safety alert persistence in `triage_alerts` (`alert_level: 'critical_red_flag'`)
- [x] Idempotent duplicate alert prevention per session
- [x] Non-diagnostic clinical advisory banner presented to patient

### 5. Document Ingestion & Multimodal Processing (Phase 5)
- [x] Client dropzone (`/patient/documents`) with MIME validation, 15 MB limit, SHA-256 checksums
- [x] Server-mediated Supabase storage upload and database record creation
- [x] Multimodal OCR and structured extraction (`src/lib/ai/document-extractor.ts` using Gemini Vision + deterministic medical fallback)
- [x] Extraction of lab tests, medications, conditions, and issuing doctor/facility metadata
- [x] Persistence into `document_extractions` and `medical_timeline`
- [x] Interactive patient upload UI with drag-and-drop, progress indicators, extraction preview, and review continuation
- [x] Physician case-detail visibility of uploaded documents and extracted clinical findings at `/doctor/patients/[id]`

### 6. Physician Dashboard Access Control & Security Hardening
- [x] Cryptographic HMAC-SHA256 session token management (`src/lib/auth/physician-session.ts`)
- [x] Server-side routing interceptor in `src/middleware.ts` protecting all `/doctor/*` routes
- [x] Unauthorized or unauthenticated direct visits blocked and redirected to `/doctor/login?redirect=...`
- [x] Safe internal redirect handling (validated against open-redirect exploits)
- [x] Server-side session verification in physician server actions (`getPhysicianQueueAction`, `getPhysicianCaseDetailAction`, `getCanonicalEncounterJsonAction`)
- [x] Invalidation on sign-out via `logoutPhysicianAction`
- [x] Cache-Control: `no-store, no-cache, must-revalidate, max-age=0` and `Pragma: no-cache` to block browser history/bfcache exposure post-sign-out
- [x] Dedicated workstation portal (`/doctor/login`) with demo credentials and automated session sign-out
- [x] Isolated `SUPABASE_SERVICE_ROLE_KEY` to server-only execution; never exposed to browser
- [x] Validated via `scripts/test-physician-auth.ts` (6/6 tests passed)

### 7. Chief Complaint Quality & Multilingual Semantic Validation
- [x] Classifier in `src/lib/clinical/cleaner.ts`: distinguishes `meaningful`, `unclear_insufficient`, and `non_clinical_gibberish`
- [x] Strict non-diagnostic behavior (no medical diagnoses rendered)
- [x] Supports colloquial phrasing and noisy STT transcription across English, Hindi, and Marathi
- [x] Always preserves verbatim input in audit log while prompting patient to restate unclear/gibberish answers before confirmation
- [x] Validated via `scripts/test-chief-complaint-validation.ts` (14/14 tests passed)

### 8. Document-Patient Relevance Verification
- [x] Extracted patient header comparison engine (`evaluateDocumentPatientRelevance`)
- [x] 3-tier classification: `verified` (identity confirmed), `insufficient_info` (lacks header), and `mismatch` (demographics conflict)
- [x] Color-coded badges and explanatory banners on patient document portal and physician workstation
- [x] Validated via `scripts/test-document-relevance.ts` (6/6 tests passed)

### 9. Provenance-Anchored Conversation Structuring & Canonical JSON Contract
- [x] Normalized extraction of symptoms (onset, duration, severity, location, radiation), conditions, medications, allergies
- [x] Every entity anchored to exact kiosk `stepNumber` and verbatim quote
- [x] Encounter-level canonical JSON contract (`CanonicalEncounterRecord`) separating patient-provided, document-extracted, deterministic triage, and physician-verified data
- [x] Interactive physician JSON viewer component (`CanonicalJsonViewer`) with syntax highlighting, one-click copy, and file export
- [x] Validated via `scripts/test-canonical-json.ts` (38/38 tests passed across Demo Cases 1, 2, 3)

### 10. Home Page Layout & Viewport Finalization
- [x] "Start Patient Intake" maintained as dominant primary CTA
- [x] "Attending Medical Staff Portal →" positioned directly below primary CTA (`mt-4`) as subtle secondary text link
- [x] Portal link visible within initial 1366×768 desktop viewport without scrolling
- [x] Trust badges (`Zero autonomous diagnosis`, `FHIR R4 Ready`) placed below the portal link
- [x] Zero changes to clinical, security, or backend logic

---

# VERIFICATION STATUS

- [x] **Lint**: `npm run lint` PASSED (0 errors, 0 warnings)
- [x] **TypeScript**: `npx tsc --noEmit` PASSED (0 compilation errors)
- [x] **Production Build**: `npm run build` PASSED (16/16 routes generated cleanly)
- [x] **Physician Auth Test Suite**: `npx tsx scripts/test-physician-auth.ts` PASSED (6/6 tests passed):
  - Authorized physician profile existence
  - Signed session token creation
  - Session token cryptographic HMAC verification
  - Tampered token rejection
  - Corrupt payload rejection
  - Empty / null token handling
- [x] **Live Security & Middleware Verification**:
  - Unauthenticated `/doctor` → 307 redirect to `/doctor/login?redirect=%2Fdoctor`
  - Unauthenticated `/doctor/queue` → 307 redirect to `/doctor/login?redirect=%2Fdoctor%2Fqueue`
  - Unauthenticated `/doctor/patients/...` → 307 redirect to `/doctor/login?redirect=%2Fdoctor%2Fpatients%2F...`
  - Protected doctor routes receive `Cache-Control: no-store`
  - Physician server actions reject unauthenticated calls with `{ success: false, error: "Unauthorized: Active physician session required." }`
- [x] **Canonical Record Test Suite**: `npx tsx scripts/test-canonical-json.ts` PASSED (38/38 tests passed across Demo Cases 1, 2, 3)
- [x] **Chief Complaint Validation Test Suite**: `npx tsx scripts/test-chief-complaint-validation.ts` PASSED (14/14 tests passed)
- [x] **Document Relevance Test Suite**: `npx tsx scripts/test-document-relevance.ts` PASSED (6/6 tests passed)
- [x] **Triage Engine Test Suite**: `npx tsx scripts/test-triage.ts` PASSED (8/8 tests passed)
- [x] **Physician Queue Test Suite**: `npx tsx scripts/test-physician-queue.ts` PASSED (8/8 tests passed)

---

# BLOCKERS

None.

---

# KNOWN BUGS

None.

---

# BUILD STATUS

Verified clean (`next build` passed with 16/16 routes generated; `npm run lint` passed with 0 errors and 0 warnings).

---

# DEPLOYMENT STATUS

Not deployed (local Next.js development and production build verified; Git checkpoint pushed to `origin/main`).

---

# DATABASE STATUS

Connected and fully migrated on Supabase (12 tables, check constraints, hardened RLS policies, indexes, and private `medical-documents` storage bucket active).

---

# AI STATUS

- Gemini 1.5 Flash integrated server-side with strict 4-second timeout and temperature 0.2.
- Robust deterministic fallback provider active for zero-downtime offline kiosk operation.
- Credentials strictly server-mediated; never exposed to browser.

---

# DEMO STATUS

- Live Patient Intake Journey (Steps 1–7) fully functional with Supabase persistence.
- Step 6 `/patient/interview` conversational intake with voice and Gemini/deterministic questions fully functional.
- Step 6 `/patient/documents` fully functional with drag-and-drop upload, PDF/image validation, Supabase storage persistence, multimodal OCR extraction, patient-relevance verification, and clinical review integration.
- Live Physician Queue (`/doctor/patients`) and Case Review (`/doctor/patients/[id]`) fully functional with live Supabase data, canonical JSON viewer, and active physician session authorization.

---

# LAST VERIFIED

Commit `b1b1989`: Physician access control hardening, server action protection, cache headers, and final home page viewport refinement verified end-to-end with automated test suites, linting (`npm run lint`), type-checking (`npx tsc --noEmit`), and production build (`npm run build`).

---

# ACTIVE ROADMAP PHASE

PHASE 6 — FHIR R4 / INTEROPERABILITY (PLANNED / NOT IMPLEMENTED)

**Planned Scope Only**:
- Inspect the existing `CanonicalEncounterRecord` data contract.
- Design a FHIR R4 mapping layer around the existing clinical record without altering clinical intake or schema.
- Map appropriate standard FHIR R4 resources where supported by existing data:
  - `Patient` (demographics, ABHA identifier)
  - `Encounter` (class, status, service provider)
  - `Condition` (chief complaint, past medical conditions, document-extracted conditions)
  - `Observation` (symptoms, extracted lab results with values and reference ranges)
  - `MedicationStatement` / `MedicationRequest` (patient-reported and document-extracted medications)
  - `AllergyIntolerance` (patient-reported allergens and reactions)
  - `DocumentReference` (uploaded medical records and checksums)
  - `RiskAssessment` (deterministic red-flag triage findings)
- Provide a physician-facing FHIR JSON/Bundled representation and download/export capability on `/doctor/interoperability` and case review.
- Maintain ABDM (Ayushman Bharat Digital Mission) / Hospital Information System (HIS) integration as an architectural adapter/readiness pathway unless live integration is implemented.
- **Explicit Boundary**: Do NOT claim live ABDM integration. Do NOT claim production FHIR interoperability until actually implemented and tested.
- Do NOT introduce offline-first, HAPI FHIR, Redis, XGBoost, Ollama, Keycloak, or alternative technologies from outside the approved stack.

---

# DO NOT DO

- Do not build unrelated features.
- Do not implement analytics before the core workflow.
- Do not add RAG or vector search.
- Do not add unnecessary infrastructure or npm dependencies.
- Do not alter database migrations or RLS policies unless explicitly required.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` to the browser.
- Do not generate medical diagnoses; document extraction must produce structured factual clinical information only.
- Do not claim live ABDM or external EHR integration when only local adapter interfaces are defined.

---

# CHANGE LOG

## Checkpoint — Physician Security Hardening & Home UI Finalization (Commit b1b1989) (Completed)
- **Physician Portal Security Hardening**:
  - Implemented cryptographic HMAC-SHA256 session token management (`src/lib/auth/physician-session.ts`).
  - Added Edge-compatible route guard in `src/middleware.ts` intercepting `/doctor/*` and redirecting unauthenticated requests to `/doctor/login?redirect=...`.
  - Added safe internal redirect parameter validation to prevent open-redirect vulnerabilities, defaulting to `/doctor`.
  - Enforced server-side `getActivePhysicianSession()` verification inside `getPhysicianQueueAction`, `getPhysicianCaseDetailAction`, and `getCanonicalEncounterJsonAction` in `src/app/actions/doctor.ts`. Unauthenticated callers receive `{ success: false, error: "Unauthorized: Active physician session required." }`.
  - Added `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0` and `Pragma: no-cache` response headers on protected doctor routes to block browser history/bfcache exposure post-sign-out.
  - Implemented workstation sign-out action `logoutPhysicianAction` invalidating the HttpOnly session cookie and redirecting to `/doctor/login`.
  - Verified `SUPABASE_SERVICE_ROLE_KEY` remains strictly server-side; never imported in client components.
- **Home Page UI Finalization**:
  - Refined layout in `src/app/page.tsx` with compact hero vertical spacing (`py-10 sm:py-14`).
  - "Start Patient Intake" maintained as the dominant, high-contrast primary CTA.
  - "Attending Medical Staff Portal →" placed directly below the primary CTA (`mt-4`) as a subtle secondary text link, visible within the initial 1366×768 desktop viewport without scrolling.
  - Trust badges (`Zero autonomous diagnosis`, `FHIR R4 Ready`) placed below the portal link.
  - No changes to clinical, security, or backend logic.
- **Verification & Checkpoint**:
  - `npm run lint` PASSED (0 errors, 0 warnings).
  - `npx tsc --noEmit` PASSED (0 errors).
  - `npm run build` PASSED (16/16 routes generated cleanly).
  - `scripts/test-physician-auth.ts` PASSED (6/6 tests passed).
  - Committed and pushed to `origin/main` as commit `b1b1989`.

## Phase 5 — Pre-Implementation Document Infrastructure Inspection (Completed)
- Inspected existing schema: verified `documents`, `document_extractions`, `medical_timeline`, and `audit_logs` tables.
- Inspected storage configuration: verified private `medical-documents` bucket (15 MB limit, restricted MIME types).
- Inspected RLS policies: confirmed server-mediated architecture; authenticated physicians have read access; direct client uploads revoked.
- Confirmed zero database migrations or RLS modifications are needed for Phase 5.
- Formulated Phase 5 implementation plan and verification criteria.

## Checkpoint 6 — Live Supabase Physician Queue & Case Review (Completed)
- Implemented `getPhysicianQueueAction` in `src/app/actions/doctor.ts` querying live `clinical_sessions`, `patients`, and `triage_alerts`.
- Implemented clinical priority sorting in physician queue (`emergency` top-ranked, then `urgent`, then recency).
- Connected `/doctor/patients/page.tsx` to live Supabase queue data with emergency badges and filter stats.
- Implemented `getPhysicianCaseDetailAction` in `src/app/actions/doctor.ts` with lookup by UUID, session code, or demo slug.
- Connected `/doctor/patients/[id]/page.tsx` to live encounter data, rendering patient profile, critical red-flag alert banner, chronological Q&A with modality (`voice_browser`, `text`) and language tags.
- Authored automated test suite `scripts/test-physician-queue.ts` (8/8 tests passed).

## Phase 4 — Deterministic Clinical Safety & Red-Flag Triage Engine (Completed)
- Implemented deterministic clinical triage evaluator in `src/lib/clinical/triage.ts`.
- Created `RULE_CARDIAC_CHEST_PAIN` evaluating chest pain/tightness + diaphoresis, dyspnea, left radiation, or severe intensity across English, Hindi, and Marathi.
- Integrated safety evaluation into `saveIntakeAnswerAction` with strict persistence ordering (answer saved to DB before triage evaluation).
- Implemented automatic priority escalation (`clinical_sessions.priority = 'emergency'`) upon red-flag detection.
- Implemented server-mediated alert persistence in `triage_alerts` with idempotent duplicate prevention.
- Added non-diagnostic patient safety advisory alert to kiosk UI.
- Authored automated test suite `scripts/test-triage.ts` (8/8 tests passed).

## Phase 2 — Multilingual Voice & Patient Intake Experience (Completed)
- Created 7-step patient intake experience with persistent session state in `src/context/IntakeContext.tsx`.
- Implemented server actions `createOrResumeSessionAction` and `saveIntakeAnswerAction` in `src/app/actions/intake.ts`.
- Built browser voice input component utilizing Web Speech API with real-time listening indicators and editable fallback.
- Implemented Gemini conversational question generation in `src/lib/ai/gemini-provider.ts`.
- Implemented deterministic question fallback in `src/lib/ai/mock-provider.ts` for English, Hindi, and Marathi.

## Phase 1C — Synthetic Demo Seed & Storage Fixture Deployment (Completed)
- Generated synthetic PDF fixture (`lab_report_glycemic_aug2026.pdf`, 1,543 bytes).
- Uploaded fixture to private Supabase Storage bucket (`medical-documents`).
- Populated all 12 tables via `supabase/seed.sql` across 3 demo cases (43 total rows).
- Confirmed database document metadata matches physical storage object byte-for-byte and hash-for-hash.
- Confirmed 0 migration drift via `npx supabase db push --dry-run`.

## Phase 1C — Remote Database Migration Execution (Completed)
- Resolved PostgreSQL 42501 ownership error in `initial_schema.sql`.
- Deployed migrations `20260908003600_initial_schema.sql` and `20260908005000_harden_rls.sql` to remote Supabase project.

## Phase 1B — Database Migration, Security Audit & RLS Hardening (Completed)
- Authored 12 core tables in `initial_schema.sql`.
- Conducted security review in `docs/PHASE_1B_SECURITY_REVIEW.md`.
- Implemented RLS hardening in `harden_rls.sql` establishing Server-Mediated Kiosk pattern.

## Phase 1A — Database Schema Design (Completed)
- Authored architectural specification in `docs/PHASE_1A_DATABASE_SCHEMA.md`.

## Phase 0 — Foundation UI and Application Shell (Completed)
- Initialized UI primitives, layout components, landing page, patient routes, and physician routes.