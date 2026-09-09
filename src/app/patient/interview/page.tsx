"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  FileText,
  Mic,
  MicOff,
  AlertTriangle,
  Edit3,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { useIntake } from "@/context/IntakeContext";
import {
  createOrResumeClinicalSessionAction,
  saveClinicalAnswerAction,
  updateClinicalSessionStatusAction,
  getSessionHistoryAction,
  generateNextQuestionAction,
  confirmChiefComplaintAction,
} from "@/app/actions/intake";
import { cleanChiefComplaint } from "@/lib/clinical/cleaner";
import { PATIENT_I18N } from "@/lib/clinical/i18n";
import { ClinicalDomain, SupportedLanguage, TriageEvaluationResult } from "@/types/clinical";

const QUESTION_SEQUENCE: Record<
  SupportedLanguage,
  {
    domain: ClinicalDomain;
    domainLabel: string;
    text: string;
    canonical: string;
    quickResponse: string;
  }[]
> = {
  en: [
    {
      domain: "chief_complaint",
      domainLabel: "Chief Complaint",
      text: "Hello. Please describe the primary health concern or symptoms that brought you to the clinic today.",
      canonical: "What is your chief complaint or primary reason for consultation?",
      quickResponse: "Severe chest pain since yesterday evening with sweating.",
    },
    {
      domain: "hpi_onset",
      domainLabel: "Onset & Radiation",
      text: "When exactly did this pain or discomfort start, and does it spread to your shoulder, arm, neck, or back?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
      quickResponse: "Started 14 hours ago, radiates to left shoulder and arm.",
    },
    {
      domain: "associated_symptoms",
      domainLabel: "Associated Symptoms",
      text: "Are you experiencing any shortness of breath, heavy sweating, nausea, or dizziness along with this?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
      quickResponse: "Shortness of breath and heavy sweating, no nausea.",
    },
    {
      domain: "past_medical_history",
      domainLabel: "Medical History & Medications",
      text: "Thank you. Do you have any diagnosed conditions (such as diabetes, hypertension, or heart conditions) or regular medications?",
      canonical: "Past medical history, chronic conditions, and current medications.",
      quickResponse: "Hypertension for 5 years, taking Amlodipine 5mg daily.",
    },
  ],
  hi: [
    {
      domain: "chief_complaint",
      domainLabel: "मुख्य समस्या",
      text: "नमस्ते। कृपया बताएं कि आज आप किन मुख्य लक्षणों या स्वास्थ्य परेशानी के लिए परामर्श लेना चाहते हैं?",
      canonical: "What is your chief complaint or primary reason for consultation?",
      quickResponse: "मुझे कल शाम से सीने में तेज दर्द और पसीना आ रहा है।",
    },
    {
      domain: "hpi_onset",
      domainLabel: "शुरुआत और फैलाव",
      text: "यह दर्द या परेशानी ठीक कब शुरू हुई थी, और क्या यह दर्द आपके कंधे, हाथ, गर्दन या पीठ में भी फैलता है?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
      quickResponse: "14 घंटे पहले शुरू हुआ, बाएं हाथ और कंधे में फैलता है।",
    },
    {
      domain: "associated_symptoms",
      domainLabel: "संबंधित लक्षण",
      text: "क्या इसके साथ आपको सांस लेने में कठिनाई, अत्यधिक पसीना, जी मिचलाना या चक्कर आ रहे हैं?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
      quickResponse: "सांस लेने में तकलीफ और बहुत पसीना आ रहा है।",
    },
    {
      domain: "past_medical_history",
      domainLabel: "पिछला इतिहास और दवाएं",
      text: "धन्यवाद। क्या आपको पहले से कोई पुरानी बीमारी (जैसे मधुमेह, उच्च रक्तचाप) है या कोई नियमित दवा चल रही है?",
      canonical: "Past medical history, chronic conditions, and current medications.",
      quickResponse: "उच्च रक्तचाप की समस्या है, नियमित दवा ले रहा हूँ।",
    },
  ],
  mr: [
    {
      domain: "chief_complaint",
      domainLabel: "मुख्य तक्रार",
      text: "नमस्कार. कृपया सांगा की आज तुम्हाला कोणत्या मुख्य तक्रारी किंवा त्रासामुळे रुग्णालयात यावे लागले?",
      canonical: "What is your chief complaint or primary reason for consultation?",
      quickResponse: "मला काल संध्याकाळपासून छातीत तीव्र वेदना आणि श्वास घेण्यास त्रास होत आहे.",
    },
    {
      domain: "hpi_onset",
      domainLabel: "सुरुवात आणि प्रसार",
      text: "हा त्रास नेमका कधी सुरू झाला, आणि हा त्रास तुमच्या खांद्याकडे, हाताकडे, मानेकडे किंवा पाठीकडे पसरतो का?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
      quickResponse: "१४ तासांपूर्वी सुरू झाला, डाव्या खांद्याकडे आणि हाताकडे पसरतो.",
    },
    {
      domain: "associated_symptoms",
      domainLabel: "संबंधित लक्षणे",
      text: "यासोबत तुम्हाला श्वास घेण्यास त्रास, खूप घाम येणे, मळमळ किंवा चक्कर येत आहे का?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
      quickResponse: "श्वास घेण्यास त्रास आणि खूप घाम येत आहे.",
    },
    {
      domain: "past_medical_history",
      domainLabel: "मागील आजार आणि औषधे",
      text: "धन्यवाद. तुम्हाला यापूर्वीचा कोणताही आजार (जसे की मधुमेह, रक्तदाब) किंवा नियमित चालू असलेली औषधे आहेत का?",
      canonical: "Past medical history, chronic conditions, and current medications.",
      quickResponse: "५ वर्षांपासून उच्च रक्तदाब आहे, नियमित गोळ्या चालू आहेत.",
    },
  ],
};

const SPEECH_LANG_MAP: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
}

function getSpeechRecognitionConstructor(): { new (): ISpeechRecognition } | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: { new (): ISpeechRecognition };
    webkitSpeechRecognition?: { new (): ISpeechRecognition };
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export default function PatientInterviewPage() {
  const {
    sessionId,
    sessionCode,
    setSession,
    patientProfile,
    selectedLanguage,
    mode,
    consentGranted,
    messages,
    addMessage,
    setChiefComplaint,
    setConfirmedChiefComplaint,
    setSessionStatus,
  } = useIntake();

  const i18n = PATIENT_I18N[selectedLanguage] || PATIENT_I18N.en;

  const [inputVal, setInputVal] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [triageNotice, setTriageNotice] = useState<TriageEvaluationResult | null>(null);

  // Chief Complaint Confirmation State
  const [isConfirmingChiefComplaint, setIsConfirmingChiefComplaint] = useState(false);
  const [proposedChiefComplaint, setProposedChiefComplaint] = useState("");
  const [isEditingConfirmation, setIsEditingConfirmation] = useState(false);
  const [isSubmittingConfirmation, setIsSubmittingConfirmation] = useState(false);

  // Web Speech API Voice States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [usedVoiceForCurrentAnswer, setUsedVoiceForCurrentAnswer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const baseInputTextRef = useRef<string>("");

  // Speech recognition cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startSpeechRecognition = (isConfirmEdit: boolean = false) => {
    const SpeechCtor = getSpeechRecognitionConstructor();
    if (!SpeechCtor) {
      setSpeechError(
        "Speech recognition is not supported in this browser. Please type your answer."
      );
      return;
    }

    stopSpeechRecognition();
    setSpeechError(null);

    try {
      const recognition = new SpeechCtor();
      const targetLang = SPEECH_LANG_MAP[selectedLanguage] || "en-IN";
      recognition.lang = targetLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      // Preserve existing text in input box
      baseInputTextRef.current = isConfirmEdit
        ? proposedChiefComplaint.trim()
        : inputVal.trim();

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        if (!isConfirmEdit) {
          setUsedVoiceForCurrentAnswer(true);
        }
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const trimmed = transcript.trim();
        const base = baseInputTextRef.current;
        const combined = base ? `${base} ${trimmed}` : trimmed;

        if (isConfirmEdit) {
          setProposedChiefComplaint(combined);
        } else {
          setInputVal(combined);
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        setIsListening(false);
        const errType = event.error;
        if (errType === "not-allowed" || errType === "permission-denied") {
          setSpeechError(
            "Microphone permission was denied. You can continue typing your answer."
          );
        } else if (errType === "no-speech") {
          setSpeechError(
            "No speech was detected. You can speak again or type your answer."
          );
        } else if (errType === "audio-capture") {
          setSpeechError(
            "Microphone not detected. Please type your answer below."
          );
        } else if (errType !== "aborted") {
          setSpeechError(`Voice notice (${errType}). You can continue by typing.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isConfirmEdit) {
          confirmInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setIsListening(false);
      setSpeechError(
        "Unable to start microphone speech recognition. Please type your response."
      );
      console.warn("Speech recognition start error:", err);
    }
  };

  const toggleSpeechRecognition = (isConfirmEdit: boolean = false) => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition(isConfirmEdit);
    }
  };

  const langSeq = QUESTION_SEQUENCE[selectedLanguage] || QUESTION_SEQUENCE.en;

  // 1. Session initialization & fallback history restoration
  useEffect(() => {
    let isCancelled = false;

    async function initSessionAndHistory() {
      // If no session exists yet, create one
      if (!sessionId) {
        setIsInitializing(true);
        setErrorMsg(null);

        const res = await createOrResumeClinicalSessionAction({
          patientProfile,
          language: selectedLanguage,
          mode,
          consentGranted,
          existingSessionId: sessionId,
        });

        if (isCancelled) return;
        setIsInitializing(false);

        if (res.success && res.sessionId && res.sessionCode) {
          setSession(res.sessionId, res.sessionCode);
        } else {
          setErrorMsg(res.error || "Failed to initialize clinical session.");
        }
        return;
      }

      // If session exists but messages array is empty (e.g. storage cleared on refresh)
      if (sessionId && messages.length === 0) {
        setIsInitializing(true);
        const historyRes = await getSessionHistoryAction(sessionId);

        if (isCancelled) return;
        setIsInitializing(false);

        if (historyRes.success && historyRes.history && historyRes.history.length > 0) {
          // Restore past question-and-answer pairs
          historyRes.history.forEach((h) => {
            addMessage({
              sender: "ai",
              text: h.questionText,
              questionDomain: h.questionDomain,
            });
            addMessage({
              sender: "patient",
              text: h.answerText,
              questionDomain: h.questionDomain,
            });
          });

          if (historyRes.chiefComplaint) {
            setChiefComplaint(historyRes.chiefComplaint);
            setConfirmedChiefComplaint(historyRes.chiefComplaint);
          }

          if (historyRes.triageAlert?.triggered) {
            setTriageNotice(historyRes.triageAlert);
          }

          // If there are remaining unanswered questions, present the next active question
          const restoredCount = historyRes.history.length;
          if (restoredCount < langSeq.length) {
            addMessage({
              sender: "ai",
              text: langSeq[restoredCount].text,
              questionDomain: langSeq[restoredCount].domain,
            });
          }
        }
      }
    }

    initSessionAndHistory();

    return () => {
      isCancelled = true;
    };
  }, [
    sessionId,
    messages.length,
    patientProfile,
    selectedLanguage,
    mode,
    consentGranted,
    langSeq,
    setSession,
    addMessage,
    setChiefComplaint,
    setConfirmedChiefComplaint,
  ]);

  // 2. Present first question if messages thread is brand new
  useEffect(() => {
    if (messages.length === 0 && langSeq[0] && !isInitializing) {
      addMessage({
        sender: "ai",
        text: langSeq[0].text,
        questionDomain: langSeq[0].domain,
      });
    }
  }, [messages.length, langSeq, isInitializing, addMessage]);

  // 3. Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting, isConfirmingChiefComplaint]);

  // Count patient responses to determine progression
  const patientAnswerCount = messages.filter((m) => m.sender === "patient").length;
  const isInterviewComplete = patientAnswerCount >= langSeq.length;
  const currentQuestionIdx = Math.min(patientAnswerCount, langSeq.length - 1);
  const activeQuestion = langSeq[currentQuestionIdx];

  // Submit Answer handler
  const handleSendAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isInitializing || isConfirmingChiefComplaint) return;

    if (isListening) {
      stopSpeechRecognition();
    }

    const trimmed = inputVal.trim();
    if (!trimmed) return;

    if (!sessionId) {
      setErrorMsg("Session not ready yet. Please wait a moment.");
      return;
    }

    if (isInterviewComplete) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    const stepNum = patientAnswerCount + 1;
    const targetQ = langSeq[patientAnswerCount];
    const answerModality = usedVoiceForCurrentAnswer ? "voice_browser" : "text";

    // 1. Persist to Supabase BEFORE advancing state
    const result = await saveClinicalAnswerAction({
      sessionId,
      stepNumber: stepNum,
      questionDomain: targetQ.domain,
      questionText: targetQ.text,
      questionTextCanonical: targetQ.canonical,
      answerText: trimmed,
      language: selectedLanguage,
      inputModality: answerModality,
    });

    setIsSubmitting(false);

    // 2. Reliability guard: Never advance if database save fails
    if (!result.success) {
      setErrorMsg(result.error || "Failed to save answer to clinical record. Please try again.");
      return;
    }

    // Reset voice flag for subsequent question
    setUsedVoiceForCurrentAnswer(false);

    // If server action detected a red flag, surface non-diagnostic advisory
    if (result.triageAlert?.triggered) {
      setTriageNotice(result.triageAlert);
    }

    // 3. On successful persistence, update conversation history with exact verbatim response
    addMessage({
      sender: "patient",
      text: trimmed,
      questionDomain: targetQ.domain,
    });
    setInputVal("");

    // CRITICAL: Chief Complaint Confirmation must happen BEFORE advancing from Q1 to Q2
    if (stepNum === 1) {
      const normalizedComplaint =
        result.cleanedChiefComplaint || cleanChiefComplaint(trimmed, selectedLanguage);
      setProposedChiefComplaint(normalizedComplaint);
      setIsConfirmingChiefComplaint(true);
      setIsEditingConfirmation(false);
      return;
    }

    // 4. Advance to the next question for Q2, Q3, Q4
    const nextIdx = patientAnswerCount + 1;
    if (nextIdx < langSeq.length) {
      const fallbackQ = langSeq[nextIdx];
      let nextQuestionText = fallbackQ.text;
      let nextDomain = fallbackQ.domain;

      try {
        const prevDialogue = messages
          .filter((m) => m.sender === "patient")
          .map((m, idx) => ({
            questionDomain: m.questionDomain || "chief_complaint",
            questionText:
              messages.filter((x) => x.sender === "ai")[idx]?.text || "",
            answerText: m.text,
          }))
          .concat([
            {
              questionDomain: targetQ.domain,
              questionText: targetQ.text,
              answerText: trimmed,
            },
          ]);

        const aiRes = await generateNextQuestionAction({
          language: selectedLanguage,
          clinicalDomain: fallbackQ.domain,
          previousAnswers: prevDialogue,
          currentPatientAnswer: trimmed,
          patientProfile: {
            fullName: patientProfile.fullName,
            gender: patientProfile.gender,
            dateOfBirth: patientProfile.dateOfBirth,
          },
        });

        if (aiRes.success && aiRes.question?.questionText) {
          nextQuestionText = aiRes.question.questionText;
          nextDomain = aiRes.question.clinicalDomain || fallbackQ.domain;
        }
      } catch (err) {
        console.warn("AI generation failed, using safety question:", err);
      }

      addMessage({
        sender: "ai",
        text: nextQuestionText,
        questionDomain: nextDomain,
      });
    } else {
      // Final question answered: update session status to interview_complete
      await updateClinicalSessionStatusAction({
        sessionId,
        status: "interview_complete",
      });
      setSessionStatus("interview_complete");
    }

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Chief Complaint Confirmation handler
  const handleConfirmChiefComplaint = async () => {
    if (isListening) {
      stopSpeechRecognition();
    }

    const finalComplaint = proposedChiefComplaint.trim();
    if (!finalComplaint || !sessionId) return;

    setIsSubmittingConfirmation(true);
    setErrorMsg(null);

    const updateRes = await confirmChiefComplaintAction({
      sessionId,
      confirmedComplaint: finalComplaint,
    });

    setIsSubmittingConfirmation(false);

    if (!updateRes.success) {
      setErrorMsg(updateRes.error || "Failed to confirm chief complaint. Please try again.");
      return;
    }

    // Persist in context
    setConfirmedChiefComplaint(finalComplaint);
    setChiefComplaint(finalComplaint);
    setIsConfirmingChiefComplaint(false);
    setIsEditingConfirmation(false);

    // NOW advance to Question 2!
    const nextIdx = 1;
    if (nextIdx < langSeq.length) {
      const fallbackQ = langSeq[nextIdx];
      let nextQuestionText = fallbackQ.text;
      let nextDomain = fallbackQ.domain;

      try {
        const prevDialogue = [
          {
            questionDomain: langSeq[0].domain,
            questionText: langSeq[0].text,
            answerText: finalComplaint,
          },
        ];

        const aiRes = await generateNextQuestionAction({
          language: selectedLanguage,
          clinicalDomain: fallbackQ.domain,
          previousAnswers: prevDialogue,
          currentPatientAnswer: finalComplaint,
          patientProfile: {
            fullName: patientProfile.fullName,
            gender: patientProfile.gender,
            dateOfBirth: patientProfile.dateOfBirth,
          },
        });

        if (aiRes.success && aiRes.question?.questionText) {
          nextQuestionText = aiRes.question.questionText;
          nextDomain = aiRes.question.clinicalDomain || fallbackQ.domain;
        }
      } catch (err) {
        console.warn("AI generation failed, using safety question:", err);
      }

      addMessage({
        sender: "ai",
        text: nextQuestionText,
        questionDomain: nextDomain,
      });
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleProceed = async () => {
    if (sessionId) {
      setIsNavigating(true);
      await updateClinicalSessionStatusAction({
        sessionId,
        status: "interview_complete",
      });
      setSessionStatus("interview_complete");
      setIsNavigating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Step Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
            {i18n.steps.step5}
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {i18n.interview.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {i18n.interview.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sessionCode && (
            <Badge variant="info" className="text-xs font-mono">
              Session: {sessionCode}
            </Badge>
          )}
          <Badge
            variant={isInterviewComplete ? "success" : "secondary"}
            className="text-xs"
          >
            {isInterviewComplete
              ? "All Questions Completed ✓"
              : `Question ${patientAnswerCount + 1} of ${langSeq.length}`}
          </Badge>
        </div>
      </div>

      {/* Non-Diagnostic Clinical Safety Advisory Notice */}
      {triageNotice?.triggered && triageNotice.alertLevel === "critical_red_flag" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-xs"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-900">
              Clinical Care Notice
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Important: Your symptoms may require prompt medical attention. Please follow the instructions provided by the clinic or notify the attendant.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert with Retry */}
      {errorMsg && (
        <ErrorState
          title="Persistence Error"
          description={errorMsg}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorMsg(null);
                if (!sessionId) {
                  window.location.reload();
                } else if (inputVal.trim()) {
                  handleSendAnswer();
                }
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry Save
            </Button>
          }
        />
      )}

      {/* Main Conversational Card */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-sky-600" />
              <CardTitle>Case History Dialogue</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isInitializing ? (
                <Badge variant="secondary" className="text-[11px] flex items-center gap-1">
                  <LoadingSpinner size="sm" />
                  Connecting Session...
                </Badge>
              ) : sessionId ? (
                <Badge variant="success" className="text-[11px]">
                  Database Connected ✓
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[11px]">
                  Connecting...
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Please answer each question clearly. Responses are securely saved to your clinical record.
          </CardDescription>

          {/* Question Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-sky-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((patientAnswerCount / langSeq.length) * 100, 100)}%`,
              }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Conversational Message Thread */}
          <div
            role="log"
            aria-live="polite"
            className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3.5 min-h-[300px] max-h-[440px] overflow-y-auto"
          >
            {messages.map((m, idx) => {
              const isPatient = m.sender === "patient";

              return (
                <div
                  key={m.id || idx}
                  className={`flex items-start gap-2.5 ${
                    isPatient ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* AI Avatar */}
                  {!isPatient && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white text-[11px] font-bold shadow-xs mt-0.5">
                      AI
                    </div>
                  )}

                  <div className="space-y-1 max-w-lg">
                    {/* Domain label for AI questions */}
                    {!isPatient && m.questionDomain && (
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-sky-700 block px-1">
                        {m.questionDomain.replace(/_/g, " ")}
                      </span>
                    )}

                    <div
                      className={`rounded-xl p-3.5 text-sm leading-relaxed shadow-xs ${
                        isPatient
                          ? "bg-slate-900 text-white rounded-tr-none"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                      }`}
                    >
                      <p>{m.text}</p>
                    </div>

                    {/* Patient confirmation tag */}
                    {isPatient && (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1 px-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Saved to encounter record</span>
                      </span>
                    )}
                  </div>

                  {/* Patient Avatar */}
                  {isPatient && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-[11px] font-bold shadow-xs mt-0.5">
                      You
                    </div>
                  )}
                </div>
              );
            })}

            {/* In-flight saving indicator */}
            {isSubmitting && (
              <div className="flex items-center gap-2 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-lg p-2.5 max-w-xs ml-9 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600 shrink-0" />
                <span>Saving response to Supabase...</span>
              </div>
            )}

            {/* CHIEF COMPLAINT CONFIRMATION CARD (Step 1 -> Step 2 Gate) */}
            {isConfirmingChiefComplaint && (
              <div className="rounded-xl border-2 border-sky-400 bg-white p-4 shadow-md space-y-3 mt-4 ml-9 animate-in fade-in duration-300">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {i18n.interview.chiefComplaintConfirmTitle}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {i18n.interview.chiefComplaintConfirmDesc}
                      </p>
                    </div>
                  </div>
                  <Badge variant="info" className="text-[10px] shrink-0">
                    Step 1 Verification
                  </Badge>
                </div>

                {isEditingConfirmation ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        ref={confirmInputRef}
                        value={proposedChiefComplaint}
                        onChange={(e) => setProposedChiefComplaint(e.target.value)}
                        placeholder="Edit your chief complaint statement..."
                        className="text-sm bg-white"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant={isListening ? "destructive" : "outline"}
                        size="md"
                        onClick={() => toggleSpeechRecognition(true)}
                        className={isListening ? "bg-rose-600 text-white animate-pulse" : ""}
                        title="Edit via speech"
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-sky-600" />}
                      </Button>
                    </div>
                    {isListening && (
                      <p className="text-[11px] text-rose-600 animate-pulse">
                        Listening... speak your corrected complaint.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-sm font-medium text-slate-800">
                    &ldquo;{proposedChiefComplaint}&rdquo;
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  {!isEditingConfirmation ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingConfirmation(true)}
                      className="text-xs gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                      <span>{i18n.interview.editButton}</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingConfirmation(false)}
                      className="text-xs"
                    >
                      Done Editing
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingConfirmation || !proposedChiefComplaint.trim()}
                    onClick={handleConfirmChiefComplaint}
                    className="text-xs gap-1.5 bg-sky-700 hover:bg-sky-800 text-white"
                  >
                    {isSubmittingConfirmation ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{i18n.interview.confirmButton}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Completion Banner inside chat when all 4 questions are done */}
            {isInterviewComplete && !isSubmitting && !isConfirmingChiefComplaint && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-950 space-y-2 mt-4 ml-9">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Clinical Case Intake Complete</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  All {langSeq.length} standard intake questions have been recorded and saved. You can proceed to upload previous documents or proceed directly to review and physician transfer.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <Link
                    href="/patient/documents"
                    onClick={handleProceed}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Upload Documents (Optional)</span>
                  </Link>
                  <Link
                    href="/patient/review"
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                  >
                    <span>Proceed to Review &rarr;</span>
                  </Link>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chip for current question */}
          {!isInterviewComplete && !isConfirmingChiefComplaint && activeQuestion && (
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Suggested answer:</span>
              </span>
              <button
                type="button"
                onClick={() => setInputVal(activeQuestion.quickResponse)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-colors text-left cursor-pointer"
              >
                &ldquo;{activeQuestion.quickResponse}&rdquo;
              </button>
            </div>
          )}

          {/* Voice Listening Status Banner */}
          {isListening && !isConfirmingChiefComplaint && (
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200 text-rose-900 rounded-lg px-3 py-2 text-xs transition-all">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span className="font-semibold">
                  Listening in {selectedLanguage === "hi" ? "Hindi (hi-IN)" : selectedLanguage === "mr" ? "Marathi (mr-IN)" : "English (en-IN)"}...
                </span>
                <span className="text-rose-700 hidden sm:inline">
                  Speak into your microphone. You can edit the text before sending.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stopSpeechRecognition}
                className="h-6 text-[11px] px-2 text-rose-700 border-rose-300 hover:bg-rose-100"
              >
                Done Speaking
              </Button>
            </div>
          )}

          {/* Voice Error Notice (Dismissible, Never blocks typed input) */}
          {speechError && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 text-xs">
              <span className="leading-tight">{speechError}</span>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-amber-800 hover:text-amber-950 font-bold ml-2 text-xs px-1 cursor-pointer"
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          )}

          {/* Conversational Input Form */}
          <form onSubmit={handleSendAnswer} className="flex items-center gap-2 pt-1">
            <Input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                isConfirmingChiefComplaint
                  ? "Please confirm your chief complaint above to proceed..."
                  : isInterviewComplete
                  ? "Interview complete. Click Proceed below to continue."
                  : isListening
                  ? `${i18n.interview.voiceListening}`
                  : `Type or speak your answer for ${activeQuestion?.domainLabel || "this question"}...`
              }
              disabled={
                !sessionId ||
                isSubmitting ||
                isInitializing ||
                isInterviewComplete ||
                isConfirmingChiefComplaint
              }
              className="flex-1"
            />

            {/* Microphone Web Speech Button */}
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="md"
              onClick={() => toggleSpeechRecognition(false)}
              disabled={
                !sessionId ||
                isSubmitting ||
                isInitializing ||
                isInterviewComplete ||
                isConfirmingChiefComplaint
              }
              title={
                isListening
                  ? `Listening (${SPEECH_LANG_MAP[selectedLanguage]}). Click to stop.`
                  : `Speak your answer in ${
                      selectedLanguage === "hi"
                        ? "Hindi (hi-IN)"
                        : selectedLanguage === "mr"
                        ? "Marathi (mr-IN)"
                        : "English (en-IN)"
                    }`
              }
              className={`transition-all ${
                isListening
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 animate-pulse ring-2 ring-rose-300"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-300"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1 text-xs">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 text-sky-600" />
                  <span className="hidden sm:inline ml-1 text-xs">{i18n.interview.voiceStart}</span>
                </>
              )}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={
                !inputVal.trim() ||
                !sessionId ||
                isSubmitting ||
                isInterviewComplete ||
                isConfirmingChiefComplaint
              }
              className="min-w-[96px]"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span>{i18n.interview.sendButton}</span>
                  <Send className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        {/* Footer Navigation */}
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/mode"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; {i18n.navigation.back}
          </Link>
          <Link
            href="/patient/documents"
            onClick={handleProceed}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <span>{isNavigating ? "Saving..." : i18n.interview.proceedToDocs}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
