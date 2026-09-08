"use server";

import { createServerAdminClient } from "@/lib/supabase/server";
import {
  PatientProfile,
  SupportedLanguage,
  IntakeMode,
  SessionStatus,
  PriorityLevel,
  ClinicalDomain,
  ExtractedSymptom,
} from "@/types/clinical";

export interface CreateSessionInput {
  patientProfile: PatientProfile;
  language: SupportedLanguage;
  mode: IntakeMode;
  consentGranted: boolean;
  existingSessionId?: string | null;
}

export interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  sessionCode?: string;
  patientId?: string;
  error?: string;
}

export interface SaveAnswerInput {
  sessionId: string;
  stepNumber: number;
  questionDomain: ClinicalDomain;
  questionText: string;
  questionTextCanonical?: string;
  answerText: string;
  inputModality?: "text" | "voice_browser" | "touch_choice";
  language: SupportedLanguage;
  extractedSymptoms?: ExtractedSymptom[];
}

export interface SaveAnswerResult {
  success: boolean;
  questionId?: string;
  answerId?: string;
  error?: string;
}

export interface UpdateSessionStatusInput {
  sessionId: string;
  status: SessionStatus;
  priority?: PriorityLevel;
  chiefComplaint?: string;
}

export interface UpdateSessionStatusResult {
  success: boolean;
  error?: string;
}

/**
 * Creates or resumes a patient clinical intake session.
 * Upserts synthetic patient demographic, records consent, and initiates clinical_session.
 */
export async function createOrResumeClinicalSessionAction(
  input: CreateSessionInput
): Promise<CreateSessionResult> {
  try {
    const supabase = createServerAdminClient();

    const { patientProfile, language, mode, existingSessionId } = input;

    // 1. If an active session exists and is still valid, verify and resume it
    if (existingSessionId) {
      const { data: existingSession, error: checkError } = await supabase
        .from("clinical_sessions")
        .select("id, session_code, patient_id, status")
        .eq("id", existingSessionId)
        .maybeSingle();

      if (!checkError && existingSession) {
        return {
          success: true,
          sessionId: existingSession.id,
          sessionCode: existingSession.session_code,
          patientId: existingSession.patient_id,
        };
      }
    }

    // 2. Upsert synthetic patient profile to ensure foreign key integrity
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .upsert(
        {
          patient_identifier: patientProfile.patientIdentifier,
          full_name: patientProfile.fullName,
          date_of_birth: patientProfile.dateOfBirth,
          gender: patientProfile.gender,
          phone_number: patientProfile.phoneNumber || null,
          primary_language: language,
          abha_id: patientProfile.abhaId || null,
          is_demo: patientProfile.isDemo,
          demo_case_id: patientProfile.demoCaseId || null,
        },
        { onConflict: "patient_identifier" }
      )
      .select("id")
      .single();

    if (patientError || !patientData) {
      return {
        success: false,
        error: `Failed to register patient profile: ${patientError?.message || "Unknown error"}`,
      };
    }

    const patientId = patientData.id;

    // 3. Generate unique session code: CS-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const sessionCode = `CS-${dateStr}-${randSuffix}`;

    // 4. Create clinical session
    const { data: sessionData, error: sessionError } = await supabase
      .from("clinical_sessions")
      .insert({
        session_code: sessionCode,
        patient_id: patientId,
        mode: mode || "general",
        status: "intake_active",
        language: language || "en",
        priority: "normal",
        started_at: new Date().toISOString(),
      })
      .select("id, session_code")
      .single();

    if (sessionError || !sessionData) {
      return {
        success: false,
        error: `Failed to create clinical session: ${sessionError?.message || "Unknown error"}`,
      };
    }

    // 5. Record informed consent record
    if (input.consentGranted) {
      await supabase.from("consents").insert({
        patient_id: patientId,
        clinical_session_id: sessionData.id,
        consent_type: "kiosk_intake_and_ai_assistance",
        status: "granted",
        version: "v1.0",
        language: language || "en",
        granted_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      sessionId: sessionData.id,
      sessionCode: sessionData.session_code,
      patientId: patientId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return { success: false, error: message };
  }
}

/**
 * Saves a clinical question and the corresponding patient answer.
 * Persists to clinical_questions and clinical_answers tables.
 */
export async function saveClinicalAnswerAction(
  input: SaveAnswerInput
): Promise<SaveAnswerResult> {
  try {
    const supabase = createServerAdminClient();

    const {
      sessionId,
      stepNumber,
      questionDomain,
      questionText,
      questionTextCanonical,
      answerText,
      inputModality = "text",
      language,
      extractedSymptoms = [],
    } = input;

    if (!sessionId || !answerText.trim()) {
      return { success: false, error: "Session ID and answer text are required." };
    }

    // 1. Insert question into clinical_questions
    const { data: questionData, error: questionError } = await supabase
      .from("clinical_questions")
      .insert({
        session_id: sessionId,
        step_number: stepNumber,
        question_text: questionText,
        question_text_canonical: questionTextCanonical || questionText,
        clinical_domain: questionDomain,
        input_type: "text",
        status: "answered",
      })
      .select("id")
      .single();

    if (questionError || !questionData) {
      return {
        success: false,
        error: `Failed to record question: ${questionError?.message || "Unknown error"}`,
      };
    }

    const questionId = questionData.id;

    // 2. Insert answer into clinical_answers
    const { data: answerData, error: answerError } = await supabase
      .from("clinical_answers")
      .insert({
        question_id: questionId,
        session_id: sessionId,
        raw_answer_text: answerText.trim(),
        input_modality: inputModality,
        extracted_symptoms: extractedSymptoms,
        language_detected: language || "en",
        confidence_score: 0.95,
        answered_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (answerError || !answerData) {
      return {
        success: false,
        error: `Failed to record answer: ${answerError?.message || "Unknown error"}`,
      };
    }

    // 3. If step 1 (chief complaint), sync chief_complaint_raw on clinical_sessions
    if (stepNumber === 1 || questionDomain === "chief_complaint") {
      await supabase
        .from("clinical_sessions")
        .update({ chief_complaint_raw: answerText.trim() })
        .eq("id", sessionId);
    }

    return {
      success: true,
      questionId: questionId,
      answerId: answerData.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return { success: false, error: message };
  }
}

/**
 * Updates the clinical session status and metadata.
 */
export async function updateClinicalSessionStatusAction(
  input: UpdateSessionStatusInput
): Promise<UpdateSessionStatusResult> {
  try {
    const supabase = createServerAdminClient();

    const { sessionId, status, priority, chiefComplaint } = input;

    if (!sessionId) {
      return { success: false, error: "Session ID is required." };
    }

    const updatePayload: {
      status: SessionStatus;
      priority?: PriorityLevel;
      chief_complaint_raw?: string;
      completed_at?: string;
    } = {
      status,
    };

    if (priority) {
      updatePayload.priority = priority;
    }

    if (chiefComplaint) {
      updatePayload.chief_complaint_raw = chiefComplaint;
    }

    if (status === "ready_for_review" || status === "verified") {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("clinical_sessions")
      .update(updatePayload)
      .eq("id", sessionId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update session status: ${updateError.message}`,
      };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return { success: false, error: message };
  }
}
