import { ClinicalDomain, SupportedLanguage } from "@/types/clinical";

export interface GenerateQuestionInput {
  language: SupportedLanguage;
  clinicalDomain: ClinicalDomain;
  previousAnswers: {
    questionDomain: ClinicalDomain;
    questionText: string;
    answerText: string;
  }[];
  currentPatientAnswer: string;
  patientProfile?: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
  };
}

export interface StructuredQuestionOutput {
  questionText: string;
  questionTextCanonical: string;
  clinicalDomain: ClinicalDomain;
  inputType: "text" | "voice" | "multiple_choice" | "scale" | "boolean";
  isAiGenerated: boolean;
  provider: "gemini" | "mock_deterministic";
}

export interface AIProvider {
  generateNextQuestion(
    input: GenerateQuestionInput
  ): Promise<StructuredQuestionOutput>;
}
