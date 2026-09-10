/**
 * FHIR R4 Minimal Type Contract for MediKiosk / CaseX Interoperability
 * Standard: HL7 FHIR Release 4 (R4) - v4.0.1
 *
 * Strict dependency-free TypeScript interfaces for the resources actually emitted
 * by the MediKiosk canonical clinical encounter mapper.
 *
 * NOTE: Standardized coding (LOINC, SNOMED CT, ICD-10, RxNorm) is NOT fabricated.
 * Concepts without standard terminology use CodeableConcept.text in compliance
 * with the FHIR R4 specification.
 */

// ============================================================================
// Core Reusable Data Types
// ============================================================================

export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  profile?: string[];
}

export interface FhirCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirIdentifier {
  use?: "usual" | "official" | "temp" | "secondary" | "old";
  system?: string;
  value: string;
  type?: FhirCodeableConcept;
}

export interface FhirHumanName {
  use?: "usual" | "official" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
}

export interface FhirContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
}

export interface FhirReference {
  reference?: string;
  type?: string;
  identifier?: FhirIdentifier;
  display?: string;
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

export interface FhirQuantity {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: string;
  system?: string;
  code?: string;
}

export interface FhirAnnotation {
  authorString?: string;
  time?: string;
  text: string;
}

export interface FhirAttachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

export interface FhirDosage {
  sequence?: number;
  text?: string;
  patientInstruction?: string;
}

// ============================================================================
// Resource Definitions
// ============================================================================

export type FhirAdministrativeGender = "male" | "female" | "other" | "unknown";

export interface FhirPatient {
  resourceType: "Patient";
  id: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: FhirAdministrativeGender;
  birthDate?: string;
  communication?: Array<{
    language: FhirCodeableConcept;
    preferred?: boolean;
  }>;
}

export type FhirEncounterStatus =
  | "planned"
  | "arrived"
  | "triaged"
  | "in-progress"
  | "onleave"
  | "finished"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

export interface FhirEncounter {
  resourceType: "Encounter";
  id: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: FhirEncounterStatus;
  class: FhirCoding;
  serviceType?: FhirCodeableConcept;
  priority?: FhirCodeableConcept;
  subject: FhirReference;
  participant?: Array<{
    individual?: FhirReference;
  }>;
  period?: FhirPeriod;
  reasonCode?: FhirCodeableConcept[];
}

export interface FhirCondition {
  resourceType: "Condition";
  id: string;
  meta?: FhirMeta;
  clinicalStatus?: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  severity?: FhirCodeableConcept;
  code: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  note?: FhirAnnotation[];
}

export interface FhirObservationComponent {
  code: FhirCodeableConcept;
  valueString?: string;
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
}

export type FhirObservationStatus =
  | "registered"
  | "preliminary"
  | "final"
  | "amended"
  | "corrected"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

export interface FhirObservation {
  resourceType: "Observation";
  id: string;
  meta?: FhirMeta;
  status: FhirObservationStatus;
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime?: string;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  interpretation?: FhirCodeableConcept[];
  note?: FhirAnnotation[];
  referenceRange?: Array<{
    low?: FhirQuantity;
    high?: FhirQuantity;
    type?: FhirCodeableConcept;
    text?: string;
  }>;
  component?: FhirObservationComponent[];
}

export type FhirMedicationStatementStatus =
  | "active"
  | "completed"
  | "entered-in-error"
  | "intended"
  | "stopped"
  | "on-hold"
  | "unknown"
  | "not-taken";

export interface FhirMedicationStatement {
  resourceType: "MedicationStatement";
  id: string;
  meta?: FhirMeta;
  status: FhirMedicationStatementStatus;
  category?: FhirCodeableConcept;
  medicationCodeableConcept: FhirCodeableConcept;
  subject: FhirReference;
  context?: FhirReference;
  dateAsserted?: string;
  dosage?: FhirDosage[];
  note?: FhirAnnotation[];
}

export interface FhirAllergyIntolerance {
  resourceType: "AllergyIntolerance";
  id: string;
  meta?: FhirMeta;
  clinicalStatus?: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  type?: "allergy" | "intolerance";
  category?: Array<"food" | "medication" | "environment" | "biologic">;
  criticality?: "low" | "high" | "unable-to-assess";
  code: FhirCodeableConcept;
  patient: FhirReference;
  encounter?: FhirReference;
  reaction?: Array<{
    manifestation: FhirCodeableConcept[];
    severity?: "mild" | "moderate" | "severe";
    note?: FhirAnnotation[];
  }>;
  note?: FhirAnnotation[];
}

export type FhirDocumentReferenceStatus = "current" | "superseded" | "entered-in-error";

export interface FhirDocumentReference {
  resourceType: "DocumentReference";
  id: string;
  meta?: FhirMeta;
  status: FhirDocumentReferenceStatus;
  type?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  subject?: FhirReference;
  date?: string;
  description?: string;
  securityLabel?: FhirCodeableConcept[];
  content: Array<{
    attachment: FhirAttachment;
    format?: FhirCoding;
  }>;
}

export interface FhirRiskAssessmentPrediction {
  outcome?: FhirCodeableConcept;
  probabilityDecimal?: number;
  rationale?: string;
}

export type FhirRiskAssessmentStatus =
  | "registered"
  | "preliminary"
  | "final"
  | "amended"
  | "corrected"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

export interface FhirRiskAssessment {
  resourceType: "RiskAssessment";
  id: string;
  meta?: FhirMeta;
  status: FhirRiskAssessmentStatus;
  subject: FhirReference;
  encounter?: FhirReference;
  code?: FhirCodeableConcept;
  method?: FhirCodeableConcept;
  basis?: FhirReference[];
  prediction?: FhirRiskAssessmentPrediction[];
  note?: FhirAnnotation[];
}

// ============================================================================
// Union & Bundle Types
// ============================================================================

export type FhirResource =
  | FhirPatient
  | FhirEncounter
  | FhirCondition
  | FhirObservation
  | FhirMedicationStatement
  | FhirAllergyIntolerance
  | FhirDocumentReference
  | FhirRiskAssessment;

export interface FhirBundleEntry<T extends FhirResource = FhirResource> {
  fullUrl: string;
  resource: T;
}

export interface FhirBundle {
  resourceType: "Bundle";
  id: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier;
  type: "collection";
  timestamp: string;
  total?: number;
  entry: FhirBundleEntry[];
}
