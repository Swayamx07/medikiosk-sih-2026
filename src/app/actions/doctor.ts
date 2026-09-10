"use server";

import { createServerAdminClient } from "@/lib/supabase/server";
import {
  PhysicianQueueItem,
  PhysicianCaseDetail,
  CaseAnswerDetail,
  TriageAlertRecord,
  PriorityLevel,
  SessionStatus,
  IntakeMode,
  SupportedLanguage,
  Gender,
  UploadedDocumentRecord,
  DocumentExtractionRecord,
  DocumentType,
  ExtractedPatientHeader,
  PatientRelevanceAssessment,
  ClinicalDomain,
} from "@/types/clinical";
import {
  extractStructuredConversationEntities,
  ConversationStepInput,
} from "@/lib/clinical/conversation-extractor";
import {
  buildCanonicalClinicalRecord,
  CanonicalEncounterRecord,
} from "@/lib/clinical/canonical-record";
import { evaluateDocumentPatientRelevance } from "@/lib/ai/document-extractor";
import { getActivePhysicianSession } from "@/lib/auth/physician-session";

export interface GetPhysicianQueueResult {
  success: boolean;
  queue: PhysicianQueueItem[];
  error?: string;
}

/**
 * Retrieves live outpatient clinical sessions sorted by clinical priority
 * (emergency/red-flag cases first, then urgent, then recency).
 */
export async function getPhysicianQueueAction(): Promise<GetPhysicianQueueResult> {
  try {
    const physicianSession = await getActivePhysicianSession();
    if (!physicianSession) {
      return {
        success: false,
        queue: [],
        error: "Unauthorized: Active physician session required.",
      };
    }

    const supabase = createServerAdminClient();

    const { data: sessions, error } = await supabase
      .from("clinical_sessions")
      .select(`
        id,
        session_code,
        patient_id,
        mode,
        status,
        language,
        chief_complaint_raw,
        priority,
        started_at,
        completed_at,
        patients (
          id,
          patient_identifier,
          full_name,
          date_of_birth,
          gender
        ),
        triage_alerts (
          id,
          alert_level,
          trigger_rule_id,
          is_acknowledged
        )
      `)
      .order("started_at", { ascending: false });

    if (error) {
      return { success: false, queue: [], error: error.message };
    }

    const priorityWeight: Record<string, number> = {
      emergency: 1,
      urgent: 2,
      normal: 3,
    };

    const queue: PhysicianQueueItem[] = (sessions || []).map((s) => {
      const patient = Array.isArray(s.patients) ? s.patients[0] : s.patients;
      const alerts = Array.isArray(s.triage_alerts) ? s.triage_alerts : [];
      const criticalAlert = alerts.find(
        (a) => a.alert_level === "critical_red_flag"
      );

      return {
        sessionId: s.id,
        sessionCode: s.session_code,
        patientId: s.patient_id,
        patientIdentifier: patient?.patient_identifier || "UNKNOWN",
        patientName: patient?.full_name || "Unknown Patient",
        dateOfBirth: patient?.date_of_birth,
        gender: patient?.gender as Gender,
        mode: s.mode as IntakeMode,
        language: s.language as SupportedLanguage,
        status: s.status as SessionStatus,
        priority: s.priority as PriorityLevel,
        chiefComplaint: s.chief_complaint_raw || "No chief complaint recorded",
        startedAt: s.started_at,
        completedAt: s.completed_at,
        triageAlertCount: alerts.length,
        hasCriticalRedFlag: Boolean(criticalAlert),
        triggerRuleId: criticalAlert?.trigger_rule_id,
        isAcknowledged: criticalAlert ? criticalAlert.is_acknowledged : undefined,
      };
    });

    // Sort emergency/high-priority cases to top of queue
    queue.sort((a, b) => {
      const weightA = priorityWeight[a.priority] || 4;
      const weightB = priorityWeight[b.priority] || 4;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

    return { success: true, queue };
  } catch (err) {
    return {
      success: false,
      queue: [],
      error: err instanceof Error ? err.message : "Internal server error",
    };
  }
}

export interface GetPhysicianCaseDetailResult {
  success: boolean;
  caseDetail?: PhysicianCaseDetail;
  error?: string;
}

/**
 * Retrieves comprehensive case encounter details for clinical review.
 * Supports identifier lookup by UUID session ID, session code, or patient demo ID.
 */
export async function getPhysicianCaseDetailAction(
  idOrCode: string
): Promise<GetPhysicianCaseDetailResult> {
  try {
    const physicianSession = await getActivePhysicianSession();
    if (!physicianSession) {
      return {
        success: false,
        error: "Unauthorized: Active physician session required.",
      };
    }

    const supabase = createServerAdminClient();

    if (!idOrCode) {
      return { success: false, error: "Case identifier is required." };
    }

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrCode
      );

    let sessionQuery = supabase
      .from("clinical_sessions")
      .select(`
        id,
        session_code,
        patient_id,
        mode,
        status,
        language,
        chief_complaint_raw,
        priority,
        started_at,
        completed_at,
        assigned_physician_id,
        patients (
          id,
          patient_identifier,
          full_name,
          date_of_birth,
          gender,
          phone_number,
          abha_id,
          is_demo,
          demo_case_id
        ),
        triage_alerts (
          id,
          session_id,
          patient_id,
          alert_level,
          trigger_rule_id,
          trigger_reason,
          trigger_symptoms,
          is_acknowledged,
          acknowledged_by,
          acknowledged_at,
          created_at
        )
      `);

    if (isUuid) {
      sessionQuery = sessionQuery.eq("id", idOrCode);
    } else if (idOrCode.startsWith("CS-")) {
      sessionQuery = sessionQuery.eq("session_code", idOrCode);
    } else {
      // Match by legacy demo slug or partial code
      // E.g. "case-01-acute" -> match Demo Case 1 session
      if (idOrCode.includes("01") || idOrCode.includes("acute")) {
        sessionQuery = sessionQuery.eq("session_code", "CS-2026-0908-01");
      } else if (idOrCode.includes("02") || idOrCode.includes("chronic")) {
        sessionQuery = sessionQuery.eq("session_code", "CS-2026-0908-02");
      } else if (idOrCode.includes("03") || idOrCode.includes("verified")) {
        sessionQuery = sessionQuery.eq("session_code", "CS-2026-0908-03");
      } else {
        sessionQuery = sessionQuery.eq("session_code", idOrCode);
      }
    }

    const { data: session, error: sErr } = await sessionQuery.maybeSingle();

    if (sErr || !session) {
      return {
        success: false,
        error: `Clinical encounter record not found for: ${idOrCode}`,
      };
    }

    const patient = Array.isArray(session.patients)
      ? session.patients[0]
      : session.patients;

    const triageAlerts: TriageAlertRecord[] = (
      Array.isArray(session.triage_alerts) ? session.triage_alerts : []
    ).map((a) => ({
      id: a.id,
      sessionId: a.session_id,
      patientId: a.patient_id,
      alertLevel: a.alert_level,
      triggerRuleId: a.trigger_rule_id,
      triggerReason: a.trigger_reason,
      triggerSymptoms: a.trigger_symptoms || [],
      isAcknowledged: a.is_acknowledged,
      acknowledgedBy: a.acknowledged_by,
      acknowledgedAt: a.acknowledged_at,
      createdAt: a.created_at,
    }));

    const hasCriticalRedFlag = triageAlerts.some(
      (a) => a.alertLevel === "critical_red_flag"
    );

    // Fetch chronological intake questions and patient responses
    const { data: questions } = await supabase
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
          input_modality,
          language_detected,
          confidence_score,
          answered_at
        )
      `)
      .eq("session_id", session.id)
      .order("step_number", { ascending: true });

    const history: CaseAnswerDetail[] = (questions || [])
      .filter(
        (q) =>
          q.clinical_answers &&
          (q.clinical_answers as Array<{
            id: string;
            raw_answer_text: string;
            input_modality: string;
            language_detected: string;
            confidence_score: number;
            answered_at: string;
          }>).length > 0
      )
      .map((q) => {
        const answers = q.clinical_answers as Array<{
          id: string;
          raw_answer_text: string;
          input_modality: "text" | "voice_browser" | "voice_bhashini" | "touch_choice";
          language_detected: string;
          confidence_score: number;
          answered_at: string;
        }>;
        const ans = answers[0];
        return {
          questionId: q.id,
          stepNumber: q.step_number,
          questionDomain: q.clinical_domain,
          questionText: q.question_text,
          questionTextCanonical: q.question_text_canonical,
          answerId: ans.id,
          answerText: ans.raw_answer_text,
          inputModality: ans.input_modality || "text",
          languageDetected: ans.language_detected || "en",
          confidenceScore: ans.confidence_score,
          answeredAt: ans.answered_at,
        };
      });

    // Check existing physician verification review record
    const { data: review } = await supabase
      .from("physician_reviews")
      .select("id, review_status, is_verified, edited_clinical_summary, physician_notes")
      .eq("session_id", session.id)
      .maybeSingle();

    const physicianReview = review
      ? {
          id: review.id,
          reviewStatus: review.review_status,
          isVerified: review.is_verified,
          editedClinicalSummary: review.edited_clinical_summary,
          physicianNotes: review.physician_notes,
        }
      : null;

    // Fetch uploaded documents and extractions for the encounter
    const { data: rawDocs } = await supabase
      .from("documents")
      .select("*")
      .eq("session_id", session.id)
      .order("uploaded_at", { ascending: false });

    const documents: UploadedDocumentRecord[] = (rawDocs || []).map((d) => ({
      id: d.id,
      sessionId: d.session_id,
      patientId: d.patient_id,
      documentType: d.document_type as DocumentType,
      originalFilename: d.original_filename,
      storageBucket: d.storage_bucket,
      storagePath: d.storage_path,
      mimeType: d.mime_type,
      fileSizeBytes: d.file_size_bytes,
      fileChecksumSha256: d.file_checksum_sha256,
      processingStatus: d.processing_status,
      errorMessage: d.error_message,
      uploadedAt: d.uploaded_at,
      createdAt: d.created_at,
    }));

    const { data: rawExtractions } = await supabase
      .from("document_extractions")
      .select("*")
      .eq("session_id", session.id);

    const extractions: DocumentExtractionRecord[] = (rawExtractions || []).map(
      (e) => {
        const rawPayload = (e.raw_extracted_payload || {}) as Record<string, unknown>;
        const extractedHeader = (rawPayload.extractedPatientHeader ||
          rawPayload.patientHeader ||
          null) as ExtractedPatientHeader | null;

        let relevance = (rawPayload.patientRelevance ||
          null) as PatientRelevanceAssessment | null;

        if (!relevance && patient) {
          relevance = evaluateDocumentPatientRelevance(extractedHeader || undefined, {
            patientIdentifier: patient.patient_identifier,
            fullName: patient.full_name,
            dateOfBirth: patient.date_of_birth,
            gender: patient.gender,
            abhaId: patient.abha_id,
          });
        }

        return {
          id: e.id,
          documentId: e.document_id,
          sessionId: e.session_id,
          extractedDate: e.extracted_date,
          issuingFacilityOrDoctor: e.issuing_facility_or_doctor,
          extractedPatientHeader: extractedHeader,
          patientRelevance: relevance,
          extractedLabResults: e.extracted_lab_results || [],
          extractedMedications: e.extracted_medications || [],
          extractedConditions: e.extracted_conditions || [],
          rawExtractedPayload: rawPayload,
          confidenceScore: e.confidence_score ? Number(e.confidence_score) : null,
          extractionProvider: e.extraction_provider,
          isVerified: e.is_verified,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        };
      }
    );

    // Build structured conversation entities with provenance
    const dialogueSteps: ConversationStepInput[] = history.map((h) => ({
      stepNumber: h.stepNumber,
      domain: h.questionDomain as ClinicalDomain,
      questionText: h.questionText,
      answerText: h.answerText,
      language: (h.languageDetected || "en") as SupportedLanguage,
    }));

    const structuredFindings = extractStructuredConversationEntities(
      dialogueSteps,
      session.chief_complaint_raw || undefined
    );

    // Build encounter-level canonical clinical record
    const canonicalRecord = await buildCanonicalClinicalRecord(session.id);

    return {
      success: true,
      caseDetail: {
        sessionId: session.id,
        sessionCode: session.session_code,
        patientId: session.patient_id,
        patient: {
          id: patient?.id || session.patient_id,
          patientIdentifier: patient?.patient_identifier || "UNKNOWN",
          fullName: patient?.full_name || "Unknown Patient",
          dateOfBirth: patient?.date_of_birth || "1980-01-01",
          gender: patient?.gender || "prefer_not_to_say",
          phoneNumber: patient?.phone_number,
          abhaId: patient?.abha_id,
          isDemo: patient?.is_demo ?? true,
          demoCaseId: patient?.demo_case_id,
        },
        mode: session.mode as IntakeMode,
        language: session.language as SupportedLanguage,
        status: session.status as SessionStatus,
        priority: session.priority as PriorityLevel,
        chiefComplaint: session.chief_complaint_raw || "No chief complaint recorded",
        chiefComplaintVerbatim: history.find(
          (h) => h.stepNumber === 1 || h.questionDomain === "chief_complaint"
        )?.answerText,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        assignedPhysicianId: session.assigned_physician_id,
        triageAlerts,
        hasCriticalRedFlag,
        history,
        documents,
        extractions,
        structuredFindings,
        canonicalRecord,
        physicianReview,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    };
  }
}

/**
 * Retrieves only the Canonical Encounter Record JSON for an encounter.
 */
export async function getCanonicalEncounterJsonAction(
  sessionId: string
): Promise<{ success: boolean; record?: CanonicalEncounterRecord | null; error?: string }> {
  try {
    const physicianSession = await getActivePhysicianSession();
    if (!physicianSession) {
      return {
        success: false,
        error: "Unauthorized: Active physician session required.",
      };
    }

    const record = await buildCanonicalClinicalRecord(sessionId);
    return { success: true, record };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate canonical record",
    };
  }
}
