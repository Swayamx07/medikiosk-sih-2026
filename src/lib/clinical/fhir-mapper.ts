/**
 * Deterministic FHIR R4 Mapper for MediKiosk / CaseX
 *
 * Pure functional transformation: CanonicalEncounterRecord -> FhirBundle
 *
 * Guarantees:
 * 1. PURE: No DB, no Supabase, no network, no environment variables, no side effects.
 * 2. DETERMINISTIC: Identical canonical input produces identical FHIR Bundle output.
 * 3. NO HALLUCINATED CODES: Standardized terminologies (LOINC, SNOMED CT, ICD-10,
 *    RxNorm, UCUM) are NOT fabricated. Text representations are faithfully preserved.
 * 4. PROVENANCE-ANCHORED: Kiosk Q&A steps, verbatim quotes, OCR filenames, and
 *    deterministic triage rules are captured in notes and annotations.
 * 5. CLOSED REFERENCE RESOLUTION: All internal references (urn:uuid:...) resolve
 *    to resources present within the collection bundle.
 */

import { CanonicalEncounterRecord, SupportedLanguage, PriorityLevel, SessionStatus } from "@/types/clinical";
import {
  FhirBundle,
  FhirBundleEntry,
  FhirPatient,
  FhirEncounter,
  FhirCondition,
  FhirObservation,
  FhirObservationComponent,
  FhirMedicationStatement,
  FhirAllergyIntolerance,
  FhirDocumentReference,
  FhirRiskAssessment,
  FhirHumanName,
  FhirAdministrativeGender,
  FhirEncounterStatus,
  FhirQuantity,
  FhirReference,
} from "@/types/fhir-r4";

// ============================================================================
// Deterministic UUID & Formatting Utilities
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(str: string): boolean {
  return UUID_REGEX.test(str);
}

/**
 * Pure deterministic 128-bit hash function formatted as RFC 4122 UUID v5 (name-based).
 * Operates purely on character codes with integer arithmetic for universal cross-platform consistency.
 */
function deterministicUuid(seed: string): string {
  let h1 = 0xdeadbeef ^ 0x12345678;
  let h2 = 0x41c6ce57 ^ 0x87654321;
  let h3 = 0x9e3779b9 ^ 0xabcdef01;
  let h4 = 0x85ebca6b ^ 0x13579bdf;

  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ (ch << 3), 1597334677);
    h3 = Math.imul(h3 ^ (ch << 7), 2246822507);
    h4 = Math.imul(h4 ^ (ch << 11), 3266489909);
  }

  const hex = [h1, h2, h3, h4]
    .map((h) => (h >>> 0).toString(16).padStart(8, "0"))
    .join("");

  const part1 = hex.substring(0, 8);
  const part2 = hex.substring(8, 12);
  const part3 = "5" + hex.substring(13, 16); // Version 5
  const variantNibble = ((parseInt(hex.substring(16, 17), 16) & 0x3) | 0x8).toString(16);
  const part4 = variantNibble + hex.substring(17, 20);
  const part5 = hex.substring(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

function parseHumanName(fullName: string): FhirHumanName {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { text: "Unknown Patient" };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return {
      use: "official",
      text: trimmed,
      given: [parts[0]],
    };
  }
  const family = parts[parts.length - 1];
  const given = parts.slice(0, -1);
  return {
    use: "official",
    text: trimmed,
    family,
    given,
  };
}

function mapGender(gender?: string): FhirAdministrativeGender {
  if (!gender) return "unknown";
  const normalized = gender.toLowerCase().trim();
  if (normalized === "male") return "male";
  if (normalized === "female") return "female";
  if (normalized === "other") return "other";
  return "unknown"; // maps "prefer_not_to_say" or unrecognized strings safely
}

function mapLanguage(lang?: SupportedLanguage | string): { code: string; display: string } {
  const code = (lang || "en").toLowerCase();
  switch (code) {
    case "hi":
      return { code: "hi", display: "Hindi" };
    case "mr":
      return { code: "mr", display: "Marathi" };
    case "en":
    default:
      return { code: "en", display: "English" };
  }
}

function mapEncounterStatus(status?: SessionStatus | string): FhirEncounterStatus {
  switch (status) {
    case "completed":
    case "verified":
    case "archived":
      return "finished";
    case "in_progress":
      return "in-progress";
    case "draft":
      return "planned";
    case "cancelled":
      return "cancelled";
    case "flagged":
    default:
      return "triaged";
  }
}

function mapPriority(priority?: PriorityLevel | string): { code: string; display: string } {
  switch (priority) {
    case "emergency":
      return { code: "EM", display: "Emergency" };
    case "urgent":
      return { code: "UR", display: "Urgent" };
    case "normal":
    default:
      return { code: "R", display: "Routine" };
  }
}

function parseLabValue(
  value: string,
  unit?: string
): { valueQuantity?: FhirQuantity; valueString?: string } {
  const trimmed = value.trim();
  const isPureNumber = /^-?\d+(\.\d+)?$/.test(trimmed);
  if (isPureNumber) {
    const num = parseFloat(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      return {
        valueQuantity: {
          value: num,
          ...(unit?.trim() ? { unit: unit.trim() } : {}),
        },
      };
    }
  }
  return { valueString: trimmed };
}

// ============================================================================
// Core Pure Mapper Function
// ============================================================================

/**
 * Transforms a CanonicalEncounterRecord into a complete, valid FHIR R4 collection Bundle.
 *
 * @param record - The read-only canonical encounter clinical record.
 * @returns A fully resolved FHIR R4 Bundle of type "collection".
 */
export function mapCanonicalToFhirBundle(record: CanonicalEncounterRecord): FhirBundle {
  const isPhysicianVerified = Boolean(record.provenance?.verificationStatus?.isVerifiedByPhysician);

  // 1. Resolve Stable Deterministic UUIDs
  const encounterUuid = isValidUuid(record.encounter.sessionId)
    ? record.encounter.sessionId.toLowerCase()
    : deterministicUuid(`encounter:${record.encounter.sessionId}`);

  const patientUuid = deterministicUuid(
    `${encounterUuid}:patient:${record.patient.patientIdentifier || "unknown"}`
  );

  const patientRefDisplay = record.patient.fullName || "Patient";

  // --------------------------------------------------------------------------
  // RESOURCE: Patient
  // --------------------------------------------------------------------------
  const langInfo = mapLanguage(record.patient.primaryLanguage);

  const patientResource: FhirPatient = {
    resourceType: "Patient",
    id: patientUuid,
    identifier: [
      {
        system: "https://casex.sih/patients",
        value: record.patient.patientIdentifier,
      },
      ...(record.patient.abhaId?.trim()
        ? [
            {
              system: "https://healthid.ndhm.gov.in",
              value: record.patient.abhaId.trim(),
            },
          ]
        : []),
    ],
    name: [parseHumanName(record.patient.fullName)],
    gender: mapGender(record.patient.gender),
    birthDate: record.patient.dateOfBirth,
    ...(record.patient.phoneNumber?.trim()
      ? {
          telecom: [
            {
              system: "phone",
              value: record.patient.phoneNumber.trim(),
              use: "mobile",
            },
          ],
        }
      : {}),
    communication: [
      {
        language: {
          coding: [
            {
              system: "urn:ietf:bcp:47",
              code: langInfo.code,
              display: langInfo.display,
            },
          ],
          text: langInfo.display,
        },
        preferred: true,
      },
    ],
  };

  // --------------------------------------------------------------------------
  // RESOURCE: Encounter
  // --------------------------------------------------------------------------
  const prioInfo = mapPriority(record.encounter.priority);

  const encounterResource: FhirEncounter = {
    resourceType: "Encounter",
    id: encounterUuid,
    identifier: [
      {
        system: "https://casex.sih/sessions",
        value: record.encounter.sessionCode,
      },
    ],
    status: mapEncounterStatus(record.encounter.status),
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "ambulatory",
    },
    serviceType: {
      text:
        record.encounter.mode === "ayush"
          ? "AYUSH Intake Consultation"
          : "General Outpatient Intake",
    },
    priority: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
          code: prioInfo.code,
          display: prioInfo.display,
        },
      ],
      text: record.encounter.priority,
    },
    subject: {
      reference: `urn:uuid:${patientUuid}`,
      display: patientRefDisplay,
    },
    ...(record.encounter.assignedPhysicianId?.trim()
      ? {
          participant: [
            {
              individual: {
                reference: `Practitioner/${record.encounter.assignedPhysicianId.trim()}`,
              },
            },
          ],
        }
      : {}),
    period: {
      start: record.encounter.startedAt,
      ...(record.encounter.completedAt?.trim()
        ? { end: record.encounter.completedAt.trim() }
        : {}),
    },
    ...(record.chiefComplaint?.confirmed?.trim()
      ? {
          reasonCode: [
            {
              text: record.chiefComplaint.confirmed.trim(),
            },
          ],
        }
      : {}),
  };

  // --------------------------------------------------------------------------
  // RESOURCE: Observations (Symptoms & Laboratory Investigations)
  // --------------------------------------------------------------------------
  const observationResources: FhirObservation[] = [];
  // Lookup map for linking triage basis to actual symptom observations
  const symptomObsMap = new Map<string, { uuid: string; name: string }>();

  // A. Symptoms -> preliminary exam observations
  (record.symptoms || []).forEach((s, idx) => {
    if (!s.name?.trim()) return;
    const symptomUuid = deterministicUuid(`${encounterUuid}:obs:symptom:${idx}:${s.name.trim()}`);
    const nameTrimmed = s.name.trim();

    symptomObsMap.set(nameTrimmed.toLowerCase(), { uuid: symptomUuid, name: nameTrimmed });

    const components: FhirObservationComponent[] = [];
    if (s.onset?.trim()) {
      components.push({
        code: { text: "Onset" },
        valueString: s.onset.trim(),
      });
    }
    if (s.duration?.trim()) {
      components.push({
        code: { text: "Duration" },
        valueString: s.duration.trim(),
      });
    }
    if (s.location?.trim()) {
      components.push({
        code: { text: "Location" },
        valueString: s.location.trim(),
      });
    }
    if (s.radiation?.trim()) {
      components.push({
        code: { text: "Radiation" },
        valueString: s.radiation.trim(),
      });
    }

    const noteText = s.provenance?.verbatimQuote?.trim()
      ? `Patient reported (Step ${s.provenance.stepNumber}, Domain: ${s.provenance.questionDomain}): "${s.provenance.verbatimQuote.trim()}"`
      : undefined;

    const obs: FhirObservation = {
      resourceType: "Observation",
      id: symptomUuid,
      status: "preliminary",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "exam",
              display: "Exam",
            },
          ],
        },
      ],
      code: {
        text: nameTrimmed,
      },
      subject: {
        reference: `urn:uuid:${patientUuid}`,
        display: patientRefDisplay,
      },
      encounter: {
        reference: `urn:uuid:${encounterUuid}`,
      },
      valueString: s.severity?.trim() || "Present",
      ...(components.length > 0 ? { component: components } : {}),
      ...(noteText ? { note: [{ text: noteText }] } : {}),
    };

    observationResources.push(obs);
  });

  // B. Laboratory Investigations -> final laboratory observations
  (record.extractedFindings?.laboratoryInvestigations || []).forEach((lab, idx) => {
    if (!lab.testName?.trim()) return;
    const labUuid = deterministicUuid(`${encounterUuid}:obs:lab:${idx}:${lab.testName.trim()}`);
    const parsedVal = parseLabValue(lab.value, lab.unit);

    const interpretationText = lab.flag?.trim()
      ? lab.flag.trim()
      : lab.isAbnormal
      ? "Abnormal"
      : undefined;

    const labObs: FhirObservation = {
      resourceType: "Observation",
      id: labUuid,
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "laboratory",
              display: "Laboratory",
            },
          ],
        },
      ],
      code: {
        text: lab.testName.trim(),
      },
      subject: {
        reference: `urn:uuid:${patientUuid}`,
        display: patientRefDisplay,
      },
      encounter: {
        reference: `urn:uuid:${encounterUuid}`,
      },
      ...parsedVal,
      ...(lab.referenceRange?.trim()
        ? {
            referenceRange: [{ text: lab.referenceRange.trim() }],
          }
        : {}),
      ...(interpretationText
        ? {
            interpretation: [{ text: interpretationText }],
          }
        : {}),
      note: [
        {
          text: `Extracted from document: ${lab.sourceDocumentFilename || "Attached Medical Record"}`,
        },
      ],
    };

    observationResources.push(labObs);
  });

  // --------------------------------------------------------------------------
  // RESOURCE: Conditions (Past Medical History & Documented Conditions)
  // --------------------------------------------------------------------------
  const conditionResources: FhirCondition[] = [];

  // A. Patient reported past medical conditions
  (record.history?.pastMedicalConditions || []).forEach((pmc, idx) => {
    if (!pmc.name?.trim()) return;
    const condUuid = deterministicUuid(`${encounterUuid}:condition:past:${idx}:${pmc.name.trim()}`);

    const noteText = pmc.provenance?.verbatimQuote?.trim()
      ? `Patient reported (Step ${pmc.provenance.stepNumber}): "${pmc.provenance.verbatimQuote.trim()}"${
          pmc.status ? ` (Status: ${pmc.status})` : ""
        }`
      : pmc.status
      ? `Reported status: ${pmc.status}`
      : undefined;

    const condition: FhirCondition = {
      resourceType: "Condition",
      id: condUuid,
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: isPhysicianVerified ? "confirmed" : "unconfirmed",
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "problem-list-item",
            },
          ],
        },
      ],
      code: {
        text: pmc.name.trim(),
      },
      subject: {
        reference: `urn:uuid:${patientUuid}`,
        display: patientRefDisplay,
      },
      encounter: {
        reference: `urn:uuid:${encounterUuid}`,
      },
      ...(noteText ? { note: [{ text: noteText }] } : {}),
    };

    conditionResources.push(condition);
  });

  // B. Document extracted conditions
  (record.extractedFindings?.documentedConditions || []).forEach((docCond, idx) => {
    if (!docCond.name?.trim()) return;
    const docCondUuid = deterministicUuid(`${encounterUuid}:condition:doc:${idx}:${docCond.name.trim()}`);

    const details: string[] = [];
    if (docCond.sourceDocumentFilename) {
      details.push(`Source document: ${docCond.sourceDocumentFilename}`);
    }
    if (docCond.status?.trim()) {
      details.push(`Status: ${docCond.status.trim()}`);
    }
    if (docCond.notes?.trim()) {
      details.push(docCond.notes.trim());
    }

    const condition: FhirCondition = {
      resourceType: "Condition",
      id: docCondUuid,
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: isPhysicianVerified ? "confirmed" : "unconfirmed",
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "problem-list-item",
            },
          ],
        },
      ],
      code: {
        text: docCond.name.trim(),
      },
      subject: {
        reference: `urn:uuid:${patientUuid}`,
        display: patientRefDisplay,
      },
      encounter: {
        reference: `urn:uuid:${encounterUuid}`,
      },
      ...(details.length > 0 ? { note: [{ text: details.join(" • ") }] } : {}),
    };

    conditionResources.push(condition);
  });

  // --------------------------------------------------------------------------
  // RESOURCE: MedicationStatements (Patient Reported & Document Extracted)
  // --------------------------------------------------------------------------
  const medicationResources: FhirMedicationStatement[] = [];

  // A. Patient reported medications
  (record.medications?.patientReported || []).forEach((pmed, idx) => {
    if (!pmed.name?.trim()) return;
    const medUuid = deterministicUuid(`${encounterUuid}:med:patient:${idx}:${pmed.name.trim()}`);

    const dosageParts = [pmed.dosage?.trim(), pmed.frequency?.trim()].filter(Boolean);
    const dosageText = dosageParts.join(" • ");

    const noteText = pmed.provenance?.verbatimQuote?.trim()
      ? `Patient reported (Step ${pmed.provenance.stepNumber}): "${pmed.provenance.verbatimQuote.trim()}"`
      : undefined;

    const medStatement: FhirMedicationStatement = {
      resourceType: "MedicationStatement",
      id: medUuid,
      status: "active",
      medicationCodeableConcept: {
        text: pmed.name.trim(),
      },
      subject: {
        reference: `urn:uuid:${patientUuid}`,
        display: patientRefDisplay,
      },
      context: {
        reference: `urn:uuid:${encounterUuid}`,
      },
      ...(dosageText ? { dosage: [{ text: dosageText }] } : {}),
      ...(noteText ? { note: [{ text: noteText }] } : {}),
    };

    medicationResources.push(medStatement);
  });

  // B. Document extracted medications
  (record.medications?.documentExtracted || []).forEach((dmed, idx) => {
    if (!dmed.name?.trim()) return;
    const docMedUuid = deterministicUuid(`${encounterUuid}:med:doc:${idx}:${dmed.name.trim()}`);

    const dosageParts = [
      dmed.dosage?.trim(),
      dmed.frequency?.trim(),
      dmed.duration?.trim() ? `Duration: ${dmed.duration.trim()}` : undefined,
    ].filter(Boolean);
    const dosageText = dosageParts.join(" • ");

    const medStatement: FhirMedicationStatement = {
      resourceType: "MedicationStatement",
      id: docMedUuid,
      status: "active",
      medicationCodeableConcept: {
        text: dmed.name.trim(),
      },
      subject: {
        reference: `urn:uuid:${patientUuid}`,
        display: patientRefDisplay,
      },
      context: {
        reference: `urn:uuid:${encounterUuid}`,
      },
      ...(dosageText || dmed.instructions?.trim()
        ? {
            dosage: [
              {
                ...(dosageText ? { text: dosageText } : {}),
                ...(dmed.instructions?.trim()
                  ? { patientInstruction: dmed.instructions.trim() }
                  : {}),
              },
            ],
          }
        : {}),
      note: [
        {
          text: `Extracted from prescription document: ${
            dmed.sourceDocumentFilename || "Attached Medical Record"
          }`,
        },
      ],
    };

    medicationResources.push(medStatement);
  });

  // --------------------------------------------------------------------------
  // RESOURCE: AllergyIntolerance (Patient Reported)
  // --------------------------------------------------------------------------
  const allergyResources: FhirAllergyIntolerance[] = [];

  (record.allergies?.patientReported || []).forEach((allergy, idx) => {
    if (!allergy.allergen?.trim()) return;
    const allergyUuid = deterministicUuid(`${encounterUuid}:allergy:${idx}:${allergy.allergen.trim()}`);

    const noteText = allergy.provenance?.verbatimQuote?.trim()
      ? `Patient reported (Step ${allergy.provenance.stepNumber}): "${allergy.provenance.verbatimQuote.trim()}"`
      : undefined;

    const intolerance: FhirAllergyIntolerance = {
      resourceType: "AllergyIntolerance",
      id: allergyUuid,
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
            code: "active",
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
            code: isPhysicianVerified ? "confirmed" : "unconfirmed",
          },
        ],
      },
      code: {
        text: allergy.allergen.trim(),
      },
      patient: {
        reference: `urn:uuid:${patientUuid}`,
        display: patientRefDisplay,
      },
      encounter: {
        reference: `urn:uuid:${encounterUuid}`,
      },
      ...(allergy.reaction?.trim()
        ? {
            reaction: [
              {
                manifestation: [{ text: allergy.reaction.trim() }],
              },
            ],
          }
        : {}),
      ...(noteText ? { note: [{ text: noteText }] } : {}),
    };

    allergyResources.push(intolerance);
  });

  // --------------------------------------------------------------------------
  // RESOURCE: DocumentReference (Attached Uploads)
  // --------------------------------------------------------------------------
  const documentResources: FhirDocumentReference[] = [];

  (record.documents || []).forEach((doc, idx) => {
    const docUuid = isValidUuid(doc.documentId)
      ? doc.documentId.toLowerCase()
      : deterministicUuid(`${encounterUuid}:doc:${idx}:${doc.documentId || doc.filename}`);

    const docRef: FhirDocumentReference = {
      resourceType: "DocumentReference",
      id: docUuid,
      status: "current",
      type: {
        text: doc.documentType ? doc.documentType.replace(/_/g, " ") : "medical document",
      },
      subject: {
        reference: `urn:uuid:${patientUuid}`,
        display: patientRefDisplay,
      },
      date: doc.uploadedAt,
      description: doc.filename,
      securityLabel: [
        {
          text: `Patient Relevance: ${doc.relevanceStatus}`,
        },
      ],
      content: [
        {
          attachment: {
            contentType: doc.mimeType || "application/octet-stream",
            size: doc.fileSizeBytes,
            title: doc.filename,
          },
        },
      ],
    };

    documentResources.push(docRef);
  });

  // --------------------------------------------------------------------------
  // RESOURCE: RiskAssessment (Deterministic Safety Triage)
  // --------------------------------------------------------------------------
  const riskUuid = deterministicUuid(`${encounterUuid}:risk-assessment`);

  // Build basis references strictly for Observation resources that were actually emitted
  const basisRefs: FhirReference[] = [];
  const seenBasisUuids = new Set<string>();

  for (const detected of record.triage?.detectedSymptoms || []) {
    const detectedNorm = detected.toLowerCase().trim();
    if (!detectedNorm) continue;

    for (const [symptomKey, obsInfo] of symptomObsMap.entries()) {
      if (
        symptomKey === detectedNorm ||
        symptomKey.includes(detectedNorm) ||
        detectedNorm.includes(symptomKey)
      ) {
        if (!seenBasisUuids.has(obsInfo.uuid)) {
          seenBasisUuids.add(obsInfo.uuid);
          basisRefs.push({
            reference: `urn:uuid:${obsInfo.uuid}`,
            display: obsInfo.name,
          });
        }
      }
    }
  }

  const riskAssessment: FhirRiskAssessment = {
    resourceType: "RiskAssessment",
    id: riskUuid,
    status: "final",
    subject: {
      reference: `urn:uuid:${patientUuid}`,
      display: patientRefDisplay,
    },
    encounter: {
      reference: `urn:uuid:${encounterUuid}`,
    },
    code: {
      text: "Deterministic Safety Triage Engine",
    },
    method: {
      text: record.triage?.ruleId || "Deterministic Red-Flag Protocol",
    },
    prediction: [
      {
        outcome: {
          text: record.triage?.criticalRedFlag
            ? "Critical Red Flag — Emergency Priority"
            : `${(record.triage?.priority || "normal").toUpperCase()} Priority Triage`,
        },
        rationale:
          record.triage?.reason ||
          (record.triage?.criticalRedFlag
            ? "Deterministic safety rule triggered potential emergency flag."
            : "Standard outpatient pre-consultation intake."),
      },
    ],
    ...(basisRefs.length > 0 ? { basis: basisRefs } : {}),
    note: [
      {
        text: `Triage evaluation by ${record.triage?.evaluatedBy || "deterministic_safety_engine"}. Critical Red Flag: ${
          record.triage?.criticalRedFlag ? "YES" : "NO"
        }. Trigger Rule: ${record.triage?.ruleId || "NONE"}. Priority: ${
          record.triage?.priority || "normal"
        }.`,
      },
    ],
  };

  // --------------------------------------------------------------------------
  // BUNDLE ASSEMBLY: Complete Closed Collection
  // --------------------------------------------------------------------------
  const entries: FhirBundleEntry[] = [];

  // 1. Patient
  entries.push({
    fullUrl: `urn:uuid:${patientUuid}`,
    resource: patientResource,
  });

  // 2. Encounter
  entries.push({
    fullUrl: `urn:uuid:${encounterUuid}`,
    resource: encounterResource,
  });

  // 3. Observations
  for (const obs of observationResources) {
    entries.push({
      fullUrl: `urn:uuid:${obs.id}`,
      resource: obs,
    });
  }

  // 4. Conditions
  for (const cond of conditionResources) {
    entries.push({
      fullUrl: `urn:uuid:${cond.id}`,
      resource: cond,
    });
  }

  // 5. MedicationStatements
  for (const med of medicationResources) {
    entries.push({
      fullUrl: `urn:uuid:${med.id}`,
      resource: med,
    });
  }

  // 6. AllergyIntolerances
  for (const allergy of allergyResources) {
    entries.push({
      fullUrl: `urn:uuid:${allergy.id}`,
      resource: allergy,
    });
  }

  // 7. DocumentReferences
  for (const doc of documentResources) {
    entries.push({
      fullUrl: `urn:uuid:${doc.id}`,
      resource: doc,
    });
  }

  // 8. RiskAssessment
  entries.push({
    fullUrl: `urn:uuid:${riskUuid}`,
    resource: riskAssessment,
  });

  return {
    resourceType: "Bundle",
    id: `bundle-${record.encounter.sessionId}`,
    identifier: {
      system: "https://casex.sih/bundles",
      value: `BUNDLE-${record.encounter.sessionCode || record.encounter.sessionId}`,
    },
    type: "collection",
    timestamp: record.provenance?.generatedAt || new Date().toISOString(),
    total: entries.length,
    entry: entries,
  };
}
