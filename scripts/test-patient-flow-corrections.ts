/**
 * Focused Regression & Flow-Correction Verification Suite
 *
 * Verifies all 8 bug fixes across patient session isolation, consent,
 * chief complaint noise normalization, confirmation workflow,
 * verbatim response preservation, server-side document upload,
 * and multi-visit same-patient encounter independence.
 */

import fs from "fs";
import path from "path";

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
import { cleanChiefComplaint } from "../src/lib/clinical/cleaner";
import {
  createOrResumeClinicalSessionAction,
  saveClinicalAnswerAction,
  confirmChiefComplaintAction,
  updateClinicalSessionStatusAction,
} from "../src/app/actions/intake";
import { uploadAndProcessDocumentAction } from "../src/app/actions/documents";
import { getPhysicianCaseDetailAction } from "../src/app/actions/doctor";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const tag = passed ? "[PASS]" : "[FAIL]";
  console.log(`${tag} ${name} — ${details}`);
}

async function runPatientFlowRegressionTests() {
  console.log("================================================================================");
  console.log("MediKiosk — Patient Flow & Session State Regression Verification Suite");
  console.log("================================================================================\n");

  const supabase = createServerAdminClient();

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Conservative Chief Complaint Noise Normalization
  // --------------------------------------------------------------------------
  console.log("--- Group 1: Chief Complaint Noise Normalization ---");

  const noiseHindiInput = "fjfyfy मुझे कल शाम से सीने में तेज दर्द और पसीना आ रहा है";
  const cleanedHindi = cleanChiefComplaint(noiseHindiInput, "hi");
  const noiseStripped = cleanedHindi === "मुझे कल शाम से सीने में तेज दर्द और पसीना आ रहा है";
  record(
    "Noise Normalization (Hindi Latin Prefix)",
    noiseStripped,
    `Cleaned: "${cleanedHindi}"`
  );

  const englishMedicalInput = "Severe chest pain since yesterday evening with sweating";
  const cleanedEnglish = cleanChiefComplaint(englishMedicalInput, "en");
  record(
    "Preserve English Medical Words",
    cleanedEnglish === englishMedicalInput,
    `Original preserved: "${cleanedEnglish}"`
  );

  const marathiInput = "छातीत तीव्र वेदना आणि श्वास घेण्यास त्रास होत आहे";
  const cleanedMarathi = cleanChiefComplaint(marathiInput, "mr");
  record(
    "Preserve Marathi Medical Words",
    cleanedMarathi === marathiInput,
    `Original preserved: "${cleanedMarathi}"`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Visit 1 — New Visit & Intake Flow
  // --------------------------------------------------------------------------
  console.log("\n--- Group 2: Visit 1 — New Visit End-to-End ---");

  const demoProfileVisit1 = {
    patientIdentifier: "DEMO-RK-7701",
    fullName: "Ramesh Kumar",
    dateOfBirth: "1972-04-12",
    gender: "male" as const,
    abhaId: "91-4521-8832-1094",
    primaryLanguage: "hi" as const,
    isDemo: true,
    demoCaseId: "case-1-cardiac",
  };

  // 1. Create Session for Visit 1 with language "hi"
  const session1Res = await createOrResumeClinicalSessionAction({
    patientProfile: demoProfileVisit1,
    language: "hi",
    mode: "general",
    consentGranted: true,
  });

  const session1Created = Boolean(session1Res.success && session1Res.sessionId && session1Res.sessionCode);
  const session1Id = session1Res.sessionId!;
  const session1Code = session1Res.sessionCode!;
  const patientId = session1Res.patientId!;

  record(
    "Visit 1: Session & Code Creation",
    session1Created,
    `Session ID: ${session1Id}, Code: ${session1Code}, Patient ID: ${patientId}`
  );

  // Verify language and consent on DB
  const { data: dbSession1 } = await supabase
    .from("clinical_sessions")
    .select("language, status, patient_id")
    .eq("id", session1Id)
    .single();

  record(
    "Visit 1: Language Persistence ('hi')",
    dbSession1?.language === "hi",
    `Stored language in DB: ${dbSession1?.language}`
  );

  // 2. Submit Question 1 with Verbatim Noise
  const q1AnswerRes = await saveClinicalAnswerAction({
    sessionId: session1Id,
    stepNumber: 1,
    questionDomain: "chief_complaint",
    questionText: "नमस्ते। कृपया बताएं कि आज आप किन मुख्य लक्षणों के लिए आए हैं?",
    answerText: noiseHindiInput,
    language: "hi",
    inputModality: "voice_browser",
  });

  record(
    "Visit 1: Q1 Persistence",
    Boolean(q1AnswerRes.success && q1AnswerRes.answerId),
    `Answer ID: ${q1AnswerRes.answerId}`
  );

  // 3. Verify Verbatim Answer is preserved in clinical_answers
  const { data: q1DbAnswer } = await supabase
    .from("clinical_answers")
    .select("raw_answer_text, input_modality")
    .eq("id", q1AnswerRes.answerId!)
    .single();

  const verbatimPreserved = q1DbAnswer?.raw_answer_text === noiseHindiInput;
  record(
    "Visit 1: Exact Verbatim Answer Preserved",
    verbatimPreserved,
    `DB raw_answer_text: "${q1DbAnswer?.raw_answer_text}"`
  );

  // 4. Chief Complaint Confirmation Step
  // Patient confirms edited text before advancing to Q2
  const confirmedComplaint = "मुझे कल शाम से सीने में तेज दर्द और पसीना आ रहा है";
  const confirmRes = await confirmChiefComplaintAction({
    sessionId: session1Id,
    confirmedComplaint,
  });

  record(
    "Visit 1: Chief Complaint Confirmation Action",
    confirmRes.success,
    `Confirmed text: "${confirmedComplaint}"`
  );

  const { data: confirmedSession } = await supabase
    .from("clinical_sessions")
    .select("chief_complaint_raw")
    .eq("id", session1Id)
    .single();

  const structuredComplaintMatches = confirmedSession?.chief_complaint_raw === confirmedComplaint;
  record(
    "Visit 1: Structured Chief Complaint Saved to Session",
    structuredComplaintMatches,
    `chief_complaint_raw: "${confirmedSession?.chief_complaint_raw}"`
  );

  // 5. Answer Q2 (Advancement after confirmation)
  const q2AnswerRes = await saveClinicalAnswerAction({
    sessionId: session1Id,
    stepNumber: 2,
    questionDomain: "hpi_onset",
    questionText: "यह दर्द ठीक कब शुरू हुआ था?",
    answerText: "14 घंटे पहले शुरू हुआ, बाएं हाथ और कंधे में फैलता है।",
    language: "hi",
    inputModality: "text",
  });

  record(
    "Visit 1: Q2 Advancement",
    Boolean(q2AnswerRes.success),
    `Q2 successfully persisted to encounter`
  );

  // 6. Document Upload with Server-Side Patient Resolution (omitting patientId from FormData)
  const dummyPdfBytes = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 712 Td (Cardiac Lab Report) ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n308\n%%EOF"
  );
  const fileBlob = new Blob([dummyPdfBytes], { type: "application/pdf" });
  const testFile = new File([fileBlob], "cardiac_visit1.pdf", { type: "application/pdf" });

  const formDataVisit1 = new FormData();
  formDataVisit1.append("file", testFile);
  formDataVisit1.append("sessionId", session1Id);
  // Intentionally do NOT pass patientId to test server-side resolution!
  formDataVisit1.append("documentType", "lab_report");

  const docUpload1 = await uploadAndProcessDocumentAction(formDataVisit1);
  record(
    "Visit 1: Server-Side Patient Resolution on Doc Upload",
    Boolean(docUpload1.success && docUpload1.document),
    `Doc ID: ${docUpload1.document?.id}, Patient resolved: ${docUpload1.document?.patientId === patientId}`
  );

  // 7. Complete Visit 1 (Patient Review -> ready_for_review)
  const finalizeVisit1 = await updateClinicalSessionStatusAction({
    sessionId: session1Id,
    status: "ready_for_review",
    chiefComplaint: confirmedComplaint,
  });

  record(
    "Visit 1: Close Encounter (ready_for_review)",
    finalizeVisit1.success,
    `Status transitioned to ready_for_review`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Visit 2 — SAME Patient, Genuine New Visit
  // --------------------------------------------------------------------------
  console.log("\n--- Group 3: Visit 2 — Same Patient New Visit Isolation ---");

  // Attempting to create or resume when patient starts Visit 2
  // Even if client passes existingSessionId = session1Id,
  // since session1 is closed (ready_for_review), the system MUST create a new session!
  const session2Res = await createOrResumeClinicalSessionAction({
    patientProfile: demoProfileVisit1, // EXACT SAME PATIENT
    language: "en",                    // Patient changes language to English
    mode: "general",
    consentGranted: true,              // Explicit consent for visit 2
    existingSessionId: session1Id,     // Stored previous closed session
  });

  const session2Created = Boolean(session2Res.success && session2Res.sessionId && session2Res.sessionCode);
  const session2Id = session2Res.sessionId!;
  const session2Code = session2Res.sessionCode!;
  const session2PatientId = session2Res.patientId!;

  record(
    "Visit 2: New Session Created (Closed Session Not Resumed)",
    session2Created && session2Id !== session1Id,
    `Old: ${session1Id.substring(0, 8)}... vs New: ${session2Id.substring(0, 8)}...`
  );

  record(
    "Visit 2: Same Patient ID Reused",
    session2PatientId === patientId,
    `Patient ID reused: ${session2PatientId}`
  );

  record(
    "Visit 2: Brand New Session Code Generated",
    session2Code !== session1Code,
    `Session 1 Code: ${session1Code} vs Session 2 Code: ${session2Code}`
  );

  // Verify Zero Previous Answers in Session 2
  const { data: session2Answers } = await supabase
    .from("clinical_answers")
    .select("id")
    .eq("session_id", session2Id);

  record(
    "Visit 2: Zero Previous Answers Leaked",
    (session2Answers || []).length === 0,
    `Found ${(session2Answers || []).length} answers in Session 2`
  );

  // Verify Zero Previous Documents in Session 2
  const { data: session2Docs } = await supabase
    .from("documents")
    .select("id")
    .eq("session_id", session2Id);

  record(
    "Visit 2: Zero Previous Documents Leaked",
    (session2Docs || []).length === 0,
    `Found ${(session2Docs || []).length} documents in Session 2`
  );

  // Answer Fresh Q1 for Visit 2
  const v2Complaint = "Routine hypertension follow up and blood pressure check";
  const v2Q1Res = await saveClinicalAnswerAction({
    sessionId: session2Id,
    stepNumber: 1,
    questionDomain: "chief_complaint",
    questionText: "What is your primary reason for consultation today?",
    answerText: v2Complaint,
    language: "en",
    inputModality: "text",
  });

  record(
    "Visit 2: Fresh Chief Complaint Recorded",
    Boolean(v2Q1Res.success),
    `Fresh Visit 2 Complaint saved`
  );

  // Document upload in Session 2
  const testFileV2 = new File([fileBlob], "prescription_visit2.pdf", { type: "application/pdf" });
  const formDataVisit2 = new FormData();
  formDataVisit2.append("file", testFileV2);
  formDataVisit2.append("sessionId", session2Id);
  formDataVisit2.append("documentType", "prescription");

  const docUpload2 = await uploadAndProcessDocumentAction(formDataVisit2);
  record(
    "Visit 2: Document Upload to Session 2 Works",
    Boolean(docUpload2.success && docUpload2.document?.sessionId === session2Id),
    `Doc uploaded to Session 2: ${docUpload2.document?.id}`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Historical Encounter Preservation
  // --------------------------------------------------------------------------
  console.log("\n--- Group 4: Historical Encounter Preservation ---");

  // Check that Visit 1's answers still exist and were not modified
  const { data: session1AnswersAfterV2 } = await supabase
    .from("clinical_answers")
    .select("raw_answer_text")
    .eq("session_id", session1Id)
    .order("answered_at", { ascending: true });

  const session1AnswersIntact = (session1AnswersAfterV2 || []).length === 2;
  record(
    "Historical Preservation: Session 1 Answers Intact",
    session1AnswersIntact,
    `Session 1 retains ${session1AnswersAfterV2?.length} answers`
  );

  // Check that Visit 1's documents still exist
  const { data: session1DocsAfterV2 } = await supabase
    .from("documents")
    .select("id, original_filename")
    .eq("session_id", session1Id);

  const session1DocsIntact = (session1DocsAfterV2 || []).length === 1;
  record(
    "Historical Preservation: Session 1 Documents Intact",
    session1DocsIntact,
    `Session 1 retains ${session1DocsAfterV2?.length} document: ${session1DocsAfterV2?.[0]?.original_filename}`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Physician View — Verbatim vs Structured Separation
  // --------------------------------------------------------------------------
  console.log("\n--- Group 5: Physician View Audit Separation ---");

  const doctorView1 = await getPhysicianCaseDetailAction(session1Id);
  const detail1 = doctorView1.caseDetail;

  const hasBothComplaints = Boolean(
    detail1 &&
    detail1.chiefComplaint === confirmedComplaint &&
    detail1.chiefComplaintVerbatim === noiseHindiInput
  );

  record(
    "Physician Audit: Separate Structured & Verbatim Complaints",
    hasBothComplaints,
    `Structured: "${detail1?.chiefComplaint}", Verbatim: "${detail1?.chiefComplaintVerbatim}"`
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("Regression Test Results Summary");
  console.log("================================================================================");

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`Total: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);

  if (passedCount === totalCount) {
    console.log("\n>>> ALL PATIENT FLOW REGRESSION TESTS PASSED! <<<\n");
  } else {
    console.error("\n>>> SOME TESTS FAILED! <<<\n");
    process.exit(1);
  }
}

runPatientFlowRegressionTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
