# MediKiosk — SIH REQUIREMENTS CHECKLIST

This file converts the problem requirements into implementation checkpoints.

---

# PATIENT EXPERIENCE

- [ ] Patient-facing interface
- [ ] Simple navigation
- [ ] Touch-friendly interaction
- [ ] Large controls
- [ ] Accessibility support

---

# MULTILINGUAL

- [ ] English
- [ ] Hindi
- [ ] Marathi
- [ ] Architecture for additional Indian languages

---

# CONSENT

- [ ] Consent screen
- [ ] Consent capture
- [ ] Consent timestamp
- [ ] Consent status
- [ ] Consent audit record

---

# CLINICAL HISTORY

- [ ] Chief complaint
- [ ] History of present illness
- [ ] Symptoms
- [ ] Onset
- [ ] Duration
- [ ] Severity
- [ ] Location
- [ ] Associated symptoms
- [ ] Past medical history
- [ ] Medication history
- [ ] Allergy history
- [ ] Family history
- [ ] Social history where relevant

---

# CONVERSATIONAL INTAKE

- [ ] Natural language input
- [ ] Structured extraction
- [ ] Adaptive questions
- [ ] Avoid unnecessary repeated questions
- [ ] Preserve patient responses
- [ ] Structured clinical state

---

# VOICE

- [ ] Voice input architecture
- [ ] Browser speech recognition fallback
- [ ] Future BHASHINI compatibility
- [ ] Text fallback

---

# AI

- [ ] Gemini integration
- [ ] Structured JSON
- [ ] Output validation
- [ ] Mock provider
- [ ] Error handling
- [ ] No autonomous diagnosis
- [ ] No fabricated patient facts

---

# RED FLAGS

- [ ] Symptom extraction
- [ ] Deterministic rule engine
- [ ] Priority classification
- [ ] Alert generation
- [ ] Physician notification
- [ ] Explainable trigger

---

# DOCUMENT INTELLIGENCE

- [ ] Prescription upload
- [ ] Laboratory report upload
- [ ] Discharge summary upload
- [ ] Document preview
- [ ] Multimodal AI extraction
- [ ] Structured extraction
- [ ] Validation

---

# LABORATORY DATA

- [ ] Test name
- [ ] Value
- [ ] Unit
- [ ] Reference range
- [ ] Date
- [ ] Abnormal flag
- [ ] Source document

---

# MEDICATION DATA

- [ ] Medicine name
- [ ] Dosage
- [ ] Frequency
- [ ] Route where available
- [ ] Duration where available
- [ ] Source document

Only record information explicitly present in the source.

---

# MEDICAL TIMELINE

- [ ] Conditions
- [ ] Encounters
- [ ] Medications
- [ ] Lab results
- [ ] Documents
- [ ] Chronological ordering

---

# PHYSICIAN DASHBOARD

- [ ] Patient queue
- [ ] Priority indicators
- [ ] Patient overview
- [ ] Clinical history
- [ ] Documents
- [ ] Timeline
- [ ] AI summary
- [ ] Edit summary
- [ ] Verify summary
- [ ] Audit event

---

# AYUSH

- [ ] AYUSH mode
- [ ] Dashavidha Pariksha
- [ ] Structured data
- [ ] Dedicated UI
- [ ] Physician display

---

# INTEROPERABILITY

- [ ] FHIR R4 representation
- [ ] Patient
- [ ] Encounter
- [ ] Condition
- [ ] Observation
- [ ] MedicationRequest
- [ ] AllergyIntolerance
- [ ] DocumentReference
- [ ] Consent
- [ ] Composition
- [ ] Bundle

---

# ABDM

- [ ] ABDM adapter abstraction
- [ ] Mock adapter
- [ ] Consent representation
- [ ] Record preparation
- [ ] Integration status

Clearly identify prototype/mock functionality.

---

# PRIVACY & SECURITY

- [ ] Synthetic data
- [ ] Server-side secrets
- [ ] Consent
- [ ] Access control
- [ ] Audit logging
- [ ] No real patient data in demo

---

# DEMO CASES

## Case 1

- [ ] Chest pain
- [ ] Shortness of breath
- [ ] Sweating
- [ ] Red flag triggered
- [ ] Physician alert

## Case 2

- [ ] Chronic disease history
- [ ] Prescription
- [ ] Laboratory report
- [ ] Extraction
- [ ] Abnormal value
- [ ] Timeline
- [ ] Summary

## Case 3

- [ ] AYUSH
- [ ] Dashavidha Pariksha

---

# FINAL ACCEPTANCE CRITERIA

The prototype should demonstrate:

Patient
→ Intake
→ Structured History
→ Safety
→ Documents
→ Timeline
→ Physician Review
→ Verification
→ FHIR
→ ABDM-ready architecture