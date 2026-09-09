import {
  GenerateQuestionInput,
  StructuredQuestionOutput,
} from "./types";
import { MockAIProvider } from "./mock-provider";
import { GeminiAIProvider } from "./gemini-provider";

export * from "./types";
export * from "./mock-provider";
export * from "./gemini-provider";

/**
 * Resilient AI Intake Question Adapter
 * Attempts Gemini inference first; if throttled, unavailable, missing credentials,
 * or returning malformed data, safely falls back to deterministic clinical questions.
 */
export async function generateNextIntakeQuestion(
  input: GenerateQuestionInput
): Promise<StructuredQuestionOutput> {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );

  if (hasGeminiKey) {
    try {
      const gemini = new GeminiAIProvider();
      const result = await gemini.generateNextQuestion(input);
      if (result && result.questionText) {
        return result;
      }
    } catch (err) {
      // Graceful fallback to deterministic safety question
      console.warn(
        "[MediKiosk AI] Gemini inference failed or timed out. Falling back to deterministic clinical question.",
        err instanceof Error ? err.message : err
      );
    }
  }

  // Safety Fallback Baseline
  const mock = new MockAIProvider();
  return mock.generateNextQuestion(input);
}
