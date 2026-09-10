/**
 * Automated Verification Script: Deterministic FHIR R4 Mapper
 *
 * Checkpoint 6.3 Test Suite
 *
 * Verifies:
 * 1. Complete clinical encounter mapping (all required & conditional resources)
 * 2. Closed internal reference integrity (no dangling urn:uuid: references)
 * 3. Zero dummy resources emitted on sparse/empty records
 * 4. Non-numeric laboratory values mapped safely to valueString
 * 5. Numeric laboratory values mapped to valueQuantity without synthetic coding
 * 6. Zero fabricated terminology (no guessed LOINC, SNOMED CT, ICD-10, RxNorm, UCUM)
 * 7. Provenance preservation (interview steps, verbatim quotes, OCR filenames, triage rules)
 * 8. AllergyIntolerance semantics (patient attribute, unconfirmed vs confirmed verification)
 * 9. Medication semantics (MedicationStatement intake history, zero MedicationRequest)
 * 10. Deterministic serialization reproducibility (identical input -> identical output)
 */

import { mapCanonicalToFhirBundle } from "../src/lib/clinical/fhir-mapper";
import { CanonicalEncounterRecord } from "../src/types/clinical";
import {
  FhirEncounter,
  FhirObservation,
  FhirCondition,
  FhirMedicationStatement,
  FhirAllergyIntolerance,
  FhirDocumentReference,
  FhirRiskAssessment,
} from "../src/types/fhir-r4";

// ============================================================================
// Test Fixtures
// ============================================================================

const completeRecord: CanonicalEncounterRecord = {
  patient: {
    patientIdentifier: "PAT-2026-001",
    fullName: "Rajesh Kumar",
    dateOfBirth: "1978-06-12",
    gender: "male",
    phoneNumber: "+91 98765 43210",
    primaryLanguage: "en",
    abhaId: "91-1234-5678-9012",
    isDemo: true,
  },
  encounter: {
    sessionId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    sessionCode: "CS-2026-001",
    mode: "general",
    status: "ready_for_review",
    priority: "emergency",
    startedAt: "2026-09-10T08:00:00.000Z",
    completedAt: "2026-09-10T08:15:00.000Z",
    assignedPhysicianId: "d3b07384-d113-46d8-a6fe-49e3776a3fd5",
  },
  chiefComplaint: {
    confirmed: "Severe retrosternal chest pain radiating to left arm",
    verbatimAudit: "crushing chest pain radiating to arm since 2 hours",
    language: "en",
    source: "patient_reported",
  },
  symptoms: [
    {
      name: "Chest Pain",
      onset: "2 hours ago",
      duration: "constant",
      severity: "9/10",
      location: "retrosternal",
      radiation: "left arm",
      source: "patient_reported",
      provenance: {
        stepNumber: 1,
        questionDomain: "chief_complaint",
        verbatimQuote: "crushing chest pain radiating to arm since 2 hours",
      },
    },
    {
      name: "Diaphoresis",
      onset: "1 hour ago",
      duration: "intermittent",
      severity: "moderate",
      source: "patient_reported",
      provenance: {
        stepNumber: 2,
        questionDomain: "associated_symptoms",
        verbatimQuote: "sweating heavily and feeling dizzy",
      },
    },
  ],
  history: {
    pastMedicalConditions: [
      {
        name: "Hypertension",
        status: "active",
        source: "patient_reported",
        provenance: {
          stepNumber: 3,
          verbatimQuote: "known hypertensive on medications for 4 years",
        },
      },
    ],
    familyHistory: [],
  },
  medications: {
    patientReported: [
      {
        name: "Amlodipine",
        dosage: "5mg",
        frequency: "once daily",
        source: "patient_reported",
        provenance: {
          stepNumber: 3,
          verbatimQuote: "taking amlodipine 5mg once daily",
        },
      },
    ],
    documentExtracted: [
      {
        name: "Aspirin",
        dosage: "75mg",
        frequency: "OD",
        duration: "30 days",
        instructions: "Take with meals",
        sourceDocumentFilename: "prescription_2025.pdf",
        source: "extracted_document",
      },
    ],
  },
  allergies: {
    patientReported: [
      {
        allergen: "Penicillin",
        reaction: "Urticarial skin rash",
        source: "patient_reported",
        provenance: {
          stepNumber: 4,
          verbatimQuote: "allergic to penicillin causes skin hives",
        },
      },
    ],
  },
  documents: [
    {
      documentId: "9c8b7a65-4321-4fec-ba98-76543210fedc",
      filename: "prescription_2025.pdf",
      documentType: "prescription",
      uploadedAt: "2026-09-10T08:05:00.000Z",
      fileSizeBytes: 204800,
      mimeType: "application/pdf",
      relevanceStatus: "verified",
      relevanceAssessment: {
        status: "verified",
        score: 1.0,
        reasons: ["Patient name and DOB matched"],
        matchedFields: ["fullName", "dateOfBirth"],
        mismatchedFields: [],
        extractedPatient: {
          patientName: "Rajesh Kumar",
          dateOfBirth: "1978-06-12",
        },
      },
    },
  ],
  extractedFindings: {
    laboratoryInvestigations: [
      {
        testName: "Troponin-T",
        value: "1.4",
        unit: "ng/mL",
        referenceRange: "< 0.01",
        isAbnormal: true,
        flag: "high",
        sourceDocumentFilename: "lab_report.pdf",
        source: "extracted_document",
      },
      {
        testName: "ECG Impression",
        value: "ST elevation in V1-V4",
        isAbnormal: true,
        flag: "abnormal",
        sourceDocumentFilename: "lab_report.pdf",
        source: "extracted_document",
      },
    ],
    documentedConditions: [
      {
        name: "Coronary Artery Disease",
        status: "suspected",
        notes: "Prior ischemic event noted in record",
        sourceDocumentFilename: "prescription_2025.pdf",
        source: "extracted_document",
      },
    ],
  },
  triage: {
    priority: "emergency",
    criticalRedFlag: true,
    ruleId: "RULE_CARDIAC_CHEST_PAIN",
    reason: "Acute retrosternal chest pain with diaphoresis and radiation",
    detectedSymptoms: ["Chest Pain", "Diaphoresis"],
    evaluatedBy: "deterministic_safety_engine",
  },
  provenance: {
    generatedAt: "2026-09-10T08:16:00.000Z",
    systemVersion: "MediKiosk v1.0",
    sources: {
      patientProvided: "kiosk_q_and_a",
      documentExtracted: "multimodal_ocr",
      triageEvaluation: "deterministic_rules",
      physicianVerification: "pending_review",
    },
    verificationStatus: {
      isVerifiedByPhysician: false,
    },
  },
};

const sparseRecord: CanonicalEncounterRecord = {
  patient: {
    patientIdentifier: "PAT-2026-002",
    fullName: "Anita Devi",
    dateOfBirth: "1992-11-04",
    gender: "female",
    primaryLanguage: "hi",
    isDemo: true,
  },
  encounter: {
    sessionId: "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    sessionCode: "CS-2026-002",
    mode: "general",
    status: "intake_active",
    priority: "normal",
    startedAt: "2026-09-10T09:00:00.000Z",
  },
  chiefComplaint: {
    confirmed: "Mild intermittent headache",
    verbatimAudit: "headache since morning",
    language: "hi",
    source: "patient_reported",
  },
  symptoms: [],
  history: {
    pastMedicalConditions: [],
    familyHistory: [],
  },
  medications: {
    patientReported: [],
    documentExtracted: [],
  },
  allergies: {
    patientReported: [],
  },
  documents: [],
  extractedFindings: {
    laboratoryInvestigations: [],
    documentedConditions: [],
  },
  triage: {
    priority: "normal",
    criticalRedFlag: false,
    detectedSymptoms: [],
    evaluatedBy: "deterministic_safety_engine",
  },
  provenance: {
    generatedAt: "2026-09-10T09:05:00.000Z",
    systemVersion: "MediKiosk v1.0",
    sources: {
      patientProvided: "kiosk_q_and_a",
      documentExtracted: "multimodal_ocr",
      triageEvaluation: "deterministic_rules",
      physicianVerification: "pending_review",
    },
    verificationStatus: {
      isVerifiedByPhysician: false,
    },
  },
};

// ============================================================================
// Test Suite Execution
// ============================================================================

function runTests() {
  console.log("================================================================================");
  console.log("FHIR R4 DETERMINISTIC MAPPER TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) {
        console.error(`       Detail: ${detail}`);
      }
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // Test 1: Complete Clinical Encounter Mapping
  // --------------------------------------------------------------------------
  try {
    const bundle = mapCanonicalToFhirBundle(completeRecord);
    const types = bundle.entry.map((e) => e.resource.resourceType);

    const hasPatient = types.includes("Patient");
    const hasEncounter = types.includes("Encounter");
    const hasRisk = types.includes("RiskAssessment");
    const hasObservation = types.includes("Observation");
    const hasCondition = types.includes("Condition");
    const hasMedication = types.includes("MedicationStatement");
    const hasAllergy = types.includes("AllergyIntolerance");
    const hasDoc = types.includes("DocumentReference");

    const structureValid =
      bundle.resourceType === "Bundle" &&
      bundle.type === "collection" &&
      bundle.total === bundle.entry.length &&
      bundle.entry.length > 0;

    assert(
      structureValid &&
        hasPatient &&
        hasEncounter &&
        hasRisk &&
        hasObservation &&
        hasCondition &&
        hasMedication &&
        hasAllergy &&
        hasDoc,
      "Complete clinical encounter mapping",
      `Resource count: ${bundle.total}, Resource types: ${Array.from(new Set(types)).join(", ")}`
    );
  } catch (err) {
    assert(false, "Complete clinical encounter mapping", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 2: Internal Reference Integrity (Zero Dangling References)
  // --------------------------------------------------------------------------
  try {
    const bundle = mapCanonicalToFhirBundle(completeRecord);
    const validFullUrls = new Set(bundle.entry.map((e) => e.fullUrl));
    const danglingRefs: string[] = [];

    for (const entry of bundle.entry) {
      const res = entry.resource;

      // Encounter
      if (res.resourceType === "Encounter") {
        const enc = res as FhirEncounter;
        if (enc.subject?.reference && !validFullUrls.has(enc.subject.reference)) {
          danglingRefs.push(`Encounter.subject: ${enc.subject.reference}`);
        }
      }

      // Observation
      if (res.resourceType === "Observation") {
        const obs = res as FhirObservation;
        if (obs.subject?.reference && !validFullUrls.has(obs.subject.reference)) {
          danglingRefs.push(`Observation.subject: ${obs.subject.reference}`);
        }
        if (obs.encounter?.reference && !validFullUrls.has(obs.encounter.reference)) {
          danglingRefs.push(`Observation.encounter: ${obs.encounter.reference}`);
        }
      }

      // Condition
      if (res.resourceType === "Condition") {
        const cond = res as FhirCondition;
        if (cond.subject?.reference && !validFullUrls.has(cond.subject.reference)) {
          danglingRefs.push(`Condition.subject: ${cond.subject.reference}`);
        }
        if (cond.encounter?.reference && !validFullUrls.has(cond.encounter.reference)) {
          danglingRefs.push(`Condition.encounter: ${cond.encounter.reference}`);
        }
      }

      // MedicationStatement
      if (res.resourceType === "MedicationStatement") {
        const med = res as FhirMedicationStatement;
        if (med.subject?.reference && !validFullUrls.has(med.subject.reference)) {
          danglingRefs.push(`MedicationStatement.subject: ${med.subject.reference}`);
        }
        if (med.context?.reference && !validFullUrls.has(med.context.reference)) {
          danglingRefs.push(`MedicationStatement.context: ${med.context.reference}`);
        }
      }

      // AllergyIntolerance
      if (res.resourceType === "AllergyIntolerance") {
        const allergy = res as FhirAllergyIntolerance;
        if (allergy.patient?.reference && !validFullUrls.has(allergy.patient.reference)) {
          danglingRefs.push(`AllergyIntolerance.patient: ${allergy.patient.reference}`);
        }
        if (allergy.encounter?.reference && !validFullUrls.has(allergy.encounter.reference)) {
          danglingRefs.push(`AllergyIntolerance.encounter: ${allergy.encounter.reference}`);
        }
      }

      // DocumentReference
      if (res.resourceType === "DocumentReference") {
        const doc = res as FhirDocumentReference;
        if (doc.subject?.reference && !validFullUrls.has(doc.subject.reference)) {
          danglingRefs.push(`DocumentReference.subject: ${doc.subject.reference}`);
        }
      }

      // RiskAssessment
      if (res.resourceType === "RiskAssessment") {
        const risk = res as FhirRiskAssessment;
        if (risk.subject?.reference && !validFullUrls.has(risk.subject.reference)) {
          danglingRefs.push(`RiskAssessment.subject: ${risk.subject.reference}`);
        }
        if (risk.encounter?.reference && !validFullUrls.has(risk.encounter.reference)) {
          danglingRefs.push(`RiskAssessment.encounter: ${risk.encounter.reference}`);
        }
        for (const basisRef of risk.basis || []) {
          if (basisRef.reference && !validFullUrls.has(basisRef.reference)) {
            danglingRefs.push(`RiskAssessment.basis: ${basisRef.reference}`);
          }
        }
      }
    }

    assert(
      danglingRefs.length === 0,
      "Internal reference integrity",
      danglingRefs.length > 0 ? `Dangling references found: ${danglingRefs.join("; ")}` : undefined
    );
  } catch (err) {
    assert(false, "Internal reference integrity", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 3: No Dummy Resources Emitted
  // --------------------------------------------------------------------------
  try {
    const sparseBundle = mapCanonicalToFhirBundle(sparseRecord);
    const types = sparseBundle.entry.map((e) => e.resource.resourceType);

    const unexpectedTypes = types.filter(
      (t) =>
        t === "Observation" ||
        t === "Condition" ||
        t === "MedicationStatement" ||
        t === "AllergyIntolerance" ||
        t === "DocumentReference"
    );

    const hasExpectedOnly =
      types.length === 3 &&
      types.includes("Patient") &&
      types.includes("Encounter") &&
      types.includes("RiskAssessment") &&
      unexpectedTypes.length === 0;

    assert(
      hasExpectedOnly,
      "No dummy resources emitted",
      `Expected [Patient, Encounter, RiskAssessment], received: [${types.join(", ")}]`
    );
  } catch (err) {
    assert(false, "No dummy resources emitted", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 4: Non-Numeric Laboratory Values
  // --------------------------------------------------------------------------
  try {
    const bundle = mapCanonicalToFhirBundle(completeRecord);
    const ecgObs = bundle.entry
      .map((e) => e.resource)
      .find(
        (r): r is FhirObservation =>
          r.resourceType === "Observation" && r.code.text === "ECG Impression"
      );

    const isNonNumericSafe =
      Boolean(ecgObs) &&
      ecgObs?.valueString === "ST elevation in V1-V4" &&
      ecgObs?.valueQuantity === undefined;

    assert(
      isNonNumericSafe,
      "Non-numeric laboratory values",
      `ECG Observation valueString: "${ecgObs?.valueString}", valueQuantity: ${JSON.stringify(
        ecgObs?.valueQuantity
      )}`
    );
  } catch (err) {
    assert(false, "Non-numeric laboratory values", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 5: Numeric Laboratory Values
  // --------------------------------------------------------------------------
  try {
    const bundle = mapCanonicalToFhirBundle(completeRecord);
    const tropObs = bundle.entry
      .map((e) => e.resource)
      .find(
        (r): r is FhirObservation =>
          r.resourceType === "Observation" && r.code.text === "Troponin-T"
      );

    const isNumericValid =
      Boolean(tropObs) &&
      tropObs?.valueQuantity?.value === 1.4 &&
      typeof tropObs?.valueQuantity?.value === "number" &&
      tropObs?.valueQuantity?.unit === "ng/mL" &&
      tropObs?.valueQuantity?.system === undefined &&
      tropObs?.valueQuantity?.code === undefined &&
      (tropObs?.code.coding === undefined || tropObs?.code.coding.length === 0);

    assert(
      isNumericValid,
      "Numeric laboratory values",
      `value: ${tropObs?.valueQuantity?.value} (${typeof tropObs?.valueQuantity?.value}), unit: "${
        tropObs?.valueQuantity?.unit
      }"`
    );
  } catch (err) {
    assert(false, "Numeric laboratory values", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 6: Zero Fabricated Terminology
  // --------------------------------------------------------------------------
  try {
    const bundle = mapCanonicalToFhirBundle(completeRecord);
    const fabricatedCodes: string[] = [];

    for (const entry of bundle.entry) {
      const res = entry.resource;

      // Condition: verify no fabricated SNOMED or ICD coding
      if (res.resourceType === "Condition") {
        const cond = res as FhirCondition;
        for (const coding of cond.code?.coding || []) {
          if (
            coding.system?.includes("snomed") ||
            coding.system?.includes("icd") ||
            coding.code !== undefined
          ) {
            fabricatedCodes.push(`Condition code coding: ${coding.system}:${coding.code}`);
          }
        }
      }

      // Observation: verify no fabricated LOINC or SNOMED coding
      if (res.resourceType === "Observation") {
        const obs = res as FhirObservation;
        for (const coding of obs.code?.coding || []) {
          if (
            coding.system?.includes("loinc") ||
            coding.system?.includes("snomed") ||
            coding.code !== undefined
          ) {
            fabricatedCodes.push(`Observation code coding: ${coding.system}:${coding.code}`);
          }
        }
      }

      // MedicationStatement: verify no fabricated RxNorm
      if (res.resourceType === "MedicationStatement") {
        const med = res as FhirMedicationStatement;
        for (const coding of med.medicationCodeableConcept?.coding || []) {
          if (coding.system?.includes("rxnorm") || coding.code !== undefined) {
            fabricatedCodes.push(`Medication coding: ${coding.system}:${coding.code}`);
          }
        }
      }

      // AllergyIntolerance: verify no fabricated allergen codes
      if (res.resourceType === "AllergyIntolerance") {
        const allergy = res as FhirAllergyIntolerance;
        for (const coding of allergy.code?.coding || []) {
          if (coding.code !== undefined) {
            fabricatedCodes.push(`Allergy coding: ${coding.system}:${coding.code}`);
          }
        }
      }
    }

    assert(
      fabricatedCodes.length === 0,
      "No fabricated terminology",
      fabricatedCodes.length > 0 ? `Fabricated codes found: ${fabricatedCodes.join("; ")}` : undefined
    );
  } catch (err) {
    assert(false, "No fabricated terminology", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 7: Provenance Preservation
  // --------------------------------------------------------------------------
  try {
    const bundle = mapCanonicalToFhirBundle(completeRecord);

    // Check symptom step & verbatim quote
    const chestPainObs = bundle.entry
      .map((e) => e.resource)
      .find(
        (r): r is FhirObservation =>
          r.resourceType === "Observation" && r.code.text === "Chest Pain"
      );
    const symptomProvPreserved = Boolean(
      chestPainObs?.note?.[0]?.text?.includes("Step 1") &&
        chestPainObs?.note?.[0]?.text?.includes("crushing chest pain radiating to arm")
    );

    // Check document medication provenance
    const aspirinMed = bundle.entry
      .map((e) => e.resource)
      .find(
        (r): r is FhirMedicationStatement =>
          r.resourceType === "MedicationStatement" &&
          r.medicationCodeableConcept.text === "Aspirin"
      );
    const docMedProvPreserved = Boolean(
      aspirinMed?.note?.[0]?.text?.includes("prescription_2025.pdf")
    );

    // Check triage deterministic rule & reason
    const risk = bundle.entry
      .map((e) => e.resource)
      .find((r): r is FhirRiskAssessment => r.resourceType === "RiskAssessment");
    const triageProvPreserved = Boolean(
      risk?.method?.text === "RULE_CARDIAC_CHEST_PAIN" &&
        risk?.prediction?.[0]?.rationale?.includes("Acute retrosternal chest pain")
    );

    assert(
      symptomProvPreserved && docMedProvPreserved && triageProvPreserved,
      "Provenance preservation",
      `Symptom provenance: ${symptomProvPreserved}, Doc med provenance: ${docMedProvPreserved}, Triage provenance: ${triageProvPreserved}`
    );
  } catch (err) {
    assert(false, "Provenance preservation", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 8: Allergy Semantics
  // --------------------------------------------------------------------------
  try {
    // 8A. Unverified record: AllergyIntolerance uses patient attribute & unconfirmed status
    const unverifiedBundle = mapCanonicalToFhirBundle(completeRecord);
    const unverifiedAllergy = unverifiedBundle.entry
      .map((e) => e.resource)
      .find((r): r is FhirAllergyIntolerance => r.resourceType === "AllergyIntolerance");

    const usesPatientField =
      Boolean(unverifiedAllergy?.patient?.reference) &&
      (unverifiedAllergy as unknown as Record<string, unknown>).subject === undefined;

    const unconfirmedStatus =
      unverifiedAllergy?.verificationStatus?.coding?.[0]?.code === "unconfirmed";

    // 8B. Physician-verified record: VerificationStatus promoted to confirmed
    const verifiedRecord: CanonicalEncounterRecord = {
      ...completeRecord,
      provenance: {
        ...completeRecord.provenance,
        verificationStatus: {
          isVerifiedByPhysician: true,
          verifiedAt: "2026-09-10T08:30:00.000Z",
          verifiedBy: "doc-123",
        },
      },
    };
    const verifiedBundle = mapCanonicalToFhirBundle(verifiedRecord);
    const verifiedAllergy = verifiedBundle.entry
      .map((e) => e.resource)
      .find((r): r is FhirAllergyIntolerance => r.resourceType === "AllergyIntolerance");

    const confirmedStatus =
      verifiedAllergy?.verificationStatus?.coding?.[0]?.code === "confirmed";

    assert(
      usesPatientField && unconfirmedStatus && confirmedStatus,
      "Allergy semantics",
      `Uses patient field: ${usesPatientField}, Unverified status: ${unverifiedAllergy?.verificationStatus?.coding?.[0]?.code}, Verified status: ${verifiedAllergy?.verificationStatus?.coding?.[0]?.code}`
    );
  } catch (err) {
    assert(false, "Allergy semantics", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 9: Medication Semantics
  // --------------------------------------------------------------------------
  try {
    const bundle = mapCanonicalToFhirBundle(completeRecord);
    const types = bundle.entry.map((e) => e.resource.resourceType);

    const hasMedicationStatement = types.includes("MedicationStatement");
    const hasNoMedicationRequest = !types.includes("MedicationRequest" as unknown as typeof types[number]);

    const medStatements = bundle.entry
      .map((e) => e.resource)
      .filter((r): r is FhirMedicationStatement => r.resourceType === "MedicationStatement");

    const validMedicationStatements =
      medStatements.length === 2 &&
      medStatements.every(
        (m) =>
          m.status === "active" &&
          Boolean(m.medicationCodeableConcept.text) &&
          Boolean(m.subject?.reference) &&
          Boolean(m.context?.reference)
      );

    assert(
      hasMedicationStatement && hasNoMedicationRequest && validMedicationStatements,
      "Medication semantics",
      `MedicationStatement count: ${medStatements.length}, MedicationRequest present: ${!hasNoMedicationRequest}`
    );
  } catch (err) {
    assert(false, "Medication semantics", String(err));
  }

  // --------------------------------------------------------------------------
  // Test 10: Determinism
  // --------------------------------------------------------------------------
  try {
    const run1 = mapCanonicalToFhirBundle(completeRecord);
    const run2 = mapCanonicalToFhirBundle(completeRecord);

    const json1 = JSON.stringify(run1);
    const json2 = JSON.stringify(run2);

    const isIdentical = json1 === json2;

    assert(
      isIdentical,
      "Determinism",
      isIdentical
        ? `Byte-identical JSON serialization (${json1.length} characters)`
        : "Output differed between runs!"
    );
  } catch (err) {
    assert(false, "Determinism", String(err));
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("--------------------------------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
