# CaseX — SIH DEMO SCRIPT

This document defines the intended final demonstration.

Every major feature should contribute to this journey.

---

# DEMO OBJECTIVE

Demonstrate how CaseX transforms an incomplete/unstructured patient interaction into a structured, reviewable and interoperable clinical case.

---

# ACT 1 — PATIENT ARRIVES

Show:

CaseX

"AI-Powered Patient Case Taking"

Patient starts consultation.

---

# ACT 2 — LANGUAGE

Patient selects:

Marathi

Alternative demo:

Hindi

The interface changes accordingly.

---

# ACT 3 — CONSENT

Show a simple consent screen.

Patient accepts.

Record:

- Consent status
- Timestamp
- Session

---

# ACT 4 — PATIENT IDENTIFICATION

Use synthetic/demo patient.

Do not use real personal information.

---

# ACT 5 — CLINICAL INTERVIEW

Patient reports:

"I have chest pain."

CaseX begins the clinical interview.

The system asks relevant follow-up questions.

Example:

- When did it start?
- Where is the pain?
- How severe is it?
- Is it associated with breathing difficulty?
- Are there other symptoms?

The system should avoid asking information already provided.

---

# ACT 6 — RED FLAG

Patient provides:

- Chest pain
- Shortness of breath
- Sweating

CaseX extracts the symptoms.

Deterministic rule engine identifies configured potential red flag.

Display:

POTENTIAL RED FLAG

Requires immediate clinical assessment.

Do NOT display an autonomous diagnosis.

---

# ACT 7 — PHYSICIAN VIEW

Switch to physician dashboard.

Show:

Priority patient

Then show:

- Chief complaint
- Symptoms
- Red flag
- Patient responses

---

# ACT 8 — SECOND PATIENT

Open chronic patient.

Patient has:

- Hypertension
- Diabetes
- Previous treatment

---

# ACT 9 — DOCUMENT INTELLIGENCE

Upload synthetic laboratory report.

CaseX processes the document.

Show:

Document
↓
AI extraction
↓
Structured clinical information

Example:

HbA1c
Value
Unit
Reference range
Date

Highlight abnormal value.

---

# ACT 10 — MEDICAL TIMELINE

Show:

2024
Condition

2025
Medication

2026
Laboratory result

2026
Current consultation

The physician should understand the patient history quickly.

---

# ACT 11 — AI SUMMARY

Generate physician-ready summary.

Example sections:

Chief Complaint

History of Present Illness

Relevant Medical History

Medications

Allergies

Investigations

Potential Concerns

The physician can edit the summary.

---

# ACT 12 — PHYSICIAN VERIFICATION

Physician edits information if necessary.

Then selects:

VERIFY / ACCEPT

Record an audit event.

---

# ACT 13 — FHIR

Open interoperability section.

Show:

Clinical Record
↓
FHIR Transformer
↓
FHIR Bundle

Display selected resources:

Patient
Encounter
Condition
Observation
MedicationRequest
DocumentReference
Consent

---

# ACT 14 — ABDM

Show:

ABDM Integration Adapter

Status:

Prototype / Sandbox

Show:

Consent recorded
Record prepared
FHIR generated
Payload prepared

Do not claim live production integration unless it actually exists.

---

# ACT 15 — FINAL MESSAGE

End with:

"CaseX doesn't replace the physician.

It makes sure the physician doesn't start the consultation from zero."

---

# DEMO RULES

The demo must:

- Use synthetic patients
- Avoid unnecessary screens
- Avoid unnecessary clicks
- Show working functionality
- Have fallback behavior
- Never rely on a single fragile AI API call
- Never show an obvious broken state
- Never claim mock functionality is production functionality

---

# DEMO BACKUP

Maintain:

1. Live deployment
2. Local development version
3. Preloaded synthetic patient cases
4. Mock AI fallback
5. Recorded backup demonstration