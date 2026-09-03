# MediKiosk — AI PROJECT CONTEXT

> This file is the primary source of truth for every AI coding agent working on MediKiosk.
> Read this file before performing any development task.

---

# 1. PROJECT IDENTITY

## Product Name

MediKiosk

## Product Type

AI-powered Patient Case-Taking Software.

## Hackathon

Smart India Hackathon (SIH) 2026.

## Problem Statement

Patient Case-Taking Software.

## Core Purpose

MediKiosk is designed to capture a patient's clinical history before physician consultation using a conversational, multimodal, multilingual interface.

The system converts patient-provided information into a structured clinical record that can be reviewed and verified by a physician.

MediKiosk is NOT a generic chatbot.

MediKiosk is NOT a diagnostic system.

MediKiosk is NOT intended to replace physicians.

The physician remains the final decision-maker.

---

# 2. PRIMARY PROJECT OBJECTIVE

The primary objective is to build a reliable, polished, demonstrable SIH prototype.

The complete core workflow is:

Patient
→ Language Selection
→ Consent
→ Patient Identification
→ Clinical Interview
→ Adaptive Questions
→ Structured Clinical History
→ Red-Flag Detection
→ Previous Medical Document Upload
→ Document Intelligence
→ Medical Timeline
→ Physician Dashboard
→ AI-Generated Clinical Summary
→ Physician Review/Edit
→ Physician Verification
→ FHIR Representation
→ ABDM/HIS Integration Architecture

The system should demonstrate this workflow clearly rather than attempting to implement every possible healthcare feature.

---

# 3. CORE PRINCIPLE

The project is judged primarily on:

1. Problem understanding
2. Functional prototype
3. End-to-end workflow
4. Innovation
5. Clinical usefulness
6. Reliability
7. User experience
8. Interoperability
9. Scalability
10. Presentation/demo quality

Therefore:

WORKING FUNCTIONALITY > CODE VOLUME

DEMO RELIABILITY > ARCHITECTURAL COMPLEXITY

CORE FEATURES > EXTRA FEATURES

DEPTH > BREADTH

---

# 4. THE ONE CORE DEMO

The most important demonstration is:

Patient arrives
→ chooses language
→ gives consent
→ provides symptoms conversationally
→ system asks adaptive clinical questions
→ information becomes structured clinical data
→ potential red flags are detected
→ previous documents are processed
→ information is placed on a timeline
→ physician receives a concise summary
→ physician reviews/edits/accepts it
→ structured healthcare data is represented using FHIR
→ ABDM integration architecture is demonstrated

Every major development decision should support this journey.

---

# 5. AI ROLE

AI is used for:

- Natural-language understanding
- Clinical information extraction
- Adaptive question generation
- Multilingual interaction
- Medical document extraction
- Clinical summarization
- Structuring unstructured information

AI must NOT:

- Diagnose diseases autonomously
- Prescribe medication
- Make final clinical decisions
- Invent patient information
- Invent laboratory values
- Invent medical history
- Invent medications
- Override physician decisions
- Present uncertain information as confirmed fact

---

# 6. SAFETY PRINCIPLE

AI-generated information is considered unverified until reviewed.

The system must distinguish between:

- Patient reported information
- Extracted information
- AI inferred information
- Clinically verified information

The physician must have final control over the clinical record.

---

# 7. RED-FLAG PRINCIPLE

Red-flag detection must NOT depend entirely on free-form LLM reasoning.

Use:

AI
↓
Structured symptom extraction
↓
Deterministic rule engine
↓
Potential red flag
↓
Physician attention

The AI may extract symptoms.

The deterministic clinical safety layer determines whether configured red-flag criteria are met.

The system must communicate that red-flag detection is a decision-support mechanism and not a diagnosis.

---

# 8. DEMO PATIENTS

Use synthetic/demo patients only.

Never use real patient personally identifiable information.

## Demo Case 1 — Priority / Red Flag

Symptoms:

- Chest pain
- Shortness of breath
- Sweating

Expected demonstration:

The system captures symptoms and detects a configured potential red flag.

Display a clear priority alert.

The physician dashboard should show the patient as requiring attention.

Do NOT label the patient with a definitive diagnosis.

---

## Demo Case 2 — Chronic Patient

Example history:

- Hypertension
- Diabetes
- Previous prescriptions
- Previous laboratory reports

Expected demonstration:

Document upload
→ AI extraction
→ structured medical information
→ abnormal-value highlighting
→ medical timeline
→ physician summary

---

## Demo Case 3 — AYUSH

Expected demonstration:

- AYUSH intake mode
- Dashavidha Pariksha structured data
- Appropriate questions
- Structured storage

AYUSH data must remain separate from inappropriate assumptions based on conventional medicine.

---

# 9. TECHNOLOGY

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Framer Motion where useful

## Backend

- Next.js server-side functionality
- Route handlers / server actions where appropriate

Do NOT create a separate Express backend unless explicitly approved.

## Database

- Supabase
- PostgreSQL

## Storage

- Supabase Storage

## AI

- Gemini multimodal API
- Structured JSON output
- Mock AI fallback

## Voice

Use an abstraction so the implementation can support:

- Browser speech recognition
- Future BHASHINI integration

## Interoperability

- FHIR R4-compatible representation
- ABDM adapter abstraction
- Mock/sandbox integration for demonstration

## Deployment

- Vercel
- Supabase

---

# 10. AI PROVIDER ARCHITECTURE

The application must not tightly couple business logic to Gemini.

Use an abstraction:

AIProvider
├── GeminiAIProvider
└── MockAIProvider

The application should be able to switch between them.

The MockAIProvider exists so that the complete demo can continue even if:

- API quota is exhausted
- API is unavailable
- Network fails
- AI response is malformed
- Demo environment has an outage

Never expose API keys to the browser.

---

# 11. STRUCTURED AI OUTPUT

AI responses should preferably use structured JSON.

Never depend on fragile string parsing when structured output can be used.

AI output must be validated before being saved or used by downstream systems.

Example:

Patient says:
"I have chest pain since yesterday."

Possible structured representation:

{
  "symptoms": [
    {
      "name": "chest pain",
      "onset": "yesterday",
      "source": "patient_reported",
      "confidence": "high"
    }
  ]
}

Do not add facts that the patient did not provide.

---

# 12. MULTILINGUAL PRINCIPLE

Initial target languages:

- English
- Hindi
- Marathi

The architecture should allow additional Indian languages later.

The system should preserve clinical meaning when converting between languages.

Do not translate clinical information in a way that changes its meaning.

---

# 13. DOCUMENT INTELLIGENCE

Supported demonstration documents:

- Prescription
- Laboratory report
- Discharge summary

Workflow:

Upload
→ Storage
→ Gemini multimodal processing
→ Structured extraction
→ Validation
→ Clinical record
→ Timeline

Extract:

- Document type
- Date
- Medication
- Dosage when explicitly present
- Laboratory test
- Value
- Unit
- Reference range
- Diagnosis/condition when explicitly present
- Relevant clinical entities

Never fabricate missing values.

---

# 14. PHYSICIAN-FIRST PRINCIPLE

The physician dashboard is not just a display screen.

The physician must be able to:

- Review extracted information
- See patient-reported information
- See AI-generated information
- See potential red flags
- Review documents
- View timeline
- Edit AI-generated summary
- Accept/verify information

The physician must remain in control.

---

# 15. INTEROPERABILITY

MediKiosk should represent clinical information using FHIR-compatible resources.

Potential resources include:

- Patient
- Encounter
- Condition
- Observation
- MedicationRequest
- AllergyIntolerance
- DocumentReference
- Consent
- Composition
- Bundle

ABDM integration should be represented using an adapter architecture.

Do not falsely claim live production ABDM integration if only a mock/sandbox integration exists.

---

# 16. ACCESSIBILITY

The interface should support:

- Large touch targets
- High contrast
- Clear typography
- Keyboard accessibility
- Screen-reader-friendly labels
- Simple navigation
- Minimal cognitive load

The patient kiosk should be usable by people with limited digital literacy.

---

# 17. ENGINEERING RULES

1. Do not over-engineer.
2. Do not create unnecessary microservices.
3. Do not add unnecessary dependencies.
4. Do not introduce technologies not approved by the architecture.
5. Do not rewrite unrelated code.
6. Do not change architecture without approval.
7. Do not build features outside the roadmap without approval.
8. Do not remove working functionality while adding new features.
9. Do not create fake integrations and present them as real.
10. Use synthetic data only.
11. Keep secrets server-side.
12. Validate AI output.
13. Handle API failures gracefully.
14. Every feature must have a clear acceptance criterion.
15. Every completed task must update PROJECT_STATE.md.

---

# 18. FEATURE PRIORITY

## P0 — MUST WORK

- Patient onboarding
- Language selection
- Consent
- Patient identification/demo mode
- Clinical interview
- Adaptive questioning
- Structured clinical record
- Red-flag detection
- Document upload
- Document extraction
- Medical timeline
- Physician dashboard
- AI-generated summary
- Physician editing
- Physician verification
- FHIR generation
- Mock AI fallback

## P1 — IMPORTANT

- Hindi
- Marathi
- Voice input
- AYUSH
- Dashavidha Pariksha
- Audit logging
- ABDM adapter
- Accessibility improvements

## P2 — ONLY AFTER P0/P1 ARE STABLE

- Advanced analytics
- Extra animations
- Additional dashboards
- Additional visualizations
- Additional convenience features

## P3 — DO NOT BUILD DURING MVP

- RAG
- Vector database
- Kubernetes
- Microservices
- Custom ML model training
- Custom OCR
- Custom ASR
- Mobile application
- Real Aadhaar authentication
- Production healthcare integrations
- Unnecessary real-time infrastructure

---

# 19. AGENT OPERATING PROCEDURE

Before every task:

1. Read AI_CONTEXT.md
2. Read PROJECT_STATE.md
3. Read ROADMAP.md
4. Read ARCHITECTURE.md if architecture is involved
5. Read REQUIREMENTS.md
6. Identify the current roadmap phase
7. Identify the exact assigned task

Then:

1. State what you understand
2. State which files you will modify
3. State acceptance criteria
4. Implement ONLY the assigned task
5. Test it
6. Fix issues caused by your implementation
7. Update PROJECT_STATE.md
8. Report completion

Do NOT:

- Jump to the next feature
- Suggest unrelated features
- Expand the scope
- Redesign the entire application
- Add technologies without approval
- Spend time on non-essential polish while P0 functionality is incomplete

---

# 20. DEFINITION OF DONE

A feature is NOT complete simply because code exists.

A feature is complete only when:

- Implementation exists
- TypeScript passes
- Relevant tests/checks pass
- Application runs
- Main user flow works
- Error state is handled
- Loading state is handled where necessary
- Existing functionality still works
- No obvious console errors remain
- PROJECT_STATE.md is updated

---

# 21. CONTEXT PROTECTION RULE

If the agent becomes uncertain about the project objective:

STOP.

Re-read:

AI_CONTEXT.md
PROJECT_STATE.md
ROADMAP.md
REQUIREMENTS.md
DEMO_SCRIPT.md

Then continue only with the current assigned task.

Never compensate for uncertainty by inventing a new feature.

---

# 22. PROJECT OWNER RULE

The human project owner has final authority over:

- Scope
- Architecture
- Feature priority
- Technology choices
- Demo flow

If a requested implementation conflicts with this document, ask for clarification rather than silently changing the project direction.