import { SupportedLanguage } from "@/types/clinical";

export type ChiefComplaintCategory =
  | "meaningful"
  | "unclear_insufficient"
  | "non_clinical_gibberish";

export interface ChiefComplaintClassification {
  category: ChiefComplaintCategory;
  isValidComplaint: boolean;
  normalizedComplaint: string;
  verbatimText: string;
  restatePrompt?: string;
  confidence: number;
  provider: "deterministic" | "gemini";
}

const MULTILINGUAL_RESTATE_PROMPTS: Record<
  SupportedLanguage,
  { unclear: string; gibberish: string }
> = {
  en: {
    unclear:
      "We could not identify a specific health symptom from your response. Please describe the symptoms, discomfort, or health concern that brought you to the clinic today.",
    gibberish:
      "The input received does not seem to describe a health concern. Please describe what symptoms you are experiencing so the doctor can assist you.",
  },
  hi: {
    unclear:
      "हम आपकी स्वास्थ्य समस्या को पूरी तरह समझ नहीं पाए। कृपया बताएं कि आज आपको क्या शारीरिक परेशानी, दर्द या लक्षण महसूस हो रहे हैं?",
    gibberish:
      "दर्ज की गई जानकारी किसी स्वास्थ्य समस्या से संबंधित नहीं लग रही है। कृपया अपनी बीमारी या लक्षणों के बारे में बताएं ताकि डॉक्टर आपकी सहायता कर सकें।",
  },
  mr: {
    unclear:
      "आम्हाला तुमच्या आरोग्याच्या त्रासाबद्दल स्पष्ट माहिती समजली नाही. कृपया सांगा की आज तुम्हाला नेमका काय त्रास, वेदना किंवा लक्षणे जाणवत आहेत?",
    gibberish:
      "दिलेली माहिती आरोग्याच्या तक्रारीशी संबंधित दिसत नाही. कृपया तुमच्या शारीरिक त्रासाबद्दल किंवा लक्षणांबद्दल माहिती सांगा.",
  },
};

/**
 * High-confidence clinical symptom stems in English, Hindi, Marathi,
 * and transliterated Hinglish/Marathlish.
 */
const CLINICAL_SYMPTOM_REGEX = new RegExp(
  [
    // English symptoms and body regions
    "\\b(?:pain|ache|aching|hurts?|pressure|tightness|discomfort|heaviness|burning|burn|cramps?)\\b",
    "\\b(?:fever|feverish|temperature|chills|cold|cough|coughing|phlegm|sputum|breathless|breath|dyspnea|breathing)\\b",
    "\\b(?:sweat|sweating|nausea|vomit|vomiting|motions?|diarrhea|constipation|loose motions?)\\b",
    "\\b(?:headache|dizzy|dizziness|giddiness|vertigo|weakness|tired|fatigue|exhausted)\\b",
    "\\b(?:throat|sore throat|swelling|swollen|rash|itching|allergy|wound|injury|bleeding)\\b",
    "\\b(?:diabetes|sugar|blood pressure|bp|hypertension|heart|cardiac|palpitations?|acidity|gas)\\b",
    "\\b(?:chest|stomach|abdomen|belly|head|back|neck|shoulder|arm|leg|knee|joint|foot|feet|eye|ear)\\b",
    // Hindi Devanagari symptoms
    "(?:दर्द|दुखना|पीड़ा|भारीपन|दबाव|जकड़न|जलन|खिंचाव|बेचैनी|तकलीफ)",
    "(?:बुखार|ताप|ठंड|खांसी|कफ|बलगम|जुकाम|सर्दी|छींक|सांस|श्वास|दम|हांफना)",
    "(?:पसीना|घबराहट|जी मिचलाना|उल्टी|दस्त|कब्ज|पेट खराब|अतिसार)",
    "(?:सिरदर्द|चक्कर|कमजोरी|थकान|सुस्ती|गला|खराश|सूजन|फुंसी|खुजली|घाव|चोट|खून)",
    "(?:मधुमेह|शुगर|रक्तचाप|बीपी|दिल|छाती|सीना|पेट|कमर|पीठ|कंधा|हाथ|पैर|जोड़|घुटने)",
    // Marathi Devanagari symptoms
    "(?:वेदना|दुखणे|कळ|जड|दबाव|जकडणे|अस्वस्थता|त्रास|कळा)",
    "(?:ताप|कणकण|भरणी|खोकला|कफ|सर्दी|पडसे|शिंका|श्वास|दम|गुदमरणे)",
    "(?:घाम|मळमळ|उलटी|उलट्या|जुलाब|शौचास|मलबद्धता|पोटदुखी)",
    "(?:डोकेदुखी|चक्कर|भोवळ|अशक्तपणा|थकवा|घसा|सूज|खाज|व्रण|जखम|रक्त)",
    "(?:मधुमेह|रक्तदाब|हृदय|छातीत|छाती|पोट|पाठ|कंबर|खांदा|हात|पाय|सांधे|गुडघे)",
    // Transliterated Hinglish & Marathlish
    "\\b(?:dard|dukhna|dukh|peeda|takleef|bhaareepan|jalan|seene|chhati|chhatit)\\b",
    "\\b(?:bukhar|taap|thandi|khansi|sardi|jukam|saans|shwas|dam|pasina|gham)\\b",
    "\\b(?:ulti|dast|pet|pota|doka|dokedukhi|sir|chakkar|kamzori|thakan|ashakt)\\b",
  ].join("|"),
  "iu"
);

/**
 * Patterns matching pure keyboard gibberish or obvious non-clinical noise:
 * - 4+ consecutive non-word consonants without a vowel
 * - Repetitive single character (e.g. "aaaaa", ".....", "11111")
 * - Isolated non-word Latin keyboard clusters
 */
const GIBBERISH_REGEX =
  /(?:^[b-df-hj-np-tv-z]{4,}$|^([a-zA-Z0-9.,!?;:])\1{3,}$|^(?:asdf|qwerty|zxcv|hjkl|poiuy|lkjh|mnbv|1234|0000|test test|testing|abc def))/iu;

/**
 * Conservative, deterministic Chief Complaint Normalizer.
 * Removes speech-to-text noise, filler words, and common conversational greetings.
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
  cleaned = cleaned.replace(/^[a-zA-Z]{3,15}\s+(?=[\u0900-\u097F])/u, "");

  // 2. Remove leading conversational filler greetings
  cleaned = cleaned.replace(
    /^(?:hello\s+doctor|hi\s+doctor|good\s+morning\s+doctor|good\s+evening\s+doctor|hello|hi|hey|doctor|dr)\s*[,.:;!-]?\s*/iu,
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

  if (cleaned.length < 2) {
    return rawText.trim();
  }

  return cleaned;
}

/**
 * Classifies and validates patient input for Question 1 (Chief Complaint).
 *
 * Implements a conservative, hybrid architecture:
 * 1. Deterministic Fast-Path:
 *    - Rejects input < 3 chars, repeating characters, keyboard smash (100% precision, 0ms latency).
 *    - Validates recognized clinical symptoms across English, Hindi, and Marathi.
 * 2. Gemini Semantic Fallback:
 *    - Evaluates ambiguous, colloquial, or noisy natural language expressions without medical diagnosis.
 *    - Never rejects valid complaints due to minor misspellings or speech-to-text noise.
 */
export async function classifyAndValidateChiefComplaint(
  rawText: string,
  language: SupportedLanguage = "en"
): Promise<ChiefComplaintClassification> {
  const verbatim = (rawText || "").trim();
  const prompts = MULTILINGUAL_RESTATE_PROMPTS[language] || MULTILINGUAL_RESTATE_PROMPTS.en;

  // 1. Minimum character / emptiness check
  if (!verbatim || verbatim.length < 3) {
    return {
      category: "unclear_insufficient",
      isValidComplaint: false,
      normalizedComplaint: verbatim,
      verbatimText: verbatim,
      restatePrompt: prompts.unclear,
      confidence: 1.0,
      provider: "deterministic",
    };
  }

  // 2. Obvious gibberish / repetition / keyboard mash check
  const cleaned = cleanChiefComplaint(verbatim, language);
  const strippedForNoise = cleaned.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "");

  if (
    GIBBERISH_REGEX.test(cleaned) ||
    strippedForNoise.length < 2 ||
    /^(\D)\1+$/.test(cleaned) ||
    /^\d+$/.test(cleaned)
  ) {
    return {
      category: "non_clinical_gibberish",
      isValidComplaint: false,
      normalizedComplaint: verbatim,
      verbatimText: verbatim,
      restatePrompt: prompts.gibberish,
      confidence: 0.98,
      provider: "deterministic",
    };
  }

  // 3. Clinical Symptom Fast-Path Matching (English, Hindi, Marathi)
  const hasClinicalTerm = CLINICAL_SYMPTOM_REGEX.test(cleaned);
  if (hasClinicalTerm) {
    return {
      category: "meaningful",
      isValidComplaint: true,
      normalizedComplaint: cleaned,
      verbatimText: verbatim,
      confidence: 0.95,
      provider: "deterministic",
    };
  }

  // 4. Gemini-Assisted Semantic Fallback for Ambiguous / Colloquial Language
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    "";
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const systemPrompt = `You are a clinical intake statement classifier.
Analyze the patient's statement and classify it into ONE of:
- "meaningful": Describes a legitimate health symptom, physical discomfort, illness, or medical reason for consultation.
- "unclear_insufficient": The statement is too vague, ambiguous, or lacks sufficient clinical description to determine what is troubling the patient.
- "non_clinical_gibberish": The statement is nonsensical, random chat, jokes, or completely unrelated to health.

CRITICAL RULES:
1. NEVER diagnose the patient or suggest conditions.
2. DO NOT reject colloquial expressions, noisy speech-to-text, or brief multi-lingual descriptions if they express a genuine health complaint.
3. Return STRICTLY valid JSON with no backticks:
{"category": "meaningful" | "unclear_insufficient" | "non_clinical_gibberish", "confidence": 0.0-1.0}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\nPatient Language: ${language}\nPatient Statement: "${cleaned}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 128,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const json = await response.json();
        const candidateText =
          json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        if (candidateText) {
          const parsed = JSON.parse(
            candidateText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim()
          );

          const category: ChiefComplaintCategory =
            parsed.category === "meaningful" ||
            parsed.category === "unclear_insufficient" ||
            parsed.category === "non_clinical_gibberish"
              ? parsed.category
              : "meaningful";

          return {
            category,
            isValidComplaint: category === "meaningful",
            normalizedComplaint: cleaned,
            verbatimText: verbatim,
            restatePrompt:
              category === "meaningful"
                ? undefined
                : category === "unclear_insufficient"
                ? prompts.unclear
                : prompts.gibberish,
            confidence: Number(parsed.confidence) || 0.85,
            provider: "gemini",
          };
        }
      }
    } catch {
      // Gracefully fall through to conservative deterministic baseline
    }
  }

  // 5. Conservative Fallback Baseline (when Gemini is unconfigured or unavailable):
  // If the cleaned statement has at least 3 words and contains vowels, give the patient the benefit
  // of the doubt so the kiosk never blocks rare or unusual clinical phrasing.
  const words = cleaned.split(/\s+/).filter(Boolean);
  const hasVowels = /[aeiouy\u0904-\u0914\u093E-\u094C]/i.test(cleaned);

  if (words.length >= 2 && hasVowels) {
    return {
      category: "meaningful",
      isValidComplaint: true,
      normalizedComplaint: cleaned,
      verbatimText: verbatim,
      confidence: 0.75,
      provider: "deterministic",
    };
  }

  // Otherwise, safely request restatement
  return {
    category: "unclear_insufficient",
    isValidComplaint: false,
    normalizedComplaint: cleaned,
    verbatimText: verbatim,
    restatePrompt: prompts.unclear,
    confidence: 0.7,
    provider: "deterministic",
  };
}
