/**
 * MediKiosk — Clinical Intake & Data Types
 * Aligned with database schema (Phase 1A/1B) and kiosk state requirements.
 */

export type SupportedLanguage = "en" | "hi" | "mr";

export type IntakeMode = "general" | "ayush";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type PriorityLevel = "normal" | "urgent" | "emergency";

export type SessionStatus =
  | "intake_active"
  | "interview_complete"
  | "documents_uploaded"
  | "ready_for_review"
  | "in_physician_review"
  | "verified"
  | "abandoned";

export type ClinicalDomain =
  | "chief_complaint"
  | "hpi_onset"
  | "hpi_severity"
  | "hpi_character"
  | "associated_symptoms"
  | "past_medical_history"
  | "medication_history"
  | "allergy_history"
  | "family_history"
  | "lifestyle_social"
  | "ayush_pariksha";

export interface ExtractedSymptom {
  name: string;
  onset?: string;
  duration?: string;
  severity?: string;
  location?: string;
  source?: "patient_reported" | "ai_inferred";
  confidence?: number;
}

export type TriageAlertLevel = "info" | "warning" | "critical_red_flag";

export interface TriageEvaluationResult {
  triggered: boolean;
  alertLevel?: TriageAlertLevel;
  triggerRuleId?: string;
  triggerReason?: string;
  triggerSymptoms?: string[];
  isExisting?: boolean;
}

export interface TriageAlertRecord {
  id?: string;
  sessionId: string;
  patientId: string;
  alertLevel: TriageAlertLevel;
  triggerRuleId: string;
  triggerReason: string;
  triggerSymptoms: string[];
  isAcknowledged: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  createdAt?: string;
}

export interface ConversationMessage {
  id: string;
  sender: "ai" | "patient" | "system";
  text: string;
  timestamp: string;
  questionDomain?: ClinicalDomain;
  extractedSymptoms?: ExtractedSymptom[];
}

export interface PatientProfile {
  id?: string;
  patientIdentifier: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber?: string;
  primaryLanguage: SupportedLanguage;
  abhaId?: string;
  isDemo: boolean;
  demoCaseId?: string;
}

/**
 * Draft intake state persisted across kiosk routes in sessionStorage.
 */
export interface DraftIntakeState {
  selectedLanguage: SupportedLanguage;
  consentGranted: boolean;
  consentTimestamp: string | null;
  patientProfile: PatientProfile;
  sessionId: string | null;
  sessionCode: string | null;
  mode: IntakeMode;
  messages: ConversationMessage[];
  chiefComplaint?: string;
  confirmedChiefComplaint?: string;
  sessionStatus?: SessionStatus;
}

/**
 * Pre-seeded synthetic demo cases for reliable SIH demonstration.
 */
export const SYNTHETIC_DEMO_CASES: Record<
  string,
  PatientProfile & { summary: string; defaultComplaint: string }
> = {
  "case-1-cardiac": {
    patientIdentifier: "DEMO-PT-001",
    fullName: "Ramesh Kumar",
    dateOfBirth: "1972-04-12",
    gender: "male",
    phoneNumber: "+91 98765 43210",
    primaryLanguage: "en",
    abhaId: "91-4521-8832-1094",
    isDemo: true,
    demoCaseId: "case-1-cardiac",
    summary: "54 / Male — Acute chest pain, sweating, shortness of breath",
    defaultComplaint:
      "I have had severe chest pain since yesterday evening with sweating.",
  },
  "case-2-chronic": {
    patientIdentifier: "DEMO-PT-002",
    fullName: "Sunita Patel",
    dateOfBirth: "1965-08-23",
    gender: "female",
    phoneNumber: "+91 98111 22334",
    primaryLanguage: "en",
    abhaId: "91-3142-9981-6450",
    isDemo: true,
    demoCaseId: "case-2-chronic",
    summary: "61 / Female — Chronic Type 2 Diabetes, Hypertension follow-up",
    defaultComplaint:
      "Routine follow-up for diabetes and high blood pressure medication review.",
  },
  "case-3-ayush": {
    patientIdentifier: "DEMO-PT-003",
    fullName: "Anand Varma",
    dateOfBirth: "1981-11-05",
    gender: "male",
    phoneNumber: "+91 97234 56789",
    primaryLanguage: "hi",
    abhaId: "91-7890-1234-5678",
    isDemo: true,
    demoCaseId: "case-3-ayush",
    summary: "45 / Male — Digestive imbalance and chronic joint stiffness",
    defaultComplaint:
      "Chronic joint stiffness and digestion issues for past 3 months.",
  },
};

/**
 * Physician workstation types for live queue and case review.
 */
export interface PhysicianQueueItem {
  sessionId: string;
  sessionCode: string;
  patientId: string;
  patientIdentifier: string;
  patientName: string;
  dateOfBirth?: string;
  gender?: Gender;
  mode: IntakeMode;
  language: SupportedLanguage;
  status: SessionStatus;
  priority: PriorityLevel;
  chiefComplaint: string;
  startedAt: string;
  completedAt?: string | null;
  triageAlertCount: number;
  hasCriticalRedFlag: boolean;
  triggerRuleId?: string;
  isAcknowledged?: boolean;
}

export interface CaseAnswerDetail {
  questionId: string;
  stepNumber: number;
  questionDomain: ClinicalDomain;
  questionText: string;
  questionTextCanonical: string;
  answerId: string;
  answerText: string;
  inputModality: "text" | "voice_browser" | "voice_bhashini" | "touch_choice";
  languageDetected: string;
  confidenceScore?: number;
  answeredAt: string;
}

export interface PhysicianCaseDetail {
  sessionId: string;
  sessionCode: string;
  patientId: string;
  patient: {
    id: string;
    patientIdentifier: string;
    fullName: string;
    dateOfBirth: string;
    gender: Gender;
    phoneNumber?: string | null;
    abhaId?: string | null;
    isDemo: boolean;
    demoCaseId?: string | null;
  };
  mode: IntakeMode;
  language: SupportedLanguage;
  status: SessionStatus;
  priority: PriorityLevel;
  chiefComplaint: string;
  chiefComplaintVerbatim?: string;
  startedAt: string;
  completedAt?: string | null;
  assignedPhysicianId?: string | null;
  triageAlerts: TriageAlertRecord[];
  hasCriticalRedFlag: boolean;
  history: CaseAnswerDetail[];
  documents: UploadedDocumentRecord[];
  extractions: DocumentExtractionRecord[];
  physicianReview?: {
    id: string;
    reviewStatus: string;
    isVerified: boolean;
    editedClinicalSummary?: string | null;
    physicianNotes?: string | null;
  } | null;
}

/**
 * Document Ingestion & Structured Multimodal Extraction Types (Phase 5)
 */
export type DocumentType =
  | "prescription"
  | "lab_report"
  | "discharge_summary"
  | "radiology_report"
  | "other";

export type DocumentProcessingStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export interface ExtractedLabResult {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  flag?: "normal" | "high" | "low" | "abnormal";
}

export interface ExtractedMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface ExtractedCondition {
  name: string;
  status?: string;
  notes?: string;
}

export interface DocumentExtractionPayload {
  extractedDate?: string;
  issuingFacilityOrDoctor?: string;
  labResults: ExtractedLabResult[];
  medications: ExtractedMedication[];
  conditions: ExtractedCondition[];
  rawSummary?: string;
}

export interface UploadedDocumentRecord {
  id: string;
  sessionId: string;
  patientId: string;
  documentType: DocumentType;
  originalFilename: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  fileChecksumSha256?: string | null;
  processingStatus: DocumentProcessingStatus;
  errorMessage?: string | null;
  uploadedAt: string;
  createdAt?: string;
}

export interface DocumentExtractionRecord {
  id: string;
  documentId: string;
  sessionId: string;
  extractedDate?: string | null;
  issuingFacilityOrDoctor?: string | null;
  extractedLabResults: ExtractedLabResult[];
  extractedMedications: ExtractedMedication[];
  extractedConditions: ExtractedCondition[];
  rawExtractedPayload: Record<string, unknown>;
  confidenceScore?: number | null;
  extractionProvider: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

