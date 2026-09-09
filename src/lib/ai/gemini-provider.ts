import {
  AIProvider,
  GenerateQuestionInput,
  StructuredQuestionOutput,
} from "./types";
import { ClinicalDomain } from "@/types/clinical";

const VALID_DOMAINS: Set<ClinicalDomain> = new Set([
  "chief_complaint",
  "hpi_onset",
  "hpi_severity",
  "hpi_character",
  "associated_symptoms",
  "past_medical_history",
  "medication_history",
  "allergy_history",
  "family_history",
  "lifestyle_social",
  "ayush_pariksha",
]);

export class GeminiAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey =
      apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      "";
    this.model = model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  async generateNextQuestion(
    input: GenerateQuestionInput
  ): Promise<StructuredQuestionOutput> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const languageNames: Record<string, string> = {
      en: "English",
      hi: "Hindi (हिंदी)",
      mr: "Marathi (मराठी)",
    };

    const targetLangName = languageNames[input.language] || "English";

    const systemPrompt = `You are MediKiosk AI, an assistive outpatient clinical intake interviewer.
YOUR ROLE:
- Formulate a single empathetic, professional, and clear clinical follow-up question in ${targetLangName}.
- The question must focus on the clinical domain: "${input.clinicalDomain}".
- NEVER provide medical diagnoses, treatments, prescriptions, or advice.
- NEVER repeat information the patient has already provided.
- RETURN ONLY a valid JSON object with NO markdown formatting, backticks, or extra text.

JSON Schema:
{
  "questionText": "Question in ${targetLangName}",
  "questionTextCanonical": "Standardized clinical version in English",
  "clinicalDomain": "${input.clinicalDomain}",
  "inputType": "text"
}`;

    const conversationContext = input.previousAnswers
      .map(
        (qa, idx) =>
          `Step ${idx + 1} [Domain: ${qa.questionDomain}]:\nDoctor Kiosk: ${qa.questionText}\nPatient: ${qa.answerText}`
      )
      .join("\n\n");

    const userPrompt = `Patient Language: ${targetLangName}
Target Clinical Domain: ${input.clinicalDomain}
Latest Patient Statement: "${input.currentPatientAnswer}"

Previous Case Intake Dialogue:
${conversationContext || "Beginning of consultation."}

Generate the single next question in ${targetLangName} for clinical domain "${input.clinicalDomain}" as JSON.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 256,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(4000), // 4-second strict timeout for kiosk responsiveness
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown");
      throw new Error(`Gemini API returned HTTP ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const candidateText =
      json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!candidateText) {
      throw new Error("Gemini returned empty candidate content");
    }

    // Clean potential markdown wrap if model added it
    const cleanJsonStr = candidateText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJsonStr);

    if (!parsed.questionText || typeof parsed.questionText !== "string") {
      throw new Error("Invalid questionText in Gemini JSON payload");
    }

    const validatedDomain: ClinicalDomain = VALID_DOMAINS.has(
      parsed.clinicalDomain as ClinicalDomain
    )
      ? (parsed.clinicalDomain as ClinicalDomain)
      : input.clinicalDomain;

    return {
      questionText: parsed.questionText.trim(),
      questionTextCanonical:
        parsed.questionTextCanonical?.trim() || parsed.questionText.trim(),
      clinicalDomain: validatedDomain,
      inputType: "text",
      isAiGenerated: true,
      provider: "gemini",
    };
  }
}
