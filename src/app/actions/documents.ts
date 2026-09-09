"use server";

import crypto from "crypto";
import { createServerAdminClient } from "@/lib/supabase/server";
import {
  DocumentType,
  UploadedDocumentRecord,
  DocumentExtractionRecord,
  PatientRelevanceAssessment,
  ExtractedPatientHeader,
} from "@/types/clinical";
import {
  extractClinicalDocument,
  evaluateDocumentPatientRelevance,
} from "@/lib/ai/document-extractor";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB limit from DB constraint

export interface UploadDocumentResult {
  success: boolean;
  document?: UploadedDocumentRecord;
  extraction?: DocumentExtractionRecord;
  error?: string;
}

export interface GetSessionDocumentsResult {
  success: boolean;
  documents: UploadedDocumentRecord[];
  extractions: DocumentExtractionRecord[];
  error?: string;
}

export interface SignedUrlResult {
  success: boolean;
  signedUrl?: string;
  error?: string;
}

/**
 * Server action to validate, persist, upload to private storage,
 * and extract factual clinical entities from uploaded medical records.
 */
export async function uploadAndProcessDocumentAction(
  formData: FormData
): Promise<UploadDocumentResult> {
  try {
    const supabase = createServerAdminClient();

    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;
    let patientId = formData.get("patientId") as string | null;
    const documentType = (formData.get("documentType") as DocumentType) || "lab_report";

    if (!file || typeof file === "string" || typeof file.size !== "number") {
      return { success: false, error: "No valid file provided for upload." };
    }
    if (!sessionId) {
      return {
        success: false,
        error: "Missing active session identifier.",
      };
    }

    // Resolve patientId server-side from clinical_sessions if missing from client payload
    if (!patientId) {
      const { data: sessionData } = await supabase
        .from("clinical_sessions")
        .select("patient_id")
        .eq("id", sessionId)
        .maybeSingle();

      if (sessionData?.patient_id) {
        patientId = sessionData.patient_id;
      }
    }

    if (!patientId) {
      return {
        success: false,
        error: "Active clinical session or patient profile could not be verified.",
      };
    }

    // 1. Validate File Size
    if (file.size <= 0) {
      return { success: false, error: "Uploaded file is empty (0 bytes)." };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: `File size exceeds the 15 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      };
    }

    // 2. Validate MIME Type
    const mimeType = file.type || "application/pdf";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return {
        success: false,
        error: `Unsupported file type: "${mimeType}". Allowed formats are PDF, JPEG, PNG, and WebP.`,
      };
    }

    // 3. Compute SHA-256 Checksum
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // 4. Duplicate Check: Prevent identical re-uploads in the same session
    const { data: existingDoc } = await supabase
      .from("documents")
      .select("id, processing_status")
      .eq("session_id", sessionId)
      .eq("file_checksum_sha256", checksum)
      .maybeSingle();

    if (existingDoc && existingDoc.processing_status === "completed") {
      // Fetch existing extraction
      const { data: existingExtraction } = await supabase
        .from("document_extractions")
        .select("*")
        .eq("document_id", existingDoc.id)
        .maybeSingle();

      const { data: fullDoc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", existingDoc.id)
        .single();

      return {
        success: true,
        document: fullDoc
          ? {
              id: fullDoc.id,
              sessionId: fullDoc.session_id,
              patientId: fullDoc.patient_id,
              documentType: fullDoc.document_type as DocumentType,
              originalFilename: fullDoc.original_filename,
              storageBucket: fullDoc.storage_bucket,
              storagePath: fullDoc.storage_path,
              mimeType: fullDoc.mime_type,
              fileSizeBytes: fullDoc.file_size_bytes,
              fileChecksumSha256: fullDoc.file_checksum_sha256,
              processingStatus: fullDoc.processing_status,
              errorMessage: fullDoc.error_message,
              uploadedAt: fullDoc.uploaded_at,
              createdAt: fullDoc.created_at,
            }
          : undefined,
        extraction: existingExtraction
          ? {
              id: existingExtraction.id,
              documentId: existingExtraction.document_id,
              sessionId: existingExtraction.session_id,
              extractedDate: existingExtraction.extracted_date,
              issuingFacilityOrDoctor:
                existingExtraction.issuing_facility_or_doctor,
              extractedPatientHeader:
                ((existingExtraction.raw_extracted_payload as Record<string, unknown>)
                  ?.extractedPatientHeader as ExtractedPatientHeader) || null,
              patientRelevance:
                ((existingExtraction.raw_extracted_payload as Record<string, unknown>)
                  ?.patientRelevance as PatientRelevanceAssessment) || null,
              extractedLabResults: existingExtraction.extracted_lab_results || [],
              extractedMedications:
                existingExtraction.extracted_medications || [],
              extractedConditions: existingExtraction.extracted_conditions || [],
              rawExtractedPayload: existingExtraction.raw_extracted_payload || {},
              confidenceScore: existingExtraction.confidence_score
                ? Number(existingExtraction.confidence_score)
                : null,
              extractionProvider: existingExtraction.extraction_provider,
              isVerified: existingExtraction.is_verified,
              createdAt: existingExtraction.created_at,
              updatedAt: existingExtraction.updated_at,
            }
          : undefined,
      };
    }

    // 5. Upload Buffer to Private Supabase Storage Bucket
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `patients/${patientId}/sessions/${sessionId}/${timestamp}_${sanitizedFilename}`;

    const { error: storageErr } = await supabase.storage
      .from("medical-documents")
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (storageErr) {
      return {
        success: false,
        error: `Storage upload failed: ${storageErr.message}`,
      };
    }

    // 6. Insert Metadata into documents Table
    const { data: docRecord, error: docErr } = await supabase
      .from("documents")
      .insert({
        session_id: sessionId,
        patient_id: patientId,
        document_type: documentType,
        original_filename: file.name,
        storage_bucket: "medical-documents",
        storage_path: storagePath,
        mime_type: mimeType,
        file_size_bytes: file.size,
        file_checksum_sha256: checksum,
        processing_status: "processing",
      })
      .select()
      .single();

    if (docErr || !docRecord) {
      return {
        success: false,
        error: `Failed to persist document metadata: ${docErr?.message || "Unknown error"}`,
      };
    }

    // Log upload audit event
    await supabase.from("audit_logs").insert({
      session_id: sessionId,
      patient_id: patientId,
      actor_type: "patient_kiosk",
      actor_id: patientId,
      event_type: "document_uploaded",
      event_description: `Uploaded medical record: ${file.name} (${documentType}, ${(file.size / 1024).toFixed(1)} KB)`,
      metadata: {
        document_id: docRecord.id,
        storage_path: storagePath,
        mime_type: mimeType,
        checksum,
      },
    });

    // 7. Perform Multimodal Clinical Extraction
    const extractionResult = await extractClinicalDocument({
      fileBuffer: buffer,
      mimeType,
      originalFilename: file.name,
      documentType,
    });

    const payload = extractionResult.payload;

    // 8. Fetch active patient demographics and evaluate patient-document relevance
    const { data: patientRecord } = await supabase
      .from("patients")
      .select("full_name, date_of_birth, gender, patient_identifier, abha_id")
      .eq("id", patientId)
      .maybeSingle();

    const relevanceAssessment = evaluateDocumentPatientRelevance(
      payload.extractedPatientHeader,
      {
        fullName: patientRecord?.full_name || "Unknown Patient",
        dateOfBirth: patientRecord?.date_of_birth,
        gender: patientRecord?.gender,
        patientIdentifier: patientRecord?.patient_identifier,
        abhaId: patientRecord?.abha_id,
      }
    );

    // 9. Insert Structured Output into document_extractions Table
    const { data: extractionRecord, error: extractErr } = await supabase
      .from("document_extractions")
      .insert({
        document_id: docRecord.id,
        session_id: sessionId,
        extracted_date: payload.extractedDate || null,
        issuing_facility_or_doctor: payload.issuingFacilityOrDoctor || null,
        extracted_lab_results: payload.labResults,
        extracted_medications: payload.medications,
        extracted_conditions: payload.conditions,
        raw_extracted_payload: {
          summary: payload.rawSummary,
          provider: extractionResult.provider,
          extracted_at: new Date().toISOString(),
          extractedPatientHeader: payload.extractedPatientHeader || null,
          patientRelevance: relevanceAssessment,
        },
        confidence_score: extractionResult.confidenceScore,
        extraction_provider: extractionResult.provider,
        is_verified: false,
      })
      .select()
      .single();

    if (extractErr || !extractionRecord) {
      // Update document status to failed
      await supabase
        .from("documents")
        .update({
          processing_status: "failed",
          error_message: extractErr?.message || "Extraction failed to persist",
        })
        .eq("id", docRecord.id);

      return {
        success: false,
        error: `Failed to record clinical extraction: ${extractErr?.message}`,
      };
    }

    // 9. Sync Timeline Entries into medical_timeline
    const timelineInserts = [];
    const eventDate = payload.extractedDate || new Date().toISOString().split("T")[0];

    for (const lab of payload.labResults) {
      timelineInserts.push({
        patient_id: patientId,
        session_id: sessionId,
        source_document_id: docRecord.id,
        event_date: eventDate,
        event_type: "investigation_lab",
        title: lab.testName,
        description: `Value: ${lab.value} ${lab.unit || ""}${lab.referenceRange ? ` (Ref: ${lab.referenceRange})` : ""}`,
        is_abnormal: Boolean(lab.isAbnormal),
        metadata: {
          flag: lab.flag,
          value: lab.value,
          unit: lab.unit,
        },
        source_type: "extracted_from_document",
      });
    }

    for (const med of payload.medications) {
      timelineInserts.push({
        patient_id: patientId,
        session_id: sessionId,
        source_document_id: docRecord.id,
        event_date: eventDate,
        event_type: "medication",
        title: med.name,
        description: `${med.dosage || ""} ${med.frequency || ""}${med.instructions ? ` — ${med.instructions}` : ""}`.trim(),
        is_abnormal: false,
        metadata: {
          dosage: med.dosage,
          frequency: med.frequency,
        },
        source_type: "extracted_from_document",
      });
    }

    if (timelineInserts.length > 0) {
      await supabase.from("medical_timeline").insert(timelineInserts);
    }

    // 10. Update Document Status to Completed & Session Status
    await supabase
      .from("documents")
      .update({ processing_status: "completed" })
      .eq("id", docRecord.id);

    await supabase
      .from("clinical_sessions")
      .update({ status: "documents_uploaded" })
      .eq("id", sessionId)
      .in("status", ["intake_active", "interview_complete"]);

    // Log extraction audit event
    await supabase.from("audit_logs").insert({
      session_id: sessionId,
      patient_id: patientId,
      actor_type: "ai_system",
      actor_id: extractionResult.provider,
      event_type: "document_extracted",
      event_description: `Extracted ${payload.labResults.length} labs, ${payload.medications.length} meds from ${file.name}`,
      metadata: {
        document_id: docRecord.id,
        extraction_id: extractionRecord.id,
        provider: extractionResult.provider,
        confidence: extractionResult.confidenceScore,
      },
    });

    const formattedDoc: UploadedDocumentRecord = {
      id: docRecord.id,
      sessionId: docRecord.session_id,
      patientId: docRecord.patient_id,
      documentType: docRecord.document_type as DocumentType,
      originalFilename: docRecord.original_filename,
      storageBucket: docRecord.storage_bucket,
      storagePath: docRecord.storage_path,
      mimeType: docRecord.mime_type,
      fileSizeBytes: docRecord.file_size_bytes,
      fileChecksumSha256: docRecord.file_checksum_sha256,
      processingStatus: "completed",
      errorMessage: null,
      uploadedAt: docRecord.uploaded_at,
      createdAt: docRecord.created_at,
    };

    const formattedExtraction: DocumentExtractionRecord = {
      id: extractionRecord.id,
      documentId: extractionRecord.document_id,
      sessionId: extractionRecord.session_id,
      extractedDate: extractionRecord.extracted_date,
      issuingFacilityOrDoctor: extractionRecord.issuing_facility_or_doctor,
      extractedPatientHeader: payload.extractedPatientHeader || null,
      patientRelevance: relevanceAssessment,
      extractedLabResults: extractionRecord.extracted_lab_results || [],
      extractedMedications: extractionRecord.extracted_medications || [],
      extractedConditions: extractionRecord.extracted_conditions || [],
      rawExtractedPayload: extractionRecord.raw_extracted_payload || {},
      confidenceScore: extractionRecord.confidence_score
        ? Number(extractionRecord.confidence_score)
        : null,
      extractionProvider: extractionRecord.extraction_provider,
      isVerified: extractionRecord.is_verified,
      createdAt: extractionRecord.created_at,
      updatedAt: extractionRecord.updated_at,
    };

    return {
      success: true,
      document: formattedDoc,
      extraction: formattedExtraction,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    };
  }
}

/**
 * Retrieves all uploaded documents and structured extractions for an active session.
 */
export async function getSessionDocumentsAction(
  sessionId: string
): Promise<GetSessionDocumentsResult> {
  try {
    const supabase = createServerAdminClient();

    const { data: docs, error: dErr } = await supabase
      .from("documents")
      .select("*")
      .eq("session_id", sessionId)
      .order("uploaded_at", { ascending: false });

    if (dErr) {
      return { success: false, documents: [], extractions: [], error: dErr.message };
    }

    const { data: extractions, error: eErr } = await supabase
      .from("document_extractions")
      .select("*")
      .eq("session_id", sessionId);

    if (eErr) {
      return { success: false, documents: [], extractions: [], error: eErr.message };
    }

    const formattedDocs: UploadedDocumentRecord[] = (docs || []).map((d) => ({
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

    const formattedExtractions: DocumentExtractionRecord[] = (extractions || []).map(
      (e) => {
        const payloadObj = (e.raw_extracted_payload || {}) as Record<string, unknown>;
        return {
          id: e.id,
          documentId: e.document_id,
          sessionId: e.session_id,
          extractedDate: e.extracted_date,
          issuingFacilityOrDoctor: e.issuing_facility_or_doctor,
          extractedPatientHeader: (payloadObj.extractedPatientHeader as ExtractedPatientHeader) || null,
          patientRelevance: (payloadObj.patientRelevance as PatientRelevanceAssessment) || null,
          extractedLabResults: e.extracted_lab_results || [],
          extractedMedications: e.extracted_medications || [],
          extractedConditions: e.extracted_conditions || [],
          rawExtractedPayload: payloadObj,
          confidenceScore: e.confidence_score ? Number(e.confidence_score) : null,
          extractionProvider: e.extraction_provider,
          isVerified: e.is_verified,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        };
      }
    );

    return {
      success: true,
      documents: formattedDocs,
      extractions: formattedExtractions,
    };
  } catch (err) {
    return {
      success: false,
      documents: [],
      extractions: [],
      error: err instanceof Error ? err.message : "Internal server error",
    };
  }
}

/**
 * Generates a short-lived (15 minutes) signed URL for secure document access.
 */
export async function getDocumentSignedUrlAction(
  storagePath: string
): Promise<SignedUrlResult> {
  try {
    const supabase = createServerAdminClient();

    if (!storagePath) {
      return { success: false, error: "Storage path is required." };
    }

    const { data, error } = await supabase.storage
      .from("medical-documents")
      .createSignedUrl(storagePath, 900); // 900s = 15 minutes

    if (error || !data?.signedUrl) {
      return {
        success: false,
        error: error?.message || "Failed to generate signed URL.",
      };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    };
  }
}
