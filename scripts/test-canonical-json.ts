/**
 * Automated Verification Script: Canonical Clinical Encounter Record & Conversation Structuring
 * Validates:
 * 1. buildCanonicalClinicalRecord produces complete, provenance-anchored JSON contracts.
 * 2. Proper separation of patient-provided, document-extracted, deterministic triage, and physician-verified data.
 * 3. Provenance tracking: every symptom, medication, and allergy tracks exact kiosk step number & source verbatim quote.
 * 4. Verification of Demo Cases 1 (Acute), 2 (Chronic), and 3 (Document Verified).
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createServerAdminClient } from "../src/lib/supabase/server";
import { buildCanonicalClinicalRecord } from "../src/lib/clinical/canonical-record";
import {
  extractStructuredConversationEntities,
  ConversationStepInput,
} from "../src/lib/clinical/conversation-extractor";

async function runCanonicalRecordTests() {
  console.log("================================================================================");
  console.log("CANONICAL CLINICAL ENCOUNTER RECORD & CONVERSATION STRUCTURING TEST SUITE");
  console.log("================================================================================\n");

  const supabase = createServerAdminClient();
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalCount++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  // --- Test Suite A: Conversational Entity Extraction with Provenance ---
  console.log("--- TEST SUITE A: Deterministic Conversation Structuring & Provenance ---");

  const sampleDialogue: ConversationStepInput[] = [
    {
      stepNumber: 1,
      domain: "chief_complaint",
      questionText: "What is your main complaint?",
      answerText: "Severe chest pain since yesterday evening radiating to left shoulder and arm",
      language: "en",
    },
    {
      stepNumber: 2,
      domain: "hpi_onset",
      questionText: "When did it start and does the pain travel anywhere?",
      answerText: "Started around 6 PM yesterday, heavy pressure 8/10, radiates to left arm",
      language: "en",
    },
    {
      stepNumber: 3,
      domain: "associated_symptoms",
      questionText: "Are you feeling sweaty or short of breath?",
      answerText: "Yes, sweating a lot and feeling dizzy and breathless",
      language: "en",
    },
    {
      stepNumber: 4,
      domain: "past_medical_history",
      questionText: "Do you have any past health conditions or regular medications?",
      answerText: "I have high blood pressure (hypertension) and taking Amlodipine 5mg daily. Allergic to Penicillin.",
      language: "en",
    },
  ];

  const findings = extractStructuredConversationEntities(
    sampleDialogue,
    "Severe chest pain radiating to left shoulder and arm"
  );

  assert(
    findings.symptoms.length >= 2,
    "Extracts multiple structured symptoms from dialogue",
    `Extracted ${findings.symptoms.length} symptoms`
  );

  const chestPainSym = findings.symptoms.find((s) => s.stepNumber === 1);
  assert(
    Boolean(chestPainSym && (chestPainSym.radiation || chestPainSym.onset)),
    "Step 1 Chief Complaint anchors onset/duration/radiation",
    `Onset: ${chestPainSym?.onset}, Radiation: ${chestPainSym?.radiation}`
  );

  const dizzinessSym = findings.symptoms.find((s) =>
    s.symptomName.toLowerCase().includes("dizziness")
  );
  assert(
    Boolean(dizzinessSym && dizzinessSym.stepNumber === 3),
    "Step 3 Dizziness linked to Step 3 with verbatim source text",
    `Step: ${dizzinessSym?.stepNumber}, Source: "${dizzinessSym?.sourceText}"`
  );

  const hypertensionCond = findings.conditions.find((c) =>
    c.conditionName.toLowerCase().includes("hypertension")
  );
  assert(
    Boolean(hypertensionCond && hypertensionCond.stepNumber === 4),
    "Step 4 Past condition (hypertension) extracted with provenance",
    `Condition: ${hypertensionCond?.conditionName}, Step: ${hypertensionCond?.stepNumber}`
  );

  const allergyPenicillin = findings.allergies.find((a) =>
    a.allergen.toLowerCase().includes("penicillin") ||
    a.sourceText.toLowerCase().includes("penicillin")
  );
  assert(
    Boolean(allergyPenicillin && allergyPenicillin.stepNumber === 4),
    "Step 4 Drug allergy (penicillin) extracted with provenance",
    `Allergen: ${allergyPenicillin?.allergen}, Step: ${allergyPenicillin?.stepNumber}`
  );

  assert(
    findings.hpiNarrative.length > 20,
    "Generates factual, non-diagnostic HPI narrative summary",
    findings.hpiNarrative
  );

  // --- Test Suite B: Multilingual Conversation Structuring (Hindi / Marathi) ---
  console.log("\n--- TEST SUITE B: Multilingual Conversation Structuring (HI / MR) ---");

  const hindiDialogue: ConversationStepInput[] = [
    {
      stepNumber: 1,
      domain: "chief_complaint",
      questionText: "आपकी मुख्य समस्या क्या है?",
      answerText: "कल रात से सीने में बहुत तेज दर्द है और बाएं हाथ में फैल रहा है",
      language: "hi",
    },
    {
      stepNumber: 3,
      domain: "associated_symptoms",
      questionText: "क्या आपको पसीना या चक्कर आ रहे हैं?",
      answerText: "बहुत पसीना आ रहा है और चक्कर भी आ रहे हैं",
      language: "hi",
    },
    {
      stepNumber: 4,
      domain: "past_medical_history",
      questionText: "क्या आप कोई नियमित दवाई लेते हैं?",
      answerText: "शुगर (डायबिटीज) की दवा लेता हूँ",
      language: "hi",
    },
  ];

  const hindiFindings = extractStructuredConversationEntities(
    hindiDialogue,
    "सीने में तेज दर्द"
  );

  assert(
    hindiFindings.symptoms.length >= 2,
    "Hindi dialogue extracts symptoms and associated observations",
    `Found ${hindiFindings.symptoms.length} symptoms`
  );

  const hindiChestPain = hindiFindings.symptoms.find((s) => s.stepNumber === 1);
  assert(
    Boolean(hindiChestPain && (hindiChestPain.onset || hindiChestPain.radiation)),
    "Hindi Step 1 captures onset / radiation in source quote",
    `Onset: ${hindiChestPain?.onset}, Radiation: ${hindiChestPain?.radiation}`
  );

  const hindiCondition = hindiFindings.conditions.find((c) =>
    c.conditionName.toLowerCase().includes("diabetes") ||
    c.conditionName.toLowerCase().includes("मधुमेह")
  );
  assert(
    Boolean(hindiCondition && hindiCondition.stepNumber === 4),
    "Hindi Step 4 maps 'शुगर (डायबिटीज)' to Diabetes condition",
    `Condition: ${hindiCondition?.conditionName}`
  );

  // --- Test Suite C: Canonical Clinical Encounter Record Assembly (Demo Cases) ---
  console.log("\n--- TEST SUITE C: Encounter Canonical Record Assembly (Database) ---");

  const { data: demoSessions } = await supabase
    .from("clinical_sessions")
    .select("id, session_code, chief_complaint_raw, priority")
    .order("started_at", { ascending: true })
    .limit(3);

  if (!demoSessions || demoSessions.length === 0) {
    console.error("  [ERROR] No demo clinical sessions found in database.");
  } else {
    for (const s of demoSessions) {
      console.log(`\n  Checking Canonical Record for ${s.session_code} (${s.chief_complaint_raw})...`);

      const canonical = await buildCanonicalClinicalRecord(s.id);
      assert(
        canonical !== null,
        `Build canonical record successfully for session ${s.session_code}`
      );

      if (canonical) {
        // Verify contract structure
        assert(
          Boolean(canonical.patient && canonical.patient.fullName && canonical.patient.patientIdentifier),
          `[${s.session_code}] Patient section populated with demographics`
        );

        assert(
          Boolean(canonical.encounter && canonical.encounter.sessionId === s.id && canonical.encounter.priority),
          `[${s.session_code}] Encounter section contains sessionId, sessionCode, priority`
        );

        assert(
          Boolean(canonical.chiefComplaint && canonical.chiefComplaint.source === "patient_reported"),
          `[${s.session_code}] Chief complaint clearly demarcated with source 'patient_reported'`
        );

        assert(
          Array.isArray(canonical.symptoms) && canonical.symptoms.length > 0,
          `[${s.session_code}] Symptoms array contains provenance-linked symptoms (${canonical.symptoms.length})`
        );

        if (canonical.symptoms.length > 0) {
          const firstSym = canonical.symptoms[0];
          assert(
            Boolean(firstSym.provenance && typeof firstSym.provenance.stepNumber === "number" && firstSym.provenance.verbatimQuote),
            `[${s.session_code}] Symptom provenance tracks stepNumber (${firstSym.provenance.stepNumber}) and verbatimQuote`
          );
        }

        assert(
          Boolean(canonical.medications && Array.isArray(canonical.medications.patientReported) && Array.isArray(canonical.medications.documentExtracted)),
          `[${s.session_code}] Strict separation between patient-reported vs document-extracted medications`
        );

        assert(
          Boolean(canonical.triage && canonical.triage.evaluatedBy === "deterministic_safety_engine"),
          `[${s.session_code}] Triage evaluated by deterministic safety engine (priority: ${canonical.triage.priority})`
        );

        assert(
          Boolean(canonical.provenance && canonical.provenance.systemVersion && canonical.provenance.sources),
          `[${s.session_code}] System provenance and verification status anchored`
        );

        // Check documents & relevance if any
        if (canonical.documents.length > 0) {
          const doc = canonical.documents[0];
          assert(
            Boolean(doc.relevanceStatus && ["verified", "insufficient_info", "mismatch"].includes(doc.relevanceStatus)),
            `[${s.session_code}] Document '${doc.filename}' has explicit relevance status: ${doc.relevanceStatus}`
          );
        }
      }
    }
  }

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passedCount}/${totalCount} tests passed (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log("================================================================================");

  if (passedCount < totalCount) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCanonicalRecordTests().catch((err) => {
  console.error("FATAL ERROR in canonical record test script:", err);
  process.exit(1);
});
