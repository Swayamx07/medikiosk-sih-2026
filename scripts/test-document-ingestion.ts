/**
 * End-to-End Verification Test Suite for Phase 5:
 * Document Ingestion & Clinical Document Processing
 *
 * Verifies:
 * 1. Valid PDF upload and private storage persistence
 * 2. Storage object retrieval & signed URL generation
 * 3. Document metadata & SHA-256 checksum verification
 * 4. Structured factual extraction (non-diagnostic) into document_extractions
 * 5. Medical timeline synchronization
 * 6. Audit log compliance trail
 * 7. Invalid MIME type rejection
 * 8. Oversized file (>15 MB) rejection
 * 9. Duplicate upload handling per session
 * 10. Physician case-detail visibility of documents and structured findings
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...vals] = trimmed.split("=");
    if (key && vals.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

import { createServerAdminClient } from "../src/lib/supabase/server";
import {
  uploadAndProcessDocumentAction,
  getDocumentSignedUrlAction,
} from "../src/app/actions/documents";
import { getPhysicianCaseDetailAction } from "../src/app/actions/doctor";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runDocumentIngestionTests() {
  console.log("================================================================================");
  console.log("MediKiosk — Phase 5 Document Ingestion & Extraction Verification Suite");
  console.log("================================================================================\n");

  const supabase = createServerAdminClient();

  // Pick an existing demo session (Case 2 - Sunita Patel / chronic follow-up)
  const { data: session, error: sessionErr } = await supabase
    .from("clinical_sessions")
    .select("id, patient_id, session_code")
    .limit(1)
    .single();

  if (sessionErr || !session) {
    console.error("FATAL: Unable to retrieve a test clinical session:", sessionErr?.message);
    process.exit(1);
  }

  const testSessionId = session.id;
  const testPatientId = session.patient_id;

  // Load synthetic PDF fixture
  const fixturePath = path.resolve(
    process.cwd(),
    "supabase/fixtures/lab_report_glycemic_aug2026.pdf"
  );
  if (!fs.existsSync(fixturePath)) {
    console.error("FATAL: Synthetic PDF fixture not found at:", fixturePath);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(fixturePath);
  const expectedChecksum = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

  let uploadedDocId: string | null = null;
  let uploadedStoragePath: string | null = null;

  // ---------------------------------------------------------------------------
  // TEST 1: Valid PDF upload and private storage persistence
  // ---------------------------------------------------------------------------
  try {
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const file = new File([blob], "test_glycemic_report.pdf", {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", testSessionId);
    formData.append("patientId", testPatientId);
    formData.append("documentType", "lab_report");

    const uploadRes = await uploadAndProcessDocumentAction(formData);

    const isPass =
      uploadRes.success === true &&
      Boolean(uploadRes.document?.id) &&
      uploadRes.document?.processingStatus === "completed" &&
      uploadRes.document?.storageBucket === "medical-documents";

    if (uploadRes.document) {
      uploadedDocId = uploadRes.document.id;
      uploadedStoragePath = uploadRes.document.storagePath;
    }

    results.push({
      name: "TEST 1 — Valid PDF upload and private storage persistence",
      passed: isPass,
      details: isPass
        ? `Uploaded document ID: ${uploadedDocId}, Bucket: ${uploadRes.document?.storageBucket}, Path: ${uploadedStoragePath}`
        : `Upload failed: ${uploadRes.error || "Unknown error"}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 1 — Valid PDF upload and private storage persistence",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Storage object verification and signed URL generation
  // ---------------------------------------------------------------------------
  try {
    if (!uploadedStoragePath) {
      throw new Error("Missing storage path from TEST 1");
    }

    const signedRes = await getDocumentSignedUrlAction(uploadedStoragePath);
    const isPass =
      signedRes.success === true &&
      typeof signedRes.signedUrl === "string" &&
      signedRes.signedUrl.includes("token=");

    results.push({
      name: "TEST 2 — Storage object retrieval and signed URL generation",
      passed: isPass,
      details: isPass
        ? `Generated valid signed URL (length ${signedRes.signedUrl?.length} chars) for private storage path`
        : `Failed signed URL generation: ${signedRes.error || "No URL returned"}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 2 — Storage object retrieval and signed URL generation",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Metadata persistence and SHA-256 integrity
  // ---------------------------------------------------------------------------
  try {
    if (!uploadedDocId) throw new Error("Missing document ID from TEST 1");

    const { data: doc, error: dErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", uploadedDocId)
      .single();

    const isPass =
      !dErr &&
      doc !== null &&
      doc.file_checksum_sha256 === expectedChecksum &&
      doc.mime_type === "application/pdf" &&
      doc.file_size_bytes === pdfBuffer.length &&
      doc.processing_status === "completed";

    results.push({
      name: "TEST 3 — Metadata persistence and SHA-256 integrity",
      passed: isPass,
      details: isPass
        ? `Verified SHA-256 matches byte-for-byte (${doc.file_checksum_sha256.substring(0, 16)}...), size: ${doc.file_size_bytes} bytes`
        : `Metadata mismatch: ${dErr?.message || "Fields did not match"}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 3 — Metadata persistence and SHA-256 integrity",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Structured non-diagnostic clinical extraction
  // ---------------------------------------------------------------------------
  try {
    if (!uploadedDocId) throw new Error("Missing document ID from TEST 1");

    const { data: ext, error: eErr } = await supabase
      .from("document_extractions")
      .select("*")
      .eq("document_id", uploadedDocId)
      .single();

    const labResults = ext?.extracted_lab_results as Array<{ testName: string; value: string }>;
    const isPass =
      !eErr &&
      ext !== null &&
      Array.isArray(labResults) &&
      labResults.length > 0 &&
      Number(ext.confidence_score) >= 0.7 &&
      typeof ext.issuing_facility_or_doctor === "string";

    results.push({
      name: "TEST 4 — Structured non-diagnostic clinical extraction",
      passed: isPass,
      details: isPass
        ? `Extracted ${labResults.length} lab tests (e.g. ${labResults[0].testName}=${labResults[0].value}), Provider: ${ext.extraction_provider}, Confidence: ${ext.confidence_score}`
        : `Extraction check failed: ${eErr?.message || "Invalid extraction payload"}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 4 — Structured non-diagnostic clinical extraction",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Medical timeline synchronization
  // ---------------------------------------------------------------------------
  try {
    if (!uploadedDocId) throw new Error("Missing document ID from TEST 1");

    const { data: timeline, error: tErr } = await supabase
      .from("medical_timeline")
      .select("*")
      .eq("source_document_id", uploadedDocId);

    const isPass = !tErr && Array.isArray(timeline) && timeline.length > 0;

    results.push({
      name: "TEST 5 — Medical timeline synchronization",
      passed: isPass,
      details: isPass
        ? `Synchronized ${timeline.length} timeline investigation records linked to document ${uploadedDocId}`
        : `Timeline sync failed: ${tErr?.message || "Zero timeline items found"}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 5 — Medical timeline synchronization",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Audit log compliance trail
  // ---------------------------------------------------------------------------
  try {
    const { data: logs, error: lErr } = await supabase
      .from("audit_logs")
      .select("event_type, event_description")
      .eq("session_id", testSessionId)
      .in("event_type", ["document_uploaded", "document_extracted"]);

    const hasUpload = logs?.some((l) => l.event_type === "document_uploaded");
    const hasExtract = logs?.some((l) => l.event_type === "document_extracted");
    const isPass = !lErr && Boolean(hasUpload) && Boolean(hasExtract);

    results.push({
      name: "TEST 6 — Audit log compliance trail",
      passed: isPass,
      details: isPass
        ? `Audit events recorded: document_uploaded ✓, document_extracted ✓`
        : `Audit log check failed: ${lErr?.message || "Missing required audit event types"}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 6 — Audit log compliance trail",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Invalid MIME type rejection
  // ---------------------------------------------------------------------------
  try {
    const invalidBlob = new Blob(["malicious script content"], { type: "text/plain" });
    const invalidFile = new File([invalidBlob], "virus.txt", { type: "text/plain" });

    const badForm = new FormData();
    badForm.append("file", invalidFile);
    badForm.append("sessionId", testSessionId);
    badForm.append("patientId", testPatientId);
    badForm.append("documentType", "other");

    const badRes = await uploadAndProcessDocumentAction(badForm);
    const isPass = badRes.success === false && Boolean(badRes.error?.includes("Unsupported file type"));

    results.push({
      name: "TEST 7 — Invalid MIME type rejection",
      passed: isPass,
      details: isPass
        ? `Correctly rejected text/plain: "${badRes.error}"`
        : `Failed: Server accepted invalid MIME type`,
    });
  } catch (err) {
    results.push({
      name: "TEST 7 — Invalid MIME type rejection",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Oversized file rejection (> 15 MB)
  // ---------------------------------------------------------------------------
  try {
    // Construct real oversized file (16 MB)
    const oversizedBlob = new Blob([new Uint8Array(16 * 1024 * 1024)], {
      type: "application/pdf",
    });
    const oversizedFile = new File([oversizedBlob], "giant_scan.pdf", {
      type: "application/pdf",
    });

    const oversizedForm = new FormData();
    oversizedForm.append("file", oversizedFile);
    oversizedForm.append("sessionId", testSessionId);
    oversizedForm.append("patientId", testPatientId);
    oversizedForm.append("documentType", "radiology_report");

    const sizeRes = await uploadAndProcessDocumentAction(oversizedForm);
    const isPass = sizeRes.success === false && Boolean(sizeRes.error?.includes("exceeds the 15 MB limit"));

    results.push({
      name: "TEST 8 — Oversized file rejection (> 15 MB)",
      passed: isPass,
      details: isPass
        ? `Correctly rejected 16 MB file: "${sizeRes.error}"`
        : `Failed: Server accepted oversized file`,
    });
  } catch (err) {
    results.push({
      name: "TEST 8 — Oversized file rejection (> 15 MB)",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Duplicate upload idempotency per session
  // ---------------------------------------------------------------------------
  try {
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const file = new File([blob], "test_glycemic_report.pdf", {
      type: "application/pdf",
    });

    const dupForm = new FormData();
    dupForm.append("file", file);
    dupForm.append("sessionId", testSessionId);
    dupForm.append("patientId", testPatientId);
    dupForm.append("documentType", "lab_report");

    const dupRes = await uploadAndProcessDocumentAction(dupForm);
    const isPass =
      dupRes.success === true &&
      dupRes.document?.id === uploadedDocId &&
      dupRes.document?.fileChecksumSha256 === expectedChecksum;

    results.push({
      name: "TEST 9 — Duplicate upload idempotency per session",
      passed: isPass,
      details: isPass
        ? `Recognized identical checksum (${expectedChecksum.substring(0, 12)}...), reused existing document ID ${dupRes.document?.id}`
        : `Duplicate detection failed`,
    });
  } catch (err) {
    results.push({
      name: "TEST 9 — Duplicate upload idempotency per session",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Physician case-detail visibility of documents & structured findings
  // ---------------------------------------------------------------------------
  try {
    const caseRes = await getPhysicianCaseDetailAction(testSessionId);
    const isPass =
      caseRes.success === true &&
      Array.isArray(caseRes.caseDetail?.documents) &&
      caseRes.caseDetail.documents.length > 0 &&
      Array.isArray(caseRes.caseDetail?.extractions) &&
      caseRes.caseDetail.extractions.length > 0;

    const docCount = caseRes.caseDetail?.documents.length || 0;
    const extCount = caseRes.caseDetail?.extractions.length || 0;

    results.push({
      name: "TEST 10 — Physician case-detail visibility of documents & findings",
      passed: isPass,
      details: isPass
        ? `Physician case detail returned ${docCount} document(s) and ${extCount} extraction(s) for session ${session.session_code}`
        : `Physician detail failed: ${caseRes.error || "No documents in case detail"}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 10 — Physician case-detail visibility of documents & findings",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // Print Test Report
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  let passCount = 0;
  for (const r of results) {
    const status = r.passed ? "[PASS]" : "[FAIL]";
    console.log(`${status} ${r.name}: ${r.details}`);
    if (r.passed) passCount++;
  }
  console.log("--------------------------------------------------------------------------------");
  console.log(`Final Verdict: ${passCount === results.length ? "ALL TESTS PASSED ✓" : `${passCount}/${results.length} PASSED`}`);
  console.log("================================================================================\n");

  if (passCount !== results.length) {
    process.exit(1);
  }
}

runDocumentIngestionTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
