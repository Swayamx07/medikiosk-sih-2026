import { createServerAdminClient } from "@/lib/supabase/server";
import { extractStructuredConversationEntities } from "./conversation-extractor";
import { evaluateDocumentPatientRelevance } from "@/lib/ai/document-extractor";
import {
  SupportedLanguage,
  ExtractedPatientHeader,
  PatientRelevanceAssessment,
  CanonicalEncounterRecord,
} from "@/types/clinical";

export type { CanonicalEncounterRecord } from "@/types/clinical";

interface RawAnswerRow {
  id: string;
  raw_answer_text: string;
  input_modality: string;
  language_detected: string | null;
}

/**
 * Builds the canonical clinical encounter record for a session from Supabase.
 * Strictly separates:
 * 1. Patient-provided information
 * 2. Document-extracted factual findings
 * 3. Deterministic safety triage results
 * 4. Physician verification status
 */
export async function buildCanonicalClinicalRecord(
  sessionId: string
): Promise<CanonicalEncounterRecord | null> {
  const supabase = createServerAdminClient();

  // 1. Fetch Session and Patient
  const { data: session, error: sErr } = await supabase
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
        primary_language,
        abha_id,
        is_demo
      ),
      triage_alerts (
        id,
        alert_level,
        trigger_rule_id,
        trigger_reason,
        trigger_symptoms,
        is_acknowledged
      )
    `)
    .eq("id", sessionId)
    .maybeSingle();

  if (sErr || !session) {
    return null;
  }

  const patient = Array.isArray(session.patients) ? session.patients[0] : session.patients;

  // 2. Fetch Q&A for Conversation Entity Extraction
  const { data: questions } = await supabase
    .from("clinical_questions")
    .select(`
      id,
      step_number,
      clinical_domain,
      question_text,
      clinical_answers (
        id,
        raw_answer_text,
        input_modality,
        language_detected
      )
    `)
    .eq("session_id", sessionId)
    .order("step_number", { ascending: true });

  const dialogueSteps = (questions || [])
    .filter((q) => {
      const answers = q.clinical_answers as unknown as RawAnswerRow[] | null;
      return Array.isArray(answers) && answers.length > 0;
    })
    .map((q) => {
      const answers = q.clinical_answers as unknown as RawAnswerRow[];
      const ans = answers[0];
      return {
        stepNumber: q.step_number,
        domain: q.clinical_domain,
        questionText: q.question_text,
        answerText: ans.raw_answer_text,
        language: (ans.language_detected as SupportedLanguage) || "en",
      };
    });

  const conversationFindings = extractStructuredConversationEntities(
    dialogueSteps,
    session.chief_complaint_raw || undefined
  );

  // 3. Fetch Documents & Extractions
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("session_id", sessionId);

  const { data: extractions } = await supabase
    .from("document_extractions")
    .select("*")
    .eq("session_id", sessionId);

  const docList = (documents || []).map((doc) => {
    const ext = (extractions || []).find((e) => e.document_id === doc.id);
    const payloadObj = (ext?.raw_extracted_payload || {}) as Record<string, unknown>;

    const extractedHeader = (payloadObj.extractedPatientHeader ||
      payloadObj.patientHeader ||
      undefined) as ExtractedPatientHeader | undefined;

    const relevance: PatientRelevanceAssessment =
      (payloadObj.patientRelevance as PatientRelevanceAssessment) ||
      evaluateDocumentPatientRelevance(extractedHeader, {
        fullName: patient?.full_name || "Unknown Patient",
        dateOfBirth: patient?.date_of_birth,
        gender: patient?.gender,
        patientIdentifier: patient?.patient_identifier,
        abhaId: patient?.abha_id,
      });

    return {
      documentId: doc.id,
      filename: doc.original_filename,
      documentType: doc.document_type,
      uploadedAt: doc.uploaded_at,
      fileSizeBytes: doc.file_size_bytes,
      mimeType: doc.mime_type,
      relevanceStatus: relevance.status,
      relevanceAssessment: relevance,
    };
  });

  const labInvestigations: CanonicalEncounterRecord["extractedFindings"]["laboratoryInvestigations"] = [];
  const documentedConditions: CanonicalEncounterRecord["extractedFindings"]["documentedConditions"] = [];
  const docMedications: CanonicalEncounterRecord["medications"]["documentExtracted"] = [];

  for (const ext of extractions || []) {
    const parentDoc = (documents || []).find((d) => d.id === ext.document_id);
    const filename = parentDoc?.original_filename || "Attached Medical Record";

    for (const lab of ext.extracted_lab_results || []) {
      labInvestigations.push({
        testName: lab.testName || lab.test || "Unknown Investigation",
        value: String(lab.value ?? "N/A"),
        unit: lab.unit,
        referenceRange: lab.referenceRange || lab.reference_range,
        isAbnormal: Boolean(lab.isAbnormal || lab.is_abnormal),
        flag: lab.flag,
        sourceDocumentFilename: filename,
        source: "extracted_document",
      });
    }

    for (const med of ext.extracted_medications || []) {
      docMedications.push({
        name: med.name || "Unknown Medication",
        dosage: med.dosage || med.strength,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
        sourceDocumentFilename: filename,
        source: "extracted_document",
      });
    }

    for (const cond of ext.extracted_conditions || []) {
      documentedConditions.push({
        name: cond.name || cond.condition || "Clinical Condition",
        status: cond.status,
        notes: cond.notes,
        sourceDocumentFilename: filename,
        source: "extracted_document",
      });
    }
  }

  // 4. Fetch Physician Verification Review
  const { data: review } = await supabase
    .from("physician_reviews")
    .select("review_status, is_verified, physician_notes, verified_at, physician_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  // 5. Triage Alert Resolution
  interface RawDbTriageAlert {
    id: string;
    alert_level: string;
    trigger_rule_id: string;
    trigger_reason: string;
    trigger_symptoms: string[];
    is_acknowledged: boolean;
  }
  const alerts = ((session.triage_alerts || []) as unknown) as RawDbTriageAlert[];
  const criticalAlert = alerts.find((a) => a.alert_level === "critical_red_flag");

  return {
    patient: {
      patientIdentifier: patient?.patient_identifier || "UNKNOWN",
      fullName: patient?.full_name || "Unknown Patient",
      dateOfBirth: patient?.date_of_birth || "1980-01-01",
      gender: patient?.gender || "prefer_not_to_say",
      phoneNumber: patient?.phone_number,
      primaryLanguage: session.language,
      abhaId: patient?.abha_id,
      isDemo: patient?.is_demo ?? true,
    },
    encounter: {
      sessionId: session.id,
      sessionCode: session.session_code,
      mode: session.mode,
      status: session.status,
      priority: session.priority,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      assignedPhysicianId: session.assigned_physician_id,
    },
    chiefComplaint: {
      confirmed:
        session.chief_complaint_raw ||
        conversationFindings.chiefComplaint.verbatim ||
        "No chief complaint recorded",
      verbatimAudit: conversationFindings.chiefComplaint.verbatim,
      language: session.language,
      source: "patient_reported",
    },
    symptoms: conversationFindings.symptoms.map((s) => ({
      name: s.symptomName,
      onset: s.onset,
      duration: s.duration,
      severity: s.severity,
      location: s.location,
      radiation: s.radiation,
      source: "patient_reported",
      provenance: {
        stepNumber: s.stepNumber,
        questionDomain: s.questionDomain,
        verbatimQuote: s.sourceText,
      },
    })),
    history: {
      pastMedicalConditions: conversationFindings.conditions.map((c) => ({
        name: c.conditionName,
        status: c.status,
        source: "patient_reported",
        provenance: {
          stepNumber: c.stepNumber,
          verbatimQuote: c.sourceText,
        },
      })),
      familyHistory: [],
    },
    medications: {
      patientReported: conversationFindings.medications.map((m) => ({
        name: m.medicationName,
        dosage: m.dosage,
        frequency: m.frequency,
        source: "patient_reported",
        provenance: {
          stepNumber: m.stepNumber,
          verbatimQuote: m.sourceText,
        },
      })),
      documentExtracted: docMedications,
    },
    allergies: {
      patientReported: conversationFindings.allergies.map((a) => ({
        allergen: a.allergen,
        reaction: a.reaction,
        source: "patient_reported",
        provenance: {
          stepNumber: a.stepNumber,
          verbatimQuote: a.sourceText,
        },
      })),
    },
    documents: docList,
    extractedFindings: {
      laboratoryInvestigations: labInvestigations,
      documentedConditions: documentedConditions,
    },
    triage: {
      priority: session.priority,
      criticalRedFlag: Boolean(criticalAlert),
      ruleId: criticalAlert?.trigger_rule_id,
      reason: criticalAlert?.trigger_reason,
      detectedSymptoms: (criticalAlert?.trigger_symptoms as string[]) || [],
      evaluatedBy: "deterministic_safety_engine",
    },
    provenance: {
      generatedAt: new Date().toISOString(),
      systemVersion: "MediKiosk v1.0 (SIH 2026)",
      sources: {
        patientProvided: "kiosk_q_and_a",
        documentExtracted: "multimodal_ocr",
        triageEvaluation: "deterministic_rules",
        physicianVerification: review?.is_verified ? "verified" : "pending_review",
      },
      verificationStatus: {
        isVerifiedByPhysician: Boolean(review?.is_verified),
        verifiedAt: review?.verified_at || null,
        verifiedBy: review?.physician_id || null,
        physicianNotes: review?.physician_notes || null,
      },
    },
  };
}
