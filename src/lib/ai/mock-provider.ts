import {
  AIProvider,
  GenerateQuestionInput,
  StructuredQuestionOutput,
} from "./types";
import { ClinicalDomain, SupportedLanguage } from "@/types/clinical";

interface FallbackQuestion {
  domain: ClinicalDomain;
  text: string;
  canonical: string;
}

const DETERMINISTIC_QUESTIONS: Record<
  SupportedLanguage,
  Record<ClinicalDomain, FallbackQuestion>
> = {
  en: {
    chief_complaint: {
      domain: "chief_complaint",
      text: "Hello. Please describe the primary health concern or symptoms that brought you to the clinic today.",
      canonical: "What is your chief complaint or primary reason for consultation?",
    },
    hpi_onset: {
      domain: "hpi_onset",
      text: "When exactly did this pain or discomfort start, and does it spread to your shoulder, arm, neck, or back?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
    },
    associated_symptoms: {
      domain: "associated_symptoms",
      text: "Are you experiencing any shortness of breath, heavy sweating, nausea, or dizziness along with this?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
    },
    past_medical_history: {
      domain: "past_medical_history",
      text: "Thank you. Do you have any diagnosed conditions (such as diabetes, hypertension, or heart conditions) or regular medications?",
      canonical: "Past medical history, chronic conditions, and current medications.",
    },
    hpi_severity: {
      domain: "hpi_severity",
      text: "On a scale from 1 to 10, how severe is this pain or discomfort right now?",
      canonical: "Pain severity on a numerical rating scale.",
    },
    hpi_character: {
      domain: "hpi_character",
      text: "How would you describe the feeling (e.g. sharp, heavy pressure, burning, or aching)?",
      canonical: "Quality and character of pain.",
    },
    medication_history: {
      domain: "medication_history",
      text: "What regular prescription or over-the-counter medications are you currently taking?",
      canonical: "Current medications and dosages.",
    },
    allergy_history: {
      domain: "allergy_history",
      text: "Do you have any known allergies to medications, foods, or other substances?",
      canonical: "Drug and environmental allergies.",
    },
    family_history: {
      domain: "family_history",
      text: "Is there any history of heart disease, diabetes, or hypertension in your immediate family?",
      canonical: "Family history of cardiovascular or chronic illnesses.",
    },
    lifestyle_social: {
      domain: "lifestyle_social",
      text: "Do you consume tobacco, alcohol, or have any specific dietary restrictions?",
      canonical: "Lifestyle habits, substance use, and social history.",
    },
    ayush_pariksha: {
      domain: "ayush_pariksha",
      text: "How is your appetite, digestion, sleep pattern, and energy level throughout the day?",
      canonical: "AYUSH physiological and functional assessment.",
    },
  },
  hi: {
    chief_complaint: {
      domain: "chief_complaint",
      text: "नमस्ते। कृपया बताएं कि आज आप किन मुख्य लक्षणों या स्वास्थ्य परेशानी के लिए परामर्श लेना चाहते हैं?",
      canonical: "What is your chief complaint or primary reason for consultation?",
    },
    hpi_onset: {
      domain: "hpi_onset",
      text: "यह दर्द या परेशानी ठीक कब शुरू हुई थी, और क्या यह दर्द आपके कंधे, हाथ, गर्दन या पीठ में भी फैलता है?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
    },
    associated_symptoms: {
      domain: "associated_symptoms",
      text: "क्या इसके साथ आपको सांस लेने में कठिनाई, अत्यधिक पसीना, जी मिचलाना या चक्कर आ रहे हैं?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
    },
    past_medical_history: {
      domain: "past_medical_history",
      text: "धन्यवाद। क्या आपको पहले से कोई पुरानी बीमारी (जैसे मधुमेह, उच्च रक्तचाप) है या कोई नियमित दवा चल रही है?",
      canonical: "Past medical history, chronic conditions, and current medications.",
    },
    hpi_severity: {
      domain: "hpi_severity",
      text: "1 से 10 के पैमाने पर, यह दर्द अभी कितना तीव्र है?",
      canonical: "Pain severity on a numerical rating scale.",
    },
    hpi_character: {
      domain: "hpi_character",
      text: "इस दर्द का प्रकार कैसा है (जैसे तेज चुभन, भारी दबाव, जलन या लगातार हल्का दर्द)?",
      canonical: "Quality and character of pain.",
    },
    medication_history: {
      domain: "medication_history",
      text: "आप वर्तमान में कौन-सी नियमित दवाएं ले रहे हैं?",
      canonical: "Current medications and dosages.",
    },
    allergy_history: {
      domain: "allergy_history",
      text: "क्या आपको किसी दवा या खाद्य पदार्थ से कोई एलर्जी है?",
      canonical: "Drug and environmental allergies.",
    },
    family_history: {
      domain: "family_history",
      text: "क्या आपके परिवार में किसी को दिल की बीमारी, मधुमेह या उच्च रक्तचाप की समस्या है?",
      canonical: "Family history of cardiovascular or chronic illnesses.",
    },
    lifestyle_social: {
      domain: "lifestyle_social",
      text: "क्या आप धूम्रपान या तंबाकू का सेवन करते हैं?",
      canonical: "Lifestyle habits, substance use, and social history.",
    },
    ayush_pariksha: {
      domain: "ayush_pariksha",
      text: "आपकी भूख, पाचन, नींद और दैनिक ऊर्जा का स्तर कैसा रहता है?",
      canonical: "AYUSH physiological and functional assessment.",
    },
  },
  mr: {
    chief_complaint: {
      domain: "chief_complaint",
      text: "नमस्कार. कृपया सांगा की आज तुम्हाला कोणत्या मुख्य तक्रारी किंवा त्रासामुळे रुग्णालयात यावे लागले?",
      canonical: "What is your chief complaint or primary reason for consultation?",
    },
    hpi_onset: {
      domain: "hpi_onset",
      text: "हा त्रास नेमका कधी सुरू झाला, आणि हा त्रास तुमच्या खांद्याकडे, हाताकडे, मानेकडे किंवा पाठीकडे पसरतो का?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
    },
    associated_symptoms: {
      domain: "associated_symptoms",
      text: "यासोबत तुम्हाला श्वास घेण्यास त्रास, खूप घाम येणे, मळमळ किंवा चक्कर येत आहे का?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
    },
    past_medical_history: {
      domain: "past_medical_history",
      text: "धन्यवाद. तुम्हाला यापूर्वीचा कोणताही आजार (जसे की मधुमेह, रक्तदाब) किंवा नियमित चालू असलेली औषधे आहेत का?",
      canonical: "Past medical history, chronic conditions, and current medications.",
    },
    hpi_severity: {
      domain: "hpi_severity",
      text: "१ ते १० च्या मोजपट्टीवर, हा त्रास सध्या किती तीव्र आहे?",
      canonical: "Pain severity on a numerical rating scale.",
    },
    hpi_character: {
      domain: "hpi_character",
      text: "हा त्रास कसा जाणवतो (उदा. टोचल्यासारखा, छातीवर जड भार, जळजळ किंवा मंद दुखणे)?",
      canonical: "Quality and character of pain.",
    },
    medication_history: {
      domain: "medication_history",
      text: "सध्या तुमची कोणती नियमित औषधे चालू आहेत का?",
      canonical: "Current medications and dosages.",
    },
    allergy_history: {
      domain: "allergy_history",
      text: "तुम्हाला कोणत्याही औषधाची किंवा पदार्थाची ॲलर्जी आहे का?",
      canonical: "Drug and environmental allergies.",
    },
    family_history: {
      domain: "family_history",
      text: "कुटुंबामध्ये कोणाला हृदयरोग, मधुमेह किंवा रक्तदाबाचा त्रास आहे का?",
      canonical: "Family history of cardiovascular or chronic illnesses.",
    },
    lifestyle_social: {
      domain: "lifestyle_social",
      text: "तुम्हाला तंबाखू किंवा इतर कोणतेही व्यसन आहे का?",
      canonical: "Lifestyle habits, substance use, and social history.",
    },
    ayush_pariksha: {
      domain: "ayush_pariksha",
      text: "तुमची भूक, पचनक्रिया, झोप आणि दिवसभरातील ताजेतवानेपणा कसा आहे?",
      canonical: "AYUSH physiological and functional assessment.",
    },
  },
};

export class MockAIProvider implements AIProvider {
  async generateNextQuestion(
    input: GenerateQuestionInput
  ): Promise<StructuredQuestionOutput> {
    const lang = input.language || "en";
    const domain = input.clinicalDomain || "chief_complaint";

    const langQuestions =
      DETERMINISTIC_QUESTIONS[lang] || DETERMINISTIC_QUESTIONS.en;
    const fallback =
      langQuestions[domain] ||
      DETERMINISTIC_QUESTIONS.en[domain] ||
      DETERMINISTIC_QUESTIONS.en.chief_complaint;

    return {
      questionText: fallback.text,
      questionTextCanonical: fallback.canonical,
      clinicalDomain: fallback.domain,
      inputType: "text",
      isAiGenerated: false,
      provider: "mock_deterministic",
    };
  }
}
