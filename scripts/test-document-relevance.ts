/**
 * Verification Test Suite for Document-Patient Relevance Evaluation
 */

import { evaluateDocumentPatientRelevance } from "../src/lib/ai/document-extractor";

async function runRelevanceTests() {
  console.log("================================================================================");
  console.log("MediKiosk — Document-Patient Relevance Verification Suite");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details: string = "") {
    if (condition) {
      console.log(`[PASS] ${title} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  const activePatient = {
    fullName: "Sunita Patel",
    dateOfBirth: "1965-08-23",
    gender: "female",
    patientIdentifier: "DEMO-PT-002",
    abhaId: "91-3142-9981-6450",
  };

  // 1. Exact Identity Match -> Verified
  const exactMatchDoc = {
    patientName: "Sunita Patel",
    dateOfBirth: "1965-08-23",
    gender: "female",
    abhaId: "91-3142-9981-6450",
  };
  const res1 = evaluateDocumentPatientRelevance(exactMatchDoc, activePatient);
  assert(
    res1.status === "verified" && res1.score >= 0.8,
    "Exact Match Evaluates to 'verified'",
    `Score: ${res1.score}, Matches: ${res1.matchedFields.join(", ")}`
  );

  // 2. Name match with honorifics -> Verified
  const honorificDoc = {
    patientName: "Mrs. Sunita Patel",
    gender: "female",
  };
  const res2 = evaluateDocumentPatientRelevance(honorificDoc, activePatient);
  assert(
    res2.status === "verified" && res2.matchedFields.includes("patientName"),
    "Name with Honorific Evaluates to 'verified'",
    `Reasons: ${res2.reasons[0]}`
  );

  // 3. Generic Lab Report without Patient Header -> Insufficient Info
  const genericDoc = {
    patientName: null,
    dateOfBirth: null,
    abhaId: null,
    patientIdentifier: null,
  };
  const res3 = evaluateDocumentPatientRelevance(genericDoc, activePatient);
  assert(
    res3.status === "insufficient_info",
    "Generic Unattributed Document Evaluates to 'insufficient_info'",
    "Correctly never declared verified"
  );

  // 4. Mismatch on Patient Name -> Mismatch
  const mismatchedNameDoc = {
    patientName: "Ramesh Kumar",
    gender: "male",
    dateOfBirth: "1972-04-12",
  };
  const res4 = evaluateDocumentPatientRelevance(mismatchedNameDoc, activePatient);
  assert(
    res4.status === "mismatch" && res4.mismatchedFields.includes("patientName"),
    "Different Patient Name Evaluates to 'mismatch'",
    `Mismatches: ${res4.mismatchedFields.join(", ")}`
  );

  // 5. Mismatch on ABHA ID -> Mismatch
  const mismatchedAbhaDoc = {
    patientName: "Sunita Patel",
    abhaId: "91-9999-9999-9999", // Different ABHA
  };
  const res5 = evaluateDocumentPatientRelevance(mismatchedAbhaDoc, activePatient);
  assert(
    res5.status === "mismatch" && res5.mismatchedFields.includes("abhaId"),
    "Conflicting ABHA ID Evaluates to 'mismatch'",
    `Mismatches: ${res5.mismatchedFields.join(", ")}`
  );

  // 6. Mismatch on Gender -> Mismatch
  const mismatchedGenderDoc = {
    patientName: "Sunita Patel",
    gender: "male", // Active patient is female
  };
  const res6 = evaluateDocumentPatientRelevance(mismatchedGenderDoc, activePatient);
  assert(
    res6.status === "mismatch" && res6.mismatchedFields.includes("gender"),
    "Conflicting Gender Evaluates to 'mismatch'",
    `Mismatches: ${res6.mismatchedFields.join(", ")}`
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runRelevanceTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
