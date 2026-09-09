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
  TriageEvaluationResult,
  TriageAlertLevel,
} from "@/types/clinical";
import {
  generateNextIntakeQuestion,
  GenerateQuestionInput,
  StructuredQuestionOutput,
} from "@/lib/ai";
import { evaluateSessionTriage } from "@/lib/clinical/triage";
import { cleanChiefComplaint } from "@/lib/clinical/cleaner";

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
  confirmedChiefComplaint?: string;
}

export interface SaveAnswerResult {
  success: boolean;
  questionId?: string;
  answerId?: string;
  triageAlert?: TriageEvaluationResult;
  cleanedChiefComplaint?: string;
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
        .select("id, session_code, patient_id, status, language")
        .eq("id", existingSessionId)
        .maybeSingle();

      if (!checkError && existingSession) {
        // Only resume if the session is genuinely in an active, in-progress intake state
        const isActive =
          existingSession.status === "intake_active" ||
          existingSession.status === "interview_complete" ||
          existingSession.status === "documents_uploaded";

        if (isActive) {
          // Synchronize language if patient changed it
          if (language && existingSession.language !== language) {
            await supabase
              .from("clinical_sessions")
              .update({ language })
              .eq("id", existingSession.id);
          }

          return {
            success: true,
            sessionId: existingSession.id,
            sessionCode: existingSession.session_code,
            patientId: existingSession.patient_id,
          };
        }
        // If the session was already completed or closed (e.g. ready_for_review, verified),
        // it must NOT be resumed. Fall through to create a brand new session for this patient below!
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

    // 3. If step 1 (chief complaint), sync structured chief complaint on clinical_sessions
    let structuredComplaint: string | undefined = undefined;
    if (stepNumber === 1 || questionDomain === "chief_complaint") {
      structuredComplaint =
        input.confirmedChiefComplaint?.trim() ||
        cleanChiefComplaint(answerText.trim(), language);

      await supabase
        .from("clinical_sessions")
        .update({ chief_complaint_raw: structuredComplaint })
        .eq("id", sessionId);
    }

    // 4. Fetch cumulative answers and session info for deterministic safety evaluation
    // Execution Order: Answer has already been persisted to clinical_answers above.
    const { data: allAnswers } = await supabase
      .from("clinical_answers")
      .select("raw_answer_text")
      .eq("session_id", sessionId)
      .order("answered_at", { ascending: true });

    const cumulativeTexts = (allAnswers || []).map((a) => a.raw_answer_text);
    if (cumulativeTexts.length === 0) {
      cumulativeTexts.push(answerText.trim());
    }

    // 5. Run pure deterministic triage evaluator
    const triageResult = evaluateSessionTriage(cumulativeTexts);
    let finalTriageAlert: TriageEvaluationResult | undefined = undefined;

    if (triageResult.triggered && triageResult.triggerRuleId) {
      // Retrieve patient_id for foreign key reference
      const { data: sessionData } = await supabase
        .from("clinical_sessions")
        .select("patient_id, priority")
        .eq("id", sessionId)
        .single();

      if (sessionData?.patient_id) {
        // DUPLICATE PREVENTION: check if this rule has already fired for this session
        const { data: existingAlert } = await supabase
          .from("triage_alerts")
          .select(
            "id, alert_level, trigger_rule_id, trigger_reason, trigger_symptoms, is_acknowledged"
          )
          .eq("session_id", sessionId)
          .eq("trigger_rule_id", triageResult.triggerRuleId)
          .maybeSingle();

        if (existingAlert) {
          finalTriageAlert = {
            triggered: true,
            alertLevel: existingAlert.alert_level as TriageAlertLevel,
            triggerRuleId: existingAlert.trigger_rule_id,
            triggerReason: existingAlert.trigger_reason,
            triggerSymptoms: (existingAlert.trigger_symptoms as string[]) || [],
            isExisting: true,
          };
        } else {
          // Escalate session priority to 'emergency' while preserving status lifecycle
          await supabase
            .from("clinical_sessions")
            .update({ priority: "emergency" })
            .eq("id", sessionId);

          // Populate existing triage_alerts schema
          const { error: alertError } = await supabase
            .from("triage_alerts")
            .insert({
              session_id: sessionId,
              patient_id: sessionData.patient_id,
              alert_level: triageResult.alertLevel || "critical_red_flag",
              trigger_rule_id: triageResult.triggerRuleId,
              trigger_reason: triageResult.triggerReason || "",
              trigger_symptoms: triageResult.triggerSymptoms || [],
              is_acknowledged: false,
            });

          if (alertError) {
            console.warn("Could not record triage alert row:", alertError.message);
          }

          finalTriageAlert = {
            ...triageResult,
            isExisting: false,
          };
        }
      }
    }

    return {
      success: true,
      questionId: questionId,
      answerId: answerData.id,
      triageAlert: finalTriageAlert,
      cleanedChiefComplaint: structuredComplaint || undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return { success: false, error: message };
  }
}

/**
 * Confirms or updates the structured chief complaint for the active clinical session.
 */
export async function confirmChiefComplaintAction(input: {
  sessionId: string;
  confirmedComplaint: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerAdminClient();
    const { sessionId, confirmedComplaint } = input;
    if (!sessionId || !confirmedComplaint.trim()) {
      return { success: false, error: "Session ID and complaint are required." };
    }

    const { error } = await supabase
      .from("clinical_sessions")
      .update({ chief_complaint_raw: confirmedComplaint.trim() })
      .eq("id", sessionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
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

export interface SessionHistoryItem {
  questionId: string;
  stepNumber: number;
  questionDomain: ClinicalDomain;
  questionText: string;
  questionTextCanonical: string;
  answerId: string;
  answerText: string;
  answeredAt: string;
}

export interface GetSessionHistoryResult {
  success: boolean;
  history?: SessionHistoryItem[];
  chiefComplaint?: string;
  status?: SessionStatus;
  triageAlert?: TriageEvaluationResult;
  error?: string;
}

/**
 * Retrieves the recorded question and answer history for an active session.
 */
export async function getSessionHistoryAction(
  sessionId: string
): Promise<GetSessionHistoryResult> {
  try {
    const supabase = createServerAdminClient();

    if (!sessionId) {
      return { success: false, error: "Session ID is required." };
    }

    const { data: questions, error: qErr } = await supabase
      .from("clinical_questions")
      .select(`
        id,
        step_number,
        clinical_domain,
        question_text,
        question_text_canonical,
        clinical_answers (
          id,
          raw_answer_text,
          answered_at
        )
      `)
      .eq("session_id", sessionId)
      .order("step_number", { ascending: true });

    if (qErr) {
      return { success: false, error: qErr.message };
    }

    const { data: session } = await supabase
      .from("clinical_sessions")
      .select("status, chief_complaint_raw")
      .eq("id", sessionId)
      .maybeSingle();

    // Check if session has any active triage alert
    const { data: alert } = await supabase
      .from("triage_alerts")
      .select(
        "alert_level, trigger_rule_id, trigger_reason, trigger_symptoms, is_acknowledged"
      )
      .eq("session_id", sessionId)
      .maybeSingle();

    const triageAlert: TriageEvaluationResult | undefined = alert
      ? {
          triggered: true,
          alertLevel: alert.alert_level as TriageAlertLevel,
          triggerRuleId: alert.trigger_rule_id,
          triggerReason: alert.trigger_reason,
          triggerSymptoms: (alert.trigger_symptoms as string[]) || [],
          isExisting: true,
        }
      : undefined;

    const history: SessionHistoryItem[] = (questions || [])
      .filter(
        (q) =>
          q.clinical_answers &&
          (q.clinical_answers as Array<{ id: string; raw_answer_text: string; answered_at: string }>).length > 0
      )
      .map((q) => {
        const answers = q.clinical_answers as Array<{
          id: string;
          raw_answer_text: string;
          answered_at: string;
        }>;
        const ans = answers[0];
        return {
          questionId: q.id,
          stepNumber: q.step_number,
          questionDomain: q.clinical_domain as ClinicalDomain,
          questionText: q.question_text,
          questionTextCanonical: q.question_text_canonical,
          answerId: ans.id,
          answerText: ans.raw_answer_text,
          answeredAt: ans.answered_at,
        };
      });

    return {
      success: true,
      history,
      chiefComplaint: session?.chief_complaint_raw || undefined,
      status: (session?.status as SessionStatus) || undefined,
      triageAlert,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return { success: false, error: message };
  }
}

export interface GenerateNextQuestionResult {
  success: boolean;
  question: StructuredQuestionOutput;
  error?: string;
}

/**
 * Generates the next conversational intake question via server-side AI adapter.
 * Uses Gemini if configured; gracefully falls back to deterministic questions.
 */
export async function generateNextQuestionAction(
  input: GenerateQuestionInput
): Promise<GenerateNextQuestionResult> {
  try {
    const question = await generateNextIntakeQuestion(input);
    return { success: true, question };
  } catch (err) {
    // Ultimate fallback if any unhandled error occurs
    const { MockAIProvider } = await import("@/lib/ai/mock-provider");
    const mock = new MockAIProvider();
    const fallback = await mock.generateNextQuestion(input);
    return {
      success: true,
      question: fallback,
      error: err instanceof Error ? err.message : "Fallback activated",
    };
  }
}


