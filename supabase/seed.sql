-- ============================================================================
-- MediKiosk — Phase 1C: Deterministic Synthetic Demo Seed Data
-- Source of Truth: DEMO_SCRIPT.md & docs/PHASE_1A_DATABASE_SCHEMA.md
-- Target Database: PostgreSQL 15+ / Supabase
-- Description:
--   Populates all 12 clinical tables with 3 realistic, synthetic patient journeys
--   expressly mapped to the SIH demonstration script:
--     - Case 1: Acute Cardiac Red Flag (Marathi, Emergency, Deterministic Triage Alert)
--     - Case 2: Chronic OPD + Multimodal Lab OCR Extraction + Longitudinal Timeline
--     - Case 3: Verified Review + FHIR R4 Bundle Export + ABDM Sandbox Audit Trail
--
-- Idempotence:
--   Deterministic, fixed UUIDs with ON CONFLICT DO NOTHING for safe re-execution.
--
-- Safety Notice:
--   Contains 100% synthetic clinical data. No real/PHI patient records.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE: patients (3 Synthetic Cases)
-- ----------------------------------------------------------------------------
INSERT INTO patients (
    id, patient_identifier, full_name, date_of_birth, gender, phone_number, primary_language, abha_id, is_demo, demo_case_id
) VALUES 
(
    'c1000000-0000-0000-0000-000000000001',
    'PAT-2026-MR-001',
    'Ramesh Patil',
    '1972-05-14',
    'male',
    '+91 98230 11223',
    'mr',
    '91-4821-9034-1122',
    true,
    'case-1-acute-cardiac-red-flag'
),
(
    'c2000000-0000-0000-0000-000000000002',
    'PAT-2026-HI-002',
    'Sunita Sharma',
    '1978-11-23',
    'female',
    '+91 98190 33445',
    'hi',
    '91-7392-1104-5566',
    true,
    'case-2-chronic-opd-lab-ocr'
),
(
    'c3000000-0000-0000-0000-000000000003',
    'PAT-2026-EN-003',
    'Amit Joshi',
    '1990-03-08',
    'male',
    '+91 97650 55667',
    'en',
    '91-2245-8819-7788',
    true,
    'case-3-verified-fhir-review'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. TABLE: clinical_sessions (3 Encounter Sessions)
-- ----------------------------------------------------------------------------
INSERT INTO clinical_sessions (
    id, session_code, patient_id, mode, status, language, chief_complaint_raw, priority, started_at, completed_at, assigned_physician_id
) VALUES
(
    'c1000000-0000-0000-0000-000000000010',
    'CS-2026-0908-01',
    'c1000000-0000-0000-0000-000000000001',
    'general',
    'ready_for_review',
    'mr',
    'मला छातीत तीव्र वेदना आणि श्वास घेण्यास त्रास होत आहे (Severe chest pain and breathing difficulty)',
    'emergency',
    now() - INTERVAL '35 minutes',
    now() - INTERVAL '10 minutes',
    'DOC-MH-40182'
),
(
    'c2000000-0000-0000-0000-000000000010',
    'CS-2026-0908-02',
    'c2000000-0000-0000-0000-000000000002',
    'general',
    'in_physician_review',
    'hi',
    'नियमित मधुमेह और उच्च रक्तचाप जांच, हाथ पैरों में झनझनाहट (Routine DM/HTN follow-up, peripheral tingling)',
    'normal',
    now() - INTERVAL '70 minutes',
    now() - INTERVAL '40 minutes',
    'DOC-MH-40182'
),
(
    'c3000000-0000-0000-0000-000000000010',
    'CS-2026-0908-03',
    'c3000000-0000-0000-0000-000000000003',
    'general',
    'verified',
    'en',
    'Persistent dry cough for 3 weeks and mild low-grade evening fever',
    'normal',
    now() - INTERVAL '3 hours',
    now() - INTERVAL '2 hours',
    'DOC-MH-40182'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. TABLE: consents (Explicit Patient Authorizations)
-- ----------------------------------------------------------------------------
INSERT INTO consents (
    id, patient_id, clinical_session_id, consent_type, status, version, language, ip_address, granted_at
) VALUES
(
    'c1000000-0000-0000-0000-000000000020',
    'c1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000010',
    'kiosk_intake_and_ai_assistance',
    'granted',
    'v1.0',
    'mr',
    '10.10.1.42',
    now() - INTERVAL '34 minutes'
),
(
    'c2000000-0000-0000-0000-000000000020',
    'c2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000010',
    'document_digitization',
    'granted',
    'v1.0',
    'hi',
    '10.10.1.42',
    now() - INTERVAL '68 minutes'
),
(
    'c3000000-0000-0000-0000-000000000020',
    'c3000000-0000-0000-0000-000000000003',
    'c3000000-0000-0000-0000-000000000010',
    'data_sharing_abdm',
    'granted',
    'v1.0',
    'en',
    '10.10.1.42',
    now() - INTERVAL '2 hours 55 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. TABLE: clinical_questions (Dynamic Intake Prompts)
-- ----------------------------------------------------------------------------
INSERT INTO clinical_questions (
    id, session_id, step_number, question_text, question_text_canonical, clinical_domain, input_type, options, status
) VALUES
-- Case 1 Questions (Marathi)
(
    'c1000000-0000-0000-0000-000000000031',
    'c1000000-0000-0000-0000-000000000010',
    1,
    'तुम्हाला आज काय त्रास होत आहे?',
    'What primary symptom brings you to the kiosk today?',
    'chief_complaint',
    'text',
    null,
    'answered'
),
(
    'c1000000-0000-0000-0000-000000000032',
    'c1000000-0000-0000-0000-000000000010',
    2,
    'हा त्रास कधीपासून सुरू झाला आणि वेदना कुठे जाणवत आहे?',
    'When did this discomfort start and where is the pain located?',
    'hpi_onset',
    'text',
    null,
    'answered'
),
(
    'c1000000-0000-0000-0000-000000000033',
    'c1000000-0000-0000-0000-000000000010',
    3,
    'वेदना किती तीव्र आहे आणि सोबत घाम किंवा श्वास घेण्यास त्रास आहे का?',
    'How severe is the pain and are you experiencing sweating or shortness of breath?',
    'associated_symptoms',
    'multiple_choice',
    '["तीव्र वेदना (8-10)", "खूप घाम येणे", "श्वास घेण्यास त्रास", "डाव्या हाताकडे कळ"]'::jsonb,
    'answered'
),

-- Case 2 Questions (Hindi)
(
    'c2000000-0000-0000-0000-000000000031',
    'c2000000-0000-0000-0000-000000000010',
    1,
    'आज आप किस मुख्य समस्या के लिए जांच कराने आए हैं?',
    'What primary condition are you presenting for today?',
    'chief_complaint',
    'text',
    null,
    'answered'
),
(
    'c2000000-0000-0000-0000-000000000032',
    'c2000000-0000-0000-0000-000000000010',
    2,
    'क्या आप अपनी निर्धारित दवाएं नियमित रूप से ले रहे हैं?',
    'Are you taking your prescribed medications regularly?',
    'medication_history',
    'boolean',
    '["हाँ (Yes)", "नहीं (No)"]'::jsonb,
    'answered'
),

-- Case 3 Questions (English)
(
    'c3000000-0000-0000-0000-000000000031',
    'c3000000-0000-0000-0000-000000000010',
    1,
    'How long have you had this cough and is it accompanied by phlegm or blood?',
    'How long have you had this cough and is it accompanied by phlegm or blood?',
    'associated_symptoms',
    'text',
    null,
    'answered'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. TABLE: clinical_answers (Patient Responses & Extracted Features)
-- ----------------------------------------------------------------------------
INSERT INTO clinical_answers (
    id, question_id, session_id, raw_answer_text, input_modality, extracted_symptoms, confidence_score, language_detected, answered_at
) VALUES
-- Case 1 Answers
(
    'c1000000-0000-0000-0000-000000000041',
    'c1000000-0000-0000-0000-000000000031',
    'c1000000-0000-0000-0000-000000000010',
    'छातीत मध्यभागी खूप जडपणा आणि दाब जाणवत आहे',
    'voice_browser',
    '[{"symptom": "retrosternal_chest_pressure", "severity": "severe", "certainty": "high"}]'::jsonb,
    0.96,
    'mr',
    now() - INTERVAL '30 minutes'
),
(
    'c1000000-0000-0000-0000-000000000042',
    'c1000000-0000-0000-0000-000000000032',
    'c1000000-0000-0000-0000-000000000010',
    'सुमारे 45 मिनिटांपूर्वी अचानक सुरू झाले, वेदना डाव्या खांद्याकडे आणि हाताकडे जात आहे',
    'text',
    '[{"symptom": "chest_pain_radiation_left_arm", "duration": "45m", "onset": "sudden"}]'::jsonb,
    0.98,
    'mr',
    now() - INTERVAL '25 minutes'
),
(
    'c1000000-0000-0000-0000-000000000043',
    'c1000000-0000-0000-0000-000000000033',
    'c1000000-0000-0000-0000-000000000010',
    'वेदना 8/10 आहे, खूप गार घाम फुटला आहे आणि दम लागत आहे',
    'touch_choice',
    '[{"symptom": "diaphoresis", "severity": "profuse"}, {"symptom": "dyspnea", "severity": "moderate"}]'::jsonb,
    0.99,
    'mr',
    now() - INTERVAL '20 minutes'
),

-- Case 2 Answers
(
    'c2000000-0000-0000-0000-000000000041',
    'c2000000-0000-0000-0000-000000000031',
    'c2000000-0000-0000-0000-000000000010',
    'पिछले 2 हफ्ते से पैरों में सुई चुभने जैसा महसूस हो रहा है और प्यास ज्यादा लग रही है',
    'text',
    '[{"symptom": "peripheral_paresthesia", "location": "bilateral_feet"}, {"symptom": "polydipsia"}]'::jsonb,
    0.94,
    'hi',
    now() - INTERVAL '60 minutes'
),
(
    'c2000000-0000-0000-0000-000000000042',
    'c2000000-0000-0000-0000-000000000032',
    'c2000000-0000-0000-0000-000000000010',
    'हाँ, मेटफॉर्मिन 500 ले रही हूँ लेकिन कभी-कभी दोपहर की खुराक छूट जाती है',
    'voice_browser',
    '[{"medication": "Metformin 500mg", "compliance": "partial_missed_doses"}]'::jsonb,
    0.92,
    'hi',
    now() - INTERVAL '55 minutes'
),

-- Case 3 Answers
(
    'c3000000-0000-0000-0000-000000000041',
    'c3000000-0000-0000-0000-000000000031',
    'c3000000-0000-0000-0000-000000000010',
    'Dry hacking cough for 3 weeks, worse at night. No hemoptysis, mild low-grade fever in the evenings.',
    'text',
    '[{"symptom": "dry_cough", "duration": "3 weeks"}, {"symptom": "evening_fever", "severity": "mild"}]'::jsonb,
    0.97,
    'en',
    now() - INTERVAL '2 hours 40 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. TABLE: clinical_histories (Synthesized Structured Summaries)
-- ----------------------------------------------------------------------------
INSERT INTO clinical_histories (
    id, session_id, patient_id, chief_complaint, history_of_present_illness, symptoms_structured, past_medical_history, current_medications, known_allergies, family_history, ai_clinical_summary, summary_status, generated_by_provider
) VALUES
(
    'c1000000-0000-0000-0000-000000000050',
    'c1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000001',
    'Acute retrosternal crushing chest pain with radiation to left arm and diaphoresis',
    'A 54-year-old male presents with acute onset of severe retrosternal squeezing chest pain (8/10 intensity) that started 45 minutes prior to arrival. Pain radiates down the left arm. Associated with profuse cold diaphoresis and moderate exertional dyspnea. Denies prior similar episodes.',
    '[{"symptom": "retrosternal_chest_pressure", "severity": "8/10", "acuteness": "acute"}, {"symptom": "radiation_left_arm", "present": true}, {"symptom": "diaphoresis", "present": true}, {"symptom": "dyspnea", "severity": "moderate"}]'::jsonb,
    '[{"condition": "Hypertension", "duration_years": 4}, {"condition": "Tobacco chewing", "status": "active"}]'::jsonb,
    '[{"name": "Amlodipine 5mg OD"}]'::jsonb,
    '[]'::jsonb,
    '[{"relation": "Father", "condition": "Coronary artery disease (CAD), MI at age 58"}]'::jsonb,
    'CLINICAL SUMMARY (TRIAGE ESCALATION): 54M presenting with classical cardiac anginal symptoms. Deterministic red-flag criteria met: substernal chest pain + left arm radiation + diaphoresis in a patient with cardiovascular risk factors. Immediate 12-lead ECG and urgent cardiology evaluation required.',
    'generated',
    'mock-gemini-clinical-v1'
),
(
    'c2000000-0000-0000-0000-000000000050',
    'c2000000-0000-0000-0000-000000000010',
    'c2000000-0000-0000-0000-000000000002',
    'Follow-up evaluation for Type 2 Diabetes and Hypertension with bilateral lower extremity paresthesia',
    'A 48-year-old female presents for scheduled chronic care review. Endorses 2-week history of bilateral burning tingling sensations in feet and increased nocturnal thirst. Recent lab report from August 2026 shows suboptimal glycemic control with elevated HbA1c (8.4%).',
    '[{"symptom": "bilateral_foot_paresthesia", "duration": "2 weeks"}, {"symptom": "polydipsia", "present": true}]'::jsonb,
    '[{"condition": "Type 2 Diabetes Mellitus", "diagnosed": "2024"}, {"condition": "Primary Essential Hypertension", "diagnosed": "2024"}]'::jsonb,
    '[{"name": "Metformin 500mg BD", "compliance": "suboptimal"}, {"name": "Telmisartan 40mg OD", "compliance": "regular"}]'::jsonb,
    '[{"allergy": "Sulfa drugs", "reaction": "cutaneous rash"}]'::jsonb,
    '[{"relation": "Mother", "condition": "Type 2 Diabetes"}]'::jsonb,
    'CHRONIC CARE SUMMARY: 48F with poorly controlled T2DM (HbA1c 8.4%) and HTN. Developing symptoms suggestive of early diabetic peripheral sensory neuropathy. Recommend glycemic medication intensification, microalbuminuria screening, and formal monofilament testing.',
    'generated',
    'mock-gemini-clinical-v1'
),
(
    'c3000000-0000-0000-0000-000000000050',
    'c3000000-0000-0000-0000-000000000010',
    'c3000000-0000-0000-0000-000000000003',
    'Subacute non-productive cough for 3 weeks and intermittent low-grade evening fever',
    'A 36-year-old male software engineer presents with a 3-week history of dry, irritating nocturnal cough. Reports low-grade fevers in the late afternoons/evenings. Denies hemoptysis, chest pain, or notable weight loss. Non-smoker.',
    '[{"symptom": "dry_cough", "duration": "21 days"}, {"symptom": "evening_fever", "severity": "mild"}]'::jsonb,
    '[{"condition": "Seasonal allergic rhinitis"}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'VERIFIED PHYSICIAN SUMMARY: 36M presenting with subacute persistent cough and low-grade evening fever. Primary differential includes post-viral bronchial hyperreactivity vs atypical infection (Mycoplasma) vs pulmonary tuberculosis screening. Chest X-Ray and CBC/ESR requested.',
    'verified',
    'mock-gemini-clinical-v1'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. TABLE: triage_alerts (Deterministic Safety Escalation)
-- ----------------------------------------------------------------------------
INSERT INTO triage_alerts (
    id, session_id, patient_id, alert_level, trigger_rule_id, trigger_reason, trigger_symptoms, is_acknowledged, acknowledged_by, acknowledged_at
) VALUES
(
    'c1000000-0000-0000-0000-000000000060',
    'c1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000001',
    'critical_red_flag',
    'RULE_ACUTE_CORONARY_SYNDROME_V1',
    'CRITICAL RED FLAG: Acute substernal chest pressure with left-arm radiation and diaphoresis in patient over 50 years. High probability of acute myocardial ischemia.',
    '{"symptoms": ["chest_pain_severe", "radiation_left_arm", "diaphoresis"], "pain_scale": 8, "onset_minutes": 45}'::jsonb,
    false,
    null,
    null
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. TABLE: documents (Uploaded Historical Diagnostic Records)
-- ----------------------------------------------------------------------------
INSERT INTO documents (
    id, session_id, patient_id, document_type, original_filename, storage_bucket, storage_path, mime_type, file_size_bytes, file_checksum_sha256, processing_status, uploaded_at
) VALUES
(
    'c2000000-0000-0000-0000-000000000080',
    'c2000000-0000-0000-0000-000000000010',
    'c2000000-0000-0000-0000-000000000002',
    'lab_report',
    'lab_report_glycemic_aug2026.pdf',
    'medical-documents',
    'patients/c2000000-0000-0000-0000-000000000002/sessions/c2000000-0000-0000-0000-000000000010/lab_report_glycemic_aug2026.pdf',
    'application/pdf',
    1543,
    '144ecbad985ed991bae0b5b58657322f6d115c01dd9b3be52aaa10188d32b88d',
    'completed',
    now() - INTERVAL '65 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. TABLE: document_extractions (Digitized OCR Payloads)
-- ----------------------------------------------------------------------------
INSERT INTO document_extractions (
    id, document_id, session_id, extracted_date, issuing_facility_or_doctor, extracted_lab_results, extracted_medications, extracted_conditions, raw_extracted_payload, confidence_score, extraction_provider, is_verified
) VALUES
(
    'c2000000-0000-0000-0000-000000000090',
    'c2000000-0000-0000-0000-000000000080',
    'c2000000-0000-0000-0000-000000000010',
    '2026-08-30',
    'Metropolis Healthcare Diagnostic Laboratory, Pune',
    '[
        {"test": "Glycosylated Hemoglobin (HbA1c)", "value": 8.4, "unit": "%", "reference_range": "4.0 - 5.6", "is_abnormal": true, "interpretation": "Elevated - Suboptimal Glycemic Control"},
        {"test": "Fasting Plasma Glucose", "value": 168, "unit": "mg/dL", "reference_range": "70 - 100", "is_abnormal": true, "interpretation": "High Fasting Blood Sugar"},
        {"test": "Serum Creatinine", "value": 0.9, "unit": "mg/dL", "reference_range": "0.6 - 1.2", "is_abnormal": false, "interpretation": "Normal Renal Function"}
    ]'::jsonb,
    '[{"name": "Metformin", "strength": "500mg", "dosage": "BD"}]'::jsonb,
    '[{"condition": "Type 2 Diabetes Mellitus"}]'::jsonb,
    '{"document_meta": {"pages": 1, "quality": "high"}, "provider": "mock-multimodal-ocr", "scan_timestamp": "2026-09-08T08:30:00Z"}'::jsonb,
    0.95,
    'mock',
    false
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. TABLE: medical_timeline (Longitudinal Milestones for Case 2)
-- ----------------------------------------------------------------------------
INSERT INTO medical_timeline (
    id, patient_id, session_id, source_document_id, event_date, event_type, title, description, is_abnormal, metadata, source_type
) VALUES
(
    'c2000000-0000-0000-0000-0000000000a1',
    'c2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000010',
    null,
    '2024-04-12',
    'condition',
    'Type 2 Diabetes Mellitus Diagnosed',
    'Initial diagnosis established during annual health camp. Fasting blood sugar 154 mg/dL.',
    true,
    '{"icd10": "E11.9"}'::jsonb,
    'patient_reported'
),
(
    'c2000000-0000-0000-0000-0000000000a2',
    'c2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000010',
    null,
    '2024-09-18',
    'condition',
    'Essential Hypertension Diagnosed',
    'Consistent resting blood pressure 146/92 mmHg across three clinical visits.',
    true,
    '{"icd10": "I10"}'::jsonb,
    'patient_reported'
),
(
    'c2000000-0000-0000-0000-0000000000a3',
    'c2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000010',
    null,
    '2025-06-10',
    'medication',
    'Metformin 500mg BD Initiated',
    'Oral hypoglycemic therapy initiated by primary physician. Telmisartan 40mg OD continued for HTN.',
    false,
    '{"rxnorm": "860975"}'::jsonb,
    'patient_reported'
),
(
    'c2000000-0000-0000-0000-0000000000a4',
    'c2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000010',
    'c2000000-0000-0000-0000-000000000080',
    '2026-08-30',
    'investigation_lab',
    'Glycemic Panel (HbA1c 8.4%)',
    'Laboratory investigation reveals uncontrolled blood sugars with HbA1c at 8.4% and Fasting Plasma Glucose at 168 mg/dL.',
    true,
    '{"hba1c": 8.4, "fasting_glucose": 168}'::jsonb,
    'extracted_from_document'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 11. TABLE: physician_reviews (Verified Sign-Off & FHIR R4 Bundle for Case 3)
-- ----------------------------------------------------------------------------
INSERT INTO physician_reviews (
    id, session_id, patient_id, physician_id, physician_name, review_status, edited_clinical_summary, physician_notes, reconciliation_changes, is_verified, verified_at, fhir_bundle_generated
) VALUES
(
    'c3000000-0000-0000-0000-0000000000b0',
    'c3000000-0000-0000-0000-000000000010',
    'c3000000-0000-0000-0000-000000000003',
    'DOC-MH-40182',
    'Dr. Anita Deshmukh, MD',
    'verified_accepted',
    'VERIFIED PHYSICIAN CLINICAL RECORD: 36M presenting with 3-week history of nocturnal dry cough and low-grade evening fever. Lungs clear on auscultation. Ordered PA Chest X-ray and standard sputum smear for acid-fast bacilli to rule out infectious etiology. Empirical course of oral Azithromycin 500mg OD for 3 days initiated.',
    'Patient instructed to return immediately if hemoptysis, breathlessness, or high spike fevers occur. Review in OPD in 5 days with imaging reports.',
    '{"medication_added": "Azithromycin 500mg OD x 3d", "investigations_ordered": ["CXR_PA", "CBC_ESR", "Sputum_AFB"]}'::jsonb,
    true,
    now() - INTERVAL '2 hours',
    '{
        "resourceType": "Bundle",
        "type": "document",
        "timestamp": "2026-09-08T07:30:00Z",
        "entry": [
            {
                "resource": {
                    "resourceType": "Composition",
                    "status": "final",
                    "type": {"text": "Clinical Consultation Note"},
                    "subject": {"reference": "Patient/PAT-2026-EN-003", "display": "Amit Joshi"},
                    "date": "2026-09-08T07:30:00Z",
                    "author": [{"display": "Dr. Anita Deshmukh, MD"}]
                }
            },
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": "PAT-2026-EN-003",
                    "identifier": [{"system": "https://abdm.gov.in/abha", "value": "91-2245-8819-7788"}],
                    "name": [{"family": "Joshi", "given": ["Amit"]}],
                    "gender": "male",
                    "birthDate": "1990-03-08"
                }
            },
            {
                "resource": {
                    "resourceType": "Condition",
                    "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]},
                    "code": {"text": "Subacute Cough with evening pyrexia"}
                }
            }
        ]
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 12. TABLE: audit_logs (Sequential Tamper-Evident Trail Across Cases)
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (
    id, session_id, patient_id, actor_type, actor_id, event_type, event_description, ip_address, metadata, created_at
) VALUES
-- Case 1 Audit Trail
(
    'c1000000-0000-0000-0000-0000000000c1',
    'c1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000001',
    'patient_kiosk',
    'KIOSK-TERMINAL-01',
    'consent_granted',
    'Informed consent granted by patient for AI-assisted intake in Marathi.',
    '10.10.1.42',
    '{"consent_type": "kiosk_intake_and_ai_assistance", "language": "mr"}'::jsonb,
    now() - INTERVAL '34 minutes'
),
(
    'c1000000-0000-0000-0000-0000000000c2',
    'c1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000001',
    'patient_kiosk',
    'KIOSK-TERMINAL-01',
    'session_started',
    'Clinical intake session CS-2026-0908-01 initialized for acute complaints.',
    '10.10.1.42',
    '{"mode": "general", "priority": "emergency"}'::jsonb,
    now() - INTERVAL '33 minutes'
),
(
    'c1000000-0000-0000-0000-0000000000c3',
    'c1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000001',
    'patient_kiosk',
    'KIOSK-TERMINAL-01',
    'answer_recorded',
    'Patient voice response recorded and translated from Marathi to canonical symptoms.',
    '10.10.1.42',
    '{"modality": "voice_browser", "confidence": 0.96}'::jsonb,
    now() - INTERVAL '25 minutes'
),
(
    'c1000000-0000-0000-0000-0000000000c4',
    'c1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000001',
    'ai_system',
    'SAFETY-RULE-ENGINE',
    'red_flag_triggered',
    'CRITICAL RED FLAG: Deterministic trigger RULE_ACUTE_CORONARY_SYNDROME_V1 executed. Elevated priority to emergency.',
    '10.10.1.42',
    '{"rule_id": "RULE_ACUTE_CORONARY_SYNDROME_V1", "escalation": "emergency"}'::jsonb,
    now() - INTERVAL '20 minutes'
),
(
    'c1000000-0000-0000-0000-0000000000c5',
    'c1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000001',
    'ai_system',
    'CLINICAL-SUMMARIZER',
    'summary_generated',
    'Preliminary clinical case history and HPI synthesized for attending physician.',
    '10.10.1.42',
    '{"provider": "mock-gemini-clinical-v1", "status": "generated"}'::jsonb,
    now() - INTERVAL '15 minutes'
),

-- Case 2 Audit Trail
(
    'c2000000-0000-0000-0000-0000000000c1',
    'c2000000-0000-0000-0000-000000000010',
    'c2000000-0000-0000-0000-000000000002',
    'patient_kiosk',
    'KIOSK-TERMINAL-01',
    'document_uploaded',
    'Laboratory report PDF uploaded by patient to secure medical-documents storage.',
    '10.10.1.42',
    '{"filename": "lab_report_glycemic_aug2026.pdf", "size_bytes": 1543}'::jsonb,
    now() - INTERVAL '65 minutes'
),
(
    'c2000000-0000-0000-0000-0000000000c2',
    'c2000000-0000-0000-0000-000000000010',
    'c2000000-0000-0000-0000-000000000002',
    'ai_system',
    'OCR-MULTIMODAL-EXTRACTOR',
    'document_extracted',
    'Structured lab values extracted: HbA1c 8.4% (elevated), Fasting Glucose 168 mg/dL.',
    '10.10.1.42',
    '{"confidence": 0.95, "abnormal_flag_count": 2}'::jsonb,
    now() - INTERVAL '60 minutes'
),

-- Case 3 Audit Trail
(
    'c3000000-0000-0000-0000-0000000000c1',
    'c3000000-0000-0000-0000-000000000010',
    'c3000000-0000-0000-0000-000000000003',
    'physician',
    'DOC-MH-40182',
    'summary_edited',
    'Attending physician amended provisional case summary with auscultation notes and differential diagnosis.',
    '10.10.2.15',
    '{"physician_id": "DOC-MH-40182"}'::jsonb,
    now() - INTERVAL '2 hours 15 minutes'
),
(
    'c3000000-0000-0000-0000-0000000000c2',
    'c3000000-0000-0000-0000-000000000010',
    'c3000000-0000-0000-0000-000000000003',
    'physician',
    'DOC-MH-40182',
    'case_verified',
    'Encounter verified and signed off by Dr. Anita Deshmukh. Non-repudiation lock engaged.',
    '10.10.2.15',
    '{"review_status": "verified_accepted", "is_verified": true}'::jsonb,
    now() - INTERVAL '2 hours'
),
(
    'c3000000-0000-0000-0000-0000000000c3',
    'c3000000-0000-0000-0000-000000000010',
    'c3000000-0000-0000-0000-000000000003',
    'system_job',
    'FHIR-R4-TRANSFORMER',
    'fhir_exported',
    'FHIR R4 Diagnostic and Consultation Document bundle generated for encounter.',
    '10.10.2.15',
    '{"bundle_type": "document", "resource_count": 3}'::jsonb,
    now() - INTERVAL '1 hour 58 minutes'
),
(
    'c3000000-0000-0000-0000-0000000000c4',
    'c3000000-0000-0000-0000-000000000010',
    'c3000000-0000-0000-0000-000000000003',
    'system_job',
    'ABDM-SANDBOX-CONNECTOR',
    'abdm_payload_prepared',
    'ABDM CareContext and HIP payload formatted for sandbox health record exchange.',
    '10.10.2.15',
    '{"sandbox_mode": true, "hip_id": "IN-MH-PUNE-HOSP-01"}'::jsonb,
    now() - INTERVAL '1 hour 55 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- End of synthetic demo seed script
