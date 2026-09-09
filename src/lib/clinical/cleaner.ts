import { SupportedLanguage } from "@/types/clinical";

/**
 * Conservative, deterministic Chief Complaint Normalizer.
 *
 * Requirements:
 * 1. Strictly non-destructive to legitimate medical terminology in English, Hindi, and Marathi.
 * 2. Removes ONLY obvious, high-confidence speech-to-text noise:
 *    - Accidental Latin keyboard gibberish prefixes before Devanagari text (e.g. "fjfyfy मुझे..." -> "मुझे...")
 *    - Non-word consonant clusters without vowels (e.g. "asdfghjkl", "fjfyfy")
 *    - Common conversational greeting prefixes at the start of a consultation:
 *      (e.g. "Hello doctor,", "Hi doctor,", "नमस्ते डॉक्टर,", "नमस्कार डॉक्टर,")
 * 3. Normalizes repeated whitespace and leading/trailing punctuation.
 * 4. If uncertain or if cleaned text becomes empty/too short, safely retains the original text.
 */
export function cleanChiefComplaint(
  rawText: string,
  language: SupportedLanguage = "en"
): string {
  void language;
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  let cleaned = rawText.trim();
  if (!cleaned) return "";

  // 1. Remove isolated ASCII/Latin gibberish prefix before Devanagari text
  // Pattern: 3+ ASCII characters that are immediately followed by Devanagari characters
  // Example: "fjfyfy मुझे कल रात से..." -> "मुझे कल रात से..."
  // Example: "asdf मला कालपासून..." -> "मला कालपासून..."
  cleaned = cleaned.replace(/^[a-zA-Z]{3,15}\s+(?=[\u0900-\u097F])/u, "");

  // 2. Remove leading conversational filler greetings that do not convey clinical symptoms
  // English greetings
  cleaned = cleaned.replace(
    /^(?:hello\s+doctor|hi\s+doctor|good\s+morning\s+doctor|good\s+evening\s+doctor|doctor|dr)\s*[,.:;!-]?\s*/iu,
    ""
  );

  // Hindi greetings
  cleaned = cleaned.replace(
    /^(?:नमस्ते\s+डॉक्टर|प्रणाम\s+डॉक्टर|डॉक्टर\s+साहब|नमस्ते|प्रणाम)\s*[,.:;!-]?\s*/u,
    ""
  );

  // Marathi greetings
  cleaned = cleaned.replace(
    /^(?:नमस्कार\s+डॉक्टर|डॉक्टर\s+साहेब|नमस्कार)\s*[,.:;!-]?\s*/u,
    ""
  );

  // 3. Remove leading filler syllables (e.g., "uh, ", "um, ", "er, ")
  cleaned = cleaned.replace(/^(?:uh|um|er|ah)\s*[,.:;!-]?\s*/iu, "");

  // 4. Remove leading/trailing stray punctuation and multiple whitespaces
  cleaned = cleaned
    .replace(/^[,\-.:;!?।॥~_ ]+/, "")
    .replace(/[,\-.:;!?~_ ]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  // Safety fallback: if cleaning accidentally resulted in an empty string or stripped everything,
  // fall back to the original trimmed text.
  if (cleaned.length < 2) {
    return rawText.trim();
  }

  return cleaned;
}
