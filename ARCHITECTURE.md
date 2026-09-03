# MediKiosk — SYSTEM ARCHITECTURE

---

# 1. HIGH-LEVEL ARCHITECTURE

Patient
↓
Next.js Patient Interface
↓
Clinical Session
↓
Clinical Engine
↓
Structured Clinical Record
↓
Safety / Red-Flag Engine
↓
Database
↓
Physician Dashboard
↓
Physician Verification
↓
FHIR Transformer
↓
ABDM/HIS Adapter

---

# 2. APPLICATION ARCHITECTURE

Next.js App Router

Patient routes:

/patient
/patient/language
/patient/consent
/patient/identify
/patient/mode
/patient/interview
/patient/documents
/patient/review

Doctor routes:

/doctor
/doctor/patients
/doctor/patients/[id]
/doctor/interoperability

---

# 3. CORE MODULES

src/

- app/
- components/
- lib/
- services/
- types/
- hooks/
- data/

---

# 4. AI ARCHITECTURE

AIProvider

Methods should conceptually support:

- extractClinicalInformation()
- generateNextQuestion()
- summarizeClinicalCase()
- extractDocument()
- translateClinicalContent()

Implementations:

GeminiAIProvider
MockAIProvider

Business logic should depend on AIProvider, not directly on Gemini.

---

# 5. AI PIPELINE

Patient Input
↓
AI Provider
↓
Structured JSON
↓
Schema Validation
↓
Clinical State
↓
Persistence

Never:

Patient Input
↓
Raw LLM text
↓
Database

---

# 6. CLINICAL INTERVIEW ENGINE

Clinical Session
↓
Current Clinical State
↓
Known Information
↓
Missing Information
↓
Question Selection
↓
Patient Answer
↓
Extraction
↓
State Update
↓
Next Question

The system should avoid asking questions when the required information is already known.

---

# 7. RED-FLAG ENGINE

Patient Response
↓
AI / parser extracts symptoms
↓
Structured symptom object
↓
Deterministic rule engine
↓
Potential Red Flag
↓
Priority Alert
↓
Physician Dashboard

The LLM should not directly determine the final triage status.

---

# 8. DOCUMENT PIPELINE

Document Upload
↓
Supabase Storage
↓
Gemini Multimodal Processing
↓
Structured Extraction
↓
Schema Validation
↓
Document Extraction
↓
Clinical Record
↓
Timeline

---

# 9. PHYSICIAN WORKFLOW

Patient completes intake
↓
Case becomes available
↓
Physician opens case
↓
Priority indicators
↓
Patient overview
↓
Clinical history
↓
Previous documents
↓
Medical timeline
↓
AI-generated summary
↓
Physician edits
↓
Physician verifies
↓
Audit event
↓
FHIR transformation

---

# 10. DATABASE CONCEPT

Core entities:

patients
clinical_sessions
clinical_questions
clinical_answers
clinical_histories
documents
document_extractions
medical_timeline
consents
triage_alerts
physician_reviews
audit_logs

Relationships must be simple and explainable.

Do not create unnecessary tables.

---

# 11. STORAGE

Supabase Storage stores uploaded synthetic documents.

Store metadata in PostgreSQL.

Never expose private storage objects unnecessarily.

---

# 12. FHIR ARCHITECTURE

Internal Clinical Record
↓
FHIR Transformer
↓
FHIR Resources
↓
FHIR Bundle

Potential resources:

Patient
Encounter
Condition
Observation
MedicationRequest
AllergyIntolerance
DocumentReference
Consent
Composition
Bundle

FHIR generation must be deterministic and based on structured internal data.

Do not ask an LLM to freely generate an entire FHIR Bundle.

---

# 13. ABDM ARCHITECTURE

Define:

ABDMAdapter

Implementation:

MockABDMAdapter

Future:

ProductionABDMAdapter

Flow:

Clinical Record
↓
FHIR Transformer
↓
ABDM Adapter
↓
Payload / Integration Operation

For the SIH prototype, mock/sandbox behavior is acceptable if clearly labelled.

Never claim production integration if it is not implemented.

---

# 14. VOICE ARCHITECTURE

ASRProvider

Implementations:

BrowserASRProvider
FutureBhashiniProvider

The clinical engine should receive normalized text regardless of the ASR provider.

Voice should therefore not be tightly coupled to the clinical engine.

---

# 15. MULTILINGUAL ARCHITECTURE

Language
↓
Question generation
↓
Patient response
↓
Clinical extraction
↓
Canonical structured representation
↓
Physician display language

Clinical data should have a canonical structured representation independent of UI language.

---

# 16. SECURITY

Secrets:

- Gemini API key
- Supabase service role key

must remain server-side.

Never:

- Commit .env files
- Put service keys in client components
- Expose secrets in API responses
- Log API keys

---

# 17. ERROR HANDLING

Every external dependency must have a failure strategy.

Gemini failure:
→ MockAIProvider / graceful fallback

Upload failure:
→ User-friendly error

Malformed AI response:
→ Validation failure
→ Retry or fallback

Database failure:
→ Error state
→ No silent data corruption

---

# 18. ARCHITECTURAL CONSTRAINTS

Do NOT introduce:

- Microservices
- Kubernetes
- Redis
- Kafka
- Vector databases
- RAG
- Separate Python backend
- Separate Express backend
- Custom ML infrastructure

unless explicitly approved by the project owner.

---

# 19. ARCHITECTURAL DECISION RULE

The simplest architecture capable of reliably demonstrating the SIH problem is preferred.

Complexity must have a concrete reason.