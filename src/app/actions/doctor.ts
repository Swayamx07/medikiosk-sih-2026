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
  PhysicianVerificationPayload,
  VerifyEncounterResult,
  PhysicianReconciliationChanges,
  PhysicianReviewRecord,
  PhysicianReviewStatus,
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
import { mapCanonicalToFhirBundle } from "@/lib/clinical/fhir-mapper";
import { FhirBundle } from "@/types/fhir-r4";
import { validateVerificationPayload } from "@/lib/clinical/verification-validator";

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
      .select(`
        id,
        session_id,
        patient_id,
        physician_id,
        physician_name,
        review_status,
        is_verified,
        edited_clinical_summary,
        physician_notes,
        reconciliation_changes,
        verified_at,
        created_at,
        updated_at
      `)
      .eq("session_id", session.id)
      .maybeSingle();

    const physicianReview: PhysicianReviewRecord | null = review
      ? {
          id: review.id,
          sessionId: review.session_id,
          patientId: review.patient_id,
          physicianId: review.physician_id,
          physicianName: review.physician_name,
          reviewStatus: review.review_status as PhysicianReviewStatus,
          isVerified: review.is_verified,
          editedClinicalSummary: review.edited_clinical_summary,
          physicianNotes: review.physician_notes,
          reconciliationChanges: (review.reconciliation_changes as unknown) as PhysicianReconciliationChanges | null,
          verifiedAt: review.verified_at,
          createdAt: review.created_at,
          updatedAt: review.updated_at,
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

export interface GetEncounterFhirBundleResult {
  success: boolean;
  bundle?: FhirBundle;
  error?: string;
}

/**
 * Retrieves the FHIR R4 Collection Bundle for an encounter.
 * Protected server action requiring an active physician session.
 * Reuses buildCanonicalClinicalRecord() and mapCanonicalToFhirBundle().
 */
export async function getEncounterFhirBundleAction(
  sessionId: string
): Promise<GetEncounterFhirBundleResult> {
  try {
    const physicianSession = await getActivePhysicianSession();
    if (!physicianSession) {
      return {
        success: false,
        error: "Unauthorized: Active physician session required.",
      };
    }

    if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
      return {
        success: false,
        error: "Invalid session identifier provided.",
      };
    }

    const record = await buildCanonicalClinicalRecord(sessionId.trim());
    if (!record) {
      return {
        success: false,
        error: "Encounter not found or canonical record could not be constructed.",
      };
    }

    const bundle = mapCanonicalToFhirBundle(record);
    return {
      success: true,
      bundle,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate FHIR R4 bundle",
    };
  }
}

/**
 * Protected Server Action: Executes official physician sign-off and verification
 * for a clinical encounter.
 *
 * Security & Integrity Guarantees:
 * 1. Requires active physician session (HMAC-SHA256 verified via getActivePhysicianSession()).
 * 2. Physician identity is strictly server-controlled; never accepted from client inputs.
 * 3. Enforces non-repudiation: encounters already marked verified cannot be re-verified.
 * 4. Updates or inserts physician_reviews record (is_verified = true, review_status = 'verified_accepted').
 * 5. Transitions clinical_sessions.status to 'verified'.
 * 6. Transitions clinical_histories.summary_status to 'verified' (if history exists).
 * 7. Records an append-only audit event in audit_logs (event_type = 'case_verified').
 * 8. Leaves document_extractions bulk verification and FHIR cache decoupled as specified.
 */
export async function verifyAndSignOffEncounterAction(
  payload: PhysicianVerificationPayload
): Promise<VerifyEncounterResult> {
  try {
    // 1. Authenticate Physician Session
    const physicianSession = await getActivePhysicianSession();
    if (!physicianSession) {
      return {
        success: false,
        error: "Unauthorized: Active physician session required.",
      };
    }

    // 2. Validate Input Payload
    const validation = validateVerificationPayload(payload);
    if (!validation.isValid || !validation.cleanData) {
      return {
        success: false,
        error: validation.error || "Invalid verification payload.",
      };
    }

    const {
      sessionId,
      physicianNotes,
      editedClinicalSummary,
      reconciliationChanges,
    } = validation.cleanData;

    const supabase = createServerAdminClient();

    // 3. Verify Encounter Existence & Eligibility
    const { data: session, error: sessionErr } = await supabase
      .from("clinical_sessions")
      .select("id, session_code, patient_id, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !session) {
      return {
        success: false,
        error: "Clinical encounter record not found.",
      };
    }

    if (session.status === "abandoned") {
      return {
        success: false,
        error: "Encounter is abandoned and cannot be verified.",
      };
    }

    if (session.status === "verified") {
      return {
        success: false,
        error: "Encounter is already verified and cannot be verified again.",
      };
    }

    // Check existing review to respect non-repudiation
    const { data: existingReview, error: reviewCheckErr } = await supabase
      .from("physician_reviews")
      .select("id, review_status, is_verified")
      .eq("session_id", session.id)
      .maybeSingle();

    if (reviewCheckErr) {
      return {
        success: false,
        error: "Failed to inspect existing review state.",
      };
    }

    if (existingReview?.is_verified) {
      return {
        success: false,
        error: "Encounter is already verified and cannot be verified again.",
      };
    }

    const verifiedAt = new Date().toISOString();

    // 4. Create or Update physician_reviews Record
    const reviewData = {
      session_id: session.id,
      patient_id: session.patient_id,
      physician_id: physicianSession.physicianId,
      physician_name: physicianSession.fullName,
      review_status: "verified_accepted" as const,
      is_verified: true,
      verified_at: verifiedAt,
      physician_notes: physicianNotes,
      edited_clinical_summary: editedClinicalSummary,
      reconciliation_changes: reconciliationChanges,
    };

    let insertedReviewId: string | null = null;
    let reviewMutationError: string | null = null;

    if (existingReview) {
      const { error: updateReviewErr } = await supabase
        .from("physician_reviews")
        .update(reviewData)
        .eq("id", existingReview.id);

      if (updateReviewErr) {
        reviewMutationError = updateReviewErr.message;
      }
    } else {
      const { data: insertedReview, error: insertReviewErr } = await supabase
        .from("physician_reviews")
        .insert(reviewData)
        .select("id")
        .maybeSingle();

      if (insertReviewErr) {
        reviewMutationError = insertReviewErr.message;
      } else if (insertedReview) {
        insertedReviewId = insertedReview.id;
      }
    }

    if (reviewMutationError) {
      return {
        success: false,
        error: "Failed to persist physician review verification record.",
      };
    }

    // 5. Update clinical_sessions Status to 'verified'
    // NOTE: clinical_sessions.assigned_physician_id remains unchanged (verification != assignment)
    const { error: sessionUpdateErr } = await supabase
      .from("clinical_sessions")
      .update({
        status: "verified",
        completed_at: verifiedAt,
      })
      .eq("id", session.id);

    if (sessionUpdateErr) {
      // Compensating rollback: Revert physician_reviews to prevent inconsistent verified state
      if (existingReview) {
        await supabase
          .from("physician_reviews")
          .update({
            review_status: existingReview.review_status,
            is_verified: existingReview.is_verified,
            verified_at: null,
          })
          .eq("id", existingReview.id);
      } else if (insertedReviewId) {
        await supabase
          .from("physician_reviews")
          .delete()
          .eq("id", insertedReviewId);
      }

      return {
        success: false,
        error: "Failed to update clinical session status to verified.",
      };
    }

    // 6. Transition clinical_histories summary_status if record exists
    const { data: historyRecord } = await supabase
      .from("clinical_histories")
      .select("id, summary_status")
      .eq("session_id", session.id)
      .maybeSingle();

    if (historyRecord) {
      const { error: histErr } = await supabase
        .from("clinical_histories")
        .update({
          summary_status: "verified",
          ...(editedClinicalSummary ? { ai_clinical_summary: editedClinicalSummary } : {}),
        })
        .eq("id", historyRecord.id);

      if (histErr) {
        console.error("Warning: Failed to update clinical_histories status", histErr.message);
      }
    }

    // 7. Record Immutable Audit Event
    const { error: auditErr } = await supabase.from("audit_logs").insert({
      session_id: session.id,
      patient_id: session.patient_id,
      actor_type: "physician",
      actor_id: physicianSession.physicianId,
      event_type: "case_verified",
      event_description: `Encounter verified and signed off by ${physicianSession.fullName}. Non-repudiation lock engaged.`,
      metadata: {
        physician_id: physicianSession.physicianId,
        physician_name: physicianSession.fullName,
        review_status: "verified_accepted",
        is_verified: true,
        verified_at: verifiedAt,
        reconciliation_entries_count: reconciliationChanges?.entries?.length || 0,
      },
    });

    if (auditErr) {
      console.error("Warning: Failed to record audit log for verification", auditErr.message);
    }

    // 8. Return Safe Verification Result
    return {
      success: true,
      sessionId: session.id,
      reviewStatus: "verified_accepted",
      isVerified: true,
      verifiedBy: physicianSession.physicianId,
      verifiedByName: physicianSession.fullName,
      verifiedAt,
      encounterStatus: "verified",
    };
  } catch (err) {
    console.error("verifyAndSignOffEncounterAction unexpected error:", err);
    return {
      success: false,
      error: "An unexpected error occurred during physician verification.",
    };
  }
}
