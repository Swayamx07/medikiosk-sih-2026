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
