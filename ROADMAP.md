# CaseX — 48-HOUR DEVELOPMENT ROADMAP

This roadmap controls development order.

Do not skip ahead unnecessarily.

P0 functionality must be stable before spending significant time on P1/P2 features.

---

# PHASE 0 — FOUNDATION

Status: NOT STARTED

- [ ] Next.js project initialized
- [ ] TypeScript configured
- [ ] Tailwind configured
- [ ] shadcn/ui configured
- [ ] Base layout created
- [ ] Git repository connected
- [ ] Environment variable structure created
- [ ] Basic error handling
- [ ] Basic loading UI
- [ ] Initial deployment setup

Acceptance:

Application starts successfully and the project structure is stable.

---

# PHASE 1 — DATABASE & STORAGE

Status: NOT STARTED

- [ ] Supabase project connected
- [ ] Database schema created
- [ ] patients table
- [ ] clinical_sessions table
- [ ] clinical_questions table
- [ ] clinical_answers table
- [ ] clinical_histories table
- [ ] documents table
- [ ] document_extractions table
- [ ] medical_timeline table
- [ ] consents table
- [ ] triage_alerts table
- [ ] physician_reviews table
- [ ] audit_logs table
- [ ] Storage bucket
- [ ] Basic RLS
- [ ] Synthetic demo data

Acceptance:

Data can be created, retrieved and updated safely.

---

# PHASE 2 — PATIENT ONBOARDING

Status: NOT STARTED

- [ ] Welcome screen
- [ ] Language selection
- [ ] Consent
- [ ] Patient identification/demo selection
- [ ] Clinical mode selection
- [ ] Session creation

Acceptance:

A patient can start a complete clinical intake session.

---

# PHASE 3 — CLINICAL INTERVIEW

Status: NOT STARTED

- [ ] Interview interface
- [ ] Text input
- [ ] Question rendering
- [ ] Answer capture
- [ ] Clinical state
- [ ] Structured answers
- [ ] Required information tracking
- [ ] Adaptive question engine
- [ ] Gemini extraction
- [ ] Mock AI fallback
- [ ] JSON validation

Acceptance:

Patient can complete a meaningful clinical history and the system produces structured clinical data.

---

# PHASE 4 — SAFETY / RED FLAGS

Status: NOT STARTED

- [ ] Symptom normalization
- [ ] Red-flag rules
- [ ] Priority classification
- [ ] Alert generation
- [ ] Physician dashboard alert
- [ ] Explainable trigger information

Acceptance:

Demo Case 1 reliably generates the configured potential red-flag alert.

---

# PHASE 5 — DOCUMENT INTELLIGENCE

Status: NOT STARTED

- [ ] Document upload
- [ ] Supabase Storage
- [ ] Document preview
- [ ] Gemini multimodal extraction
- [ ] Structured extraction
- [ ] Extraction validation
- [ ] Abnormal laboratory values
- [ ] Medication extraction
- [ ] Timeline generation

Acceptance:

Demo Case 2 document can be uploaded and converted into structured clinical information.

---

# PHASE 6 — MEDICAL TIMELINE

Status: NOT STARTED

- [ ] Timeline component
- [ ] Conditions
- [ ] Medications
- [ ] Lab results
- [ ] Documents
- [ ] Encounters
- [ ] Chronological ordering

Acceptance:

A physician can understand the patient's history visually.

---

# PHASE 7 — PHYSICIAN DASHBOARD

Status: NOT STARTED

- [ ] Patient queue
- [ ] Priority indicators
- [ ] Patient overview
- [ ] Clinical history
- [ ] Red flags
- [ ] Documents
- [ ] Timeline
- [ ] AI summary
- [ ] Edit summary
- [ ] Verification
- [ ] Audit event

Acceptance:

A physician can review and verify the complete case.

---

# PHASE 8 — FHIR

Status: NOT STARTED

- [ ] Patient resource
- [ ] Encounter
- [ ] Condition
- [ ] Observation
- [ ] MedicationRequest
- [ ] AllergyIntolerance
- [ ] DocumentReference
- [ ] Consent
- [ ] Composition
- [ ] Bundle
- [ ] FHIR viewer

Acceptance:

The CaseX patient record can be transformed into a coherent FHIR-compatible Bundle.

---

# PHASE 9 — ABDM ADAPTER

Status: NOT STARTED

- [ ] ABDMAdapter interface
- [ ] MockABDMAdapter
- [ ] Consent flow representation
- [ ] Record preparation
- [ ] Payload preparation
- [ ] Integration status UI

Acceptance:

The architecture clearly demonstrates how CaseX could integrate with ABDM/HIS systems.

The UI must clearly distinguish prototype/mock behavior from live production integration.

---

# PHASE 10 — AYUSH

Status: NOT STARTED

- [ ] AYUSH mode
- [ ] Dashavidha Pariksha data model
- [ ] AYUSH question flow
- [ ] Structured storage
- [ ] Physician display

Acceptance:

AYUSH intake can be demonstrated without disrupting the conventional clinical workflow.

---

# PHASE 11 — MULTILINGUAL & VOICE

Status: NOT STARTED

- [ ] English
- [ ] Hindi
- [ ] Marathi
- [ ] Language-aware question generation
- [ ] Voice input abstraction
- [ ] Browser speech recognition
- [ ] Voice fallback

Acceptance:

The core patient workflow can be demonstrated in multiple target languages.

---

# PHASE 12 — POLISH

Status: NOT STARTED

- [ ] Touch-friendly UI
- [ ] Accessibility
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Responsive layout
- [ ] Visual hierarchy
- [ ] Subtle animations
- [ ] Consistent icons
- [ ] Final UX polish

---

# PHASE 13 — HARDENING

Status: NOT STARTED

Test:

- [ ] Gemini unavailable
- [ ] Gemini malformed response
- [ ] Document upload failure
- [ ] Network failure
- [ ] Empty patient input
- [ ] Missing clinical data
- [ ] Invalid FHIR data
- [ ] Session interruption
- [ ] Refresh
- [ ] Browser restart
- [ ] Unauthorized access
- [ ] Mobile/tablet layout

---

# PHASE 14 — FINAL DEMO

Status: NOT STARTED

## Case 1

- [ ] Red flag workflow works
- [ ] Alert reaches physician dashboard

## Case 2

- [ ] Document upload works
- [ ] Extraction works
- [ ] Timeline works
- [ ] Summary works

## Case 3

- [ ] AYUSH workflow works

## Interoperability

- [ ] FHIR Bundle works
- [ ] ABDM mock adapter works

## Final

- [ ] Vercel deployment
- [ ] Production environment variables
- [ ] Backup local environment
- [ ] Demo recording
- [ ] Final presentation
- [ ] Final rehearsal

---

# FEATURE FREEZE

Once the core demo works:

NO NEW MAJOR FEATURES.

Remaining time should be spent on:

TESTING
BUG FIXING
RELIABILITY
UX POLISH
DEMO REHEARSAL

---

# GOLDEN RULE

Never implement a lower-priority feature while a higher-priority feature is broken.