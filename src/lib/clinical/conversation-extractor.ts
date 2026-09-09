import {
  ClinicalDomain,
  SupportedLanguage,
} from "@/types/clinical";

export interface StructuredClinicalSymptom {
  symptomName: string;
  onset?: string;
  duration?: string;
  severity?: string;
  location?: string;
  radiation?: string;
  character?: string;
  sourceText: string;
  stepNumber: number;
  questionDomain: ClinicalDomain;
  confidence: number;
}

export interface StructuredReportedCondition {
  conditionName: string;
  status?: string;
  duration?: string;
  sourceText: string;
  stepNumber: number;
}

export interface StructuredReportedMedication {
  medicationName: string;
  dosage?: string;
  frequency?: string;
  compliance?: string;
  sourceText: string;
  stepNumber: number;
}

export interface StructuredReportedAllergy {
  allergen: string;
  reaction?: string;
  sourceText: string;
  stepNumber: number;
}

export interface StructuredConversationFindings {
  chiefComplaint: {
    confirmed?: string;
    verbatim: string;
    language: SupportedLanguage;
  };
  symptoms: StructuredClinicalSymptom[];
  conditions: StructuredReportedCondition[];
  medications: StructuredReportedMedication[];
  allergies: StructuredReportedAllergy[];
  associatedObservations: string[];
  hpiNarrative: string;
}

export interface ConversationStepInput {
  stepNumber: number;
  domain: ClinicalDomain;
  questionText: string;
  answerText: string;
  language: SupportedLanguage;
}

// Regex helpers for duration and onset in EN, HI, MR
const ONSET_DURATION_REGEX = new RegExp(
  [
    "(?:yesterday(?:\\s+evening|\\s+morning|\\s+night)?|today|past\\s+\\d+\\s*(?:days?|hours?|weeks?|months?))",
    "(?:\\d+\\s*(?:hours?|hrs?|days?|weeks?|months?)\\s*ago)",
    "(?:since\\s+[a-zA-Z0-9\\s]+)",
    "(?:कल\\s*शाम\\s*से|कल\\s*रात\\s*से|आज\\s*सुबह\\s*से|\\d+\\s*(?:घंटे|दिन|हफ्ते|महीने)\\s*(?:पहले|से))",
    "(?:काल\\s*संध्याकाळपासून|काल\\s*रात्रीपासून|आज\\s*सकाळपासून|\\d+\\s*(?:तासांपूर्वी|दिवसांपूर्वी|आठवड्यांपूर्वी|महिन्यांपूर्वी))",
  ].join("|"),
  "iu"
);

// Regex helpers for severity in EN, HI, MR
const SEVERITY_EXTRACTION_REGEX = new RegExp(
  [
    "\\b(?:severe|moderate|mild|excruciating|unbearable|extreme|heavy|intense|crushing)\\b",
    "(?:\\b(?:10|9|8|7|6|5|4|3|2|1)\\s*\\/\\s*10\\b)",
    "(?:तेज|बहुत तेज|असहनीय|हल्का|मध्यम|तीव्र|गंभीर)",
    "(?:तीव्र|प्रचंड|खूप|असह्य|हलका|मध्यम|कमी)",
  ].join("|"),
  "iu"
);

// Regex helpers for radiation in EN, HI, MR
const RADIATION_EXTRACTION_REGEX = new RegExp(
  [
    "(?:left\\s+(?:shoulder|arm|hand)|radiat(?:es?|ing)\\s+to\\s+[a-zA-Z\\s]+|spreads?\\s+to\\s+[a-zA-Z\\s]+)",
    "(?:बाएं\\s*(?:हाथ|कंधे|बाजू)\\s*में|पीठ\\s*में|गर्दन\\s*में\\s*फैलता)",
    "(?:डाव्या\\s*(?:हाताकडे|खांद्याकडे)|पाठीकडे|मानेकडे\\s*पसरतो)",
  ].join("|"),
  "iu"
);

/**
 * Deterministic Clinical Conversational Structurer.
 * Parses patient Q&A into structured entities while anchoring every entity
 * to its exact verbatim source statement and step number.
 */
export function extractStructuredConversationEntities(
  dialogue: ConversationStepInput[],
  confirmedComplaint?: string
): StructuredConversationFindings {
  const symptoms: StructuredClinicalSymptom[] = [];
  const conditions: StructuredReportedCondition[] = [];
  const medications: StructuredReportedMedication[] = [];
  const allergies: StructuredReportedAllergy[] = [];
  const associatedObservations: string[] = [];

  let primaryComplaintVerbatim = "";
  let primaryLang: SupportedLanguage = "en";

  for (const step of dialogue) {
    const raw = step.answerText.trim();
    if (!raw) continue;

    primaryLang = step.language;

    // Step 1: Chief Complaint
    if (step.domain === "chief_complaint" || step.stepNumber === 1) {
      primaryComplaintVerbatim = raw;

      const durMatch = raw.match(ONSET_DURATION_REGEX);
      const sevMatch = raw.match(SEVERITY_EXTRACTION_REGEX);
      const radMatch = raw.match(RADIATION_EXTRACTION_REGEX);

      symptoms.push({
        symptomName: confirmedComplaint || "Primary Presenting Complaint",
        onset: durMatch ? durMatch[0].trim() : undefined,
        duration: durMatch ? durMatch[0].trim() : undefined,
        severity: sevMatch ? sevMatch[0].trim() : undefined,
        radiation: radMatch ? radMatch[0].trim() : undefined,
        sourceText: raw,
        stepNumber: step.stepNumber,
        questionDomain: step.domain,
        confidence: 0.95,
      });
    }

    // Step 2: HPI Onset & Radiation
    else if (step.domain === "hpi_onset") {
      const durMatch = raw.match(ONSET_DURATION_REGEX);
      const radMatch = raw.match(RADIATION_EXTRACTION_REGEX);
      const sevMatch = raw.match(SEVERITY_EXTRACTION_REGEX);

      symptoms.push({
        symptomName: "Symptom Onset & Progression",
        onset: durMatch ? durMatch[0].trim() : undefined,
        duration: durMatch ? durMatch[0].trim() : undefined,
        radiation: radMatch ? radMatch[0].trim() : undefined,
        severity: sevMatch ? sevMatch[0].trim() : undefined,
        sourceText: raw,
        stepNumber: step.stepNumber,
        questionDomain: step.domain,
        confidence: 0.9,
      });
    }

    // Step 3: Associated Symptoms
    else if (step.domain === "associated_symptoms") {
      const lower = raw.toLowerCase();

      // Sweating / Diaphoresis
      if (
        lower.includes("sweat") ||
        lower.includes("पसीना") ||
        lower.includes("घाम") ||
        lower.includes("pasina") ||
        lower.includes("gham")
      ) {
        symptoms.push({
          symptomName: "Diaphoresis (Profuse Sweating)",
          sourceText: raw,
          stepNumber: step.stepNumber,
          questionDomain: step.domain,
          confidence: 0.92,
        });
      }

      // Dyspnea / Breathlessness
      if (
        lower.includes("breath") ||
        lower.includes("सांस") ||
        lower.includes("श्वास") ||
        lower.includes("दम") ||
        lower.includes("saans") ||
        lower.includes("shwas")
      ) {
        symptoms.push({
          symptomName: "Dyspnea (Shortness of Breath)",
          sourceText: raw,
          stepNumber: step.stepNumber,
          questionDomain: step.domain,
          confidence: 0.92,
        });
      }

      // Nausea / Vomiting
      if (
        lower.includes("nausea") ||
        lower.includes("vomit") ||
        lower.includes("उल्टी") ||
        lower.includes("मळमळ") ||
        lower.includes("ulti")
      ) {
        symptoms.push({
          symptomName: "Nausea / Vomiting",
          sourceText: raw,
          stepNumber: step.stepNumber,
          questionDomain: step.domain,
          confidence: 0.9,
        });
      }

      // Dizziness / Lightheadedness
      if (
        lower.includes("dizzy") ||
        lower.includes("giddiness") ||
        lower.includes("चक्कर") ||
        lower.includes("चक") ||
        lower.includes("chakkar")
      ) {
        symptoms.push({
          symptomName: "Dizziness / Lightheadedness",
          sourceText: raw,
          stepNumber: step.stepNumber,
          questionDomain: step.domain,
          confidence: 0.9,
        });
      }

      associatedObservations.push(raw);
    }

    // Step 4: Medical History, Medications, Allergies
    else if (
      step.domain === "past_medical_history" ||
      step.domain === "medication_history" ||
      step.domain === "allergy_history" ||
      (step.domain as string) === "past_history" ||
      step.stepNumber >= 4
    ) {
      const lower = raw.toLowerCase();

      // Hypertension
      if (
        lower.includes("hypertension") ||
        lower.includes("bp") ||
        lower.includes("blood pressure") ||
        lower.includes("उच्च रक्तचाप") ||
        lower.includes("रक्तदाब")
      ) {
        conditions.push({
          conditionName: "Essential Hypertension",
          status: "chronic_active",
          sourceText: raw,
          stepNumber: step.stepNumber,
        });
      }

      // Diabetes Mellitus
      if (
        lower.includes("diabetes") ||
        lower.includes("sugar") ||
        lower.includes("मधुमेह") ||
        lower.includes("शुगर") ||
        lower.includes("डायबिटीज")
      ) {
        conditions.push({
          conditionName: "Type 2 Diabetes Mellitus",
          status: "chronic_active",
          sourceText: raw,
          stepNumber: step.stepNumber,
        });
      }

      // Heart condition / CAD
      if (
        lower.includes("heart") ||
        lower.includes("cardiac") ||
        lower.includes("attack") ||
        lower.includes("दिल") ||
        lower.includes("हृदय")
      ) {
        conditions.push({
          conditionName: "Pre-existing Cardiovascular Condition",
          status: "chronic_active",
          sourceText: raw,
          stepNumber: step.stepNumber,
        });
      }

      // Common Medications
      const medMatches = raw.match(
        /\b(?:amlodipine|metformin|telmisartan|atorvastatin|aspirin|clopidogrel|insulin|pantocid|pan\s*40|paracetamol)\b[^\n,.]*/gi
      );
      if (medMatches) {
        for (const m of medMatches) {
          medications.push({
            medicationName: m.trim(),
            sourceText: raw,
            stepNumber: step.stepNumber,
          });
        }
      } else if (
        lower.includes("taking") ||
        lower.includes("medicine") ||
        lower.includes("दवा") ||
        lower.includes("गोळ्या")
      ) {
        medications.push({
          medicationName: "Regular Prescription Medication (Details in verbatim answer)",
          sourceText: raw,
          stepNumber: step.stepNumber,
        });
      }

      // Allergies
      if (
        lower.includes("allergy") ||
        lower.includes("allergic") ||
        lower.includes("एलर्जी") ||
        lower.includes("penicillin") ||
        lower.includes("पेनिसिलिन")
      ) {
        const allergenMatch = raw.match(/allergic\s+to\s+([a-zA-Z0-9\s]+?)(?=[.,]|$)/i);
        const allergenName = allergenMatch
          ? allergenMatch[1].trim()
          : lower.includes("penicillin") || lower.includes("पेनिसिलिन")
          ? "Penicillin"
          : "Reported Medical / Drug Sensitivity";

        allergies.push({
          allergen: allergenName,
          sourceText: raw,
          stepNumber: step.stepNumber,
        });
      }
    }
  }

  // Synthesize factual HPI narrative
  const complaintStr = confirmedComplaint || primaryComplaintVerbatim || "Unspecified chief complaint";
  const onsetSym = symptoms.find((s) => s.onset || s.duration);
  const onsetStr = onsetSym ? `starting ${onsetSym.onset || onsetSym.duration}` : "";
  const assocNames = symptoms
    .filter((s) => s.stepNumber > 1 && s.symptomName !== "Symptom Onset & Progression")
    .map((s) => s.symptomName);

  const assocStr =
    assocNames.length > 0 ? `Associated with ${assocNames.join(", ")}.` : "";
  const condStr =
    conditions.length > 0
      ? `Past medical history includes ${conditions.map((c) => c.conditionName).join(", ")}.`
      : "";
  const medStr =
    medications.length > 0
      ? `Current reported medications: ${medications.map((m) => m.medicationName).join(", ")}.`
      : "";

  const hpiNarrative = [
    `Patient presents with: "${complaintStr}" ${onsetStr}.`.trim(),
    assocStr,
    condStr,
    medStr,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    chiefComplaint: {
      confirmed: confirmedComplaint,
      verbatim: primaryComplaintVerbatim,
      language: primaryLang,
    },
    symptoms,
    conditions,
    medications,
    allergies,
    associatedObservations,
    hpiNarrative,
  };
}
