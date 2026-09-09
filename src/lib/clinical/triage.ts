import { TriageEvaluationResult } from "@/types/clinical";

export const RULE_CARDIAC_CHEST_PAIN = "RULE_CARDIAC_CHEST_PAIN";

/**
 * Normalizes input text across English, Hindi, and Marathi.
 * - Converts to lowercase
 * - Normalizes unicode (NFC)
 * - Replaces punctuation with single spaces
 * - Normalizes multiple whitespace characters
 */
export function normalizeClinicalText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'।॥]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rule definition interface for deterministic triage evaluation.
 */
interface ClinicalTriageRule {
  id: string;
  evaluate: (normalizedText: string) => {
    triggered: boolean;
    triggerReason?: string;
    triggerSymptoms?: string[];
  };
}

/**
 * Condition A: Chest pain / pressure / tightness / heaviness / discomfort
 * Supports English, Hindi, and Marathi clinical terminology and clause proximity.
 */
const CHEST_PAIN_REGEX =
  /(?:chest[\s\S]{0,40}(?:pain|pressure|tightness|discomfort|heaviness|ache|aching)|(?:pain|pressure|tightness|discomfort|heaviness|ache|aching)[\s\S]{0,40}chest|(?:सीने|छाती)[\s\S]{0,40}(?:दर्द|भारीपन|दबाव|जकड़न|बेचैनी|जलन|तकलीफ)|(?:दर्द|भारीपन|दबाव|जकड़न|बेचैनी|जलन|तकलीफ)[\s\S]{0,40}(?:सीने|छाती)|(?:छातीत|छातीमध्ये|छातीवर|छाती)[\s\S]{0,40}(?:वेदना|दुखणे|कळ|दबाव|जड|जकडणे|अस्वस्थता)|(?:वेदना|दुखणे|कळ)[\s\S]{0,40}(?:छातीत|छातीमध्ये|छाती)|seene[\s\S]{0,30}dard|chhati[\s\S]{0,30}dard|chhatit[\s\S]{0,30}(?:vedna|dukhne))/iu;

/**
 * Condition B1: Diaphoresis / Sweating
 */
const SWEATING_REGEX =
  /(?:sweat|sweating|diaphoresis|perspiration|पसीना|घाम|gham|pasina)/iu;

/**
 * Condition B2: Radiation to left arm / shoulder / neck / back / jaw
 */
const RADIATION_REGEX =
  /(?:left[\s\S]{0,25}(?:arm|shoulder)|(?:radiat|spread|going to|shoots down)[\s\S]{0,30}(?:arm|shoulder|neck|back|jaw)|(?:बाएं|बांये|उलटे)[\s\S]{0,25}(?:हाथ|कंधे|बाजू|कंधा)|(?:डाव्या|डावा)[\s\S]{0,25}(?:हाता|खांद्या|हात|खांदा)|(?:फैल|पसर))/iu;

/**
 * Condition B3: Dyspnea / Shortness of breath / Difficulty breathing
 */
const DYSPNEA_REGEX =
  /(?:shortness of breath|breathless|dyspnea|difficulty breathing|trouble breathing|hard to breathe|can't breathe|cannot breathe|(?:सांस|श्वास)[\s\S]{0,30}(?:तकलीफ|कठिनाई|फूल|भारी|त्रास|लागणे|गुदमर)|दम[\s\S]{0,20}(?:घुटना|लागणे))/iu;

/**
 * Condition B4: Severe intensity
 */
const SEVERITY_REGEX =
  /(?:severe|unbearable|crushing|excruciating|extreme|intense|10\/10|9\/10|8\/10|तीव्र|बहुत तेज|असहनीय|गंभीर|असह्य|प्रचंड)/iu;

/**
 * Deterministic Rule: RULE_CARDIAC_CHEST_PAIN
 *
 * Safety Logic:
 * Condition A: Patient cumulative statements contain chest pain / pressure / tightness / discomfort
 * AND
 * Condition B: Patient cumulative statements contain at least ONE high-risk associated feature:
 *   1. Diaphoresis / sweating
 *   2. Radiation to left arm / shoulder / neck / back / jaw
 *   3. Dyspnea / difficulty breathing
 *   4. Severe pain intensity
 *
 * Strict Non-Diagnostic Guard:
 * Returns clinical alert level and explainable symptoms without diagnosing
 * myocardial infarction, acute coronary syndrome, or heart attack.
 */
export const cardiacChestPainRule: ClinicalTriageRule = {
  id: RULE_CARDIAC_CHEST_PAIN,
  evaluate: (normalizedText: string) => {
    const hasChestPain = CHEST_PAIN_REGEX.test(normalizedText);
    if (!hasChestPain) {
      return { triggered: false };
    }

    const detectedSymptoms: string[] = ["chest_pain"];

    const hasSweating = SWEATING_REGEX.test(normalizedText);
    if (hasSweating) detectedSymptoms.push("diaphoresis");

    const hasRadiation = RADIATION_REGEX.test(normalizedText);
    if (hasRadiation) detectedSymptoms.push("radiation_left_arm_shoulder");

    const hasDyspnea = DYSPNEA_REGEX.test(normalizedText);
    if (hasDyspnea) detectedSymptoms.push("dyspnea");

    const hasSeverity = SEVERITY_REGEX.test(normalizedText);
    if (hasSeverity) detectedSymptoms.push("severe_intensity");

    // Condition B requires at least one associated feature
    const hasAssociatedFeature =
      hasSweating || hasRadiation || hasDyspnea || hasSeverity;

    if (hasChestPain && hasAssociatedFeature) {
      return {
        triggered: true,
        triggerReason:
          "Patient reports chest pain or pressure accompanied by high-risk associated clinical features (sweating, radiation, dyspnea, or severe intensity), meeting criteria for immediate clinical triage evaluation.",
        triggerSymptoms: detectedSymptoms,
      };
    }

    return { triggered: false };
  },
};

const REGISTERED_TRIAGE_RULES: ClinicalTriageRule[] = [cardiacChestPainRule];

/**
 * Evaluates cumulative intake answers against deterministic clinical safety rules.
 *
 * @param answers Array of patient answer strings or single concatenated text
 * @returns TriageEvaluationResult with trigger status, rule ID, and non-diagnostic reason
 */
export function evaluateSessionTriage(
  answers: string[] | string
): TriageEvaluationResult {
  const combinedText = Array.isArray(answers) ? answers.join(" ") : answers;
  const normalized = normalizeClinicalText(combinedText);

  if (!normalized) {
    return { triggered: false };
  }

  for (const rule of REGISTERED_TRIAGE_RULES) {
    const result = rule.evaluate(normalized);
    if (result.triggered) {
      return {
        triggered: true,
        alertLevel: "critical_red_flag",
        triggerRuleId: rule.id,
        triggerReason: result.triggerReason,
        triggerSymptoms: result.triggerSymptoms,
      };
    }
  }

  return { triggered: false };
}
