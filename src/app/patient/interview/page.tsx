"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, Send, Loader2, RefreshCw } from "lucide-react";
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
} from "@/app/actions/intake";
import { ClinicalDomain, SupportedLanguage } from "@/types/clinical";

const QUESTION_SEQUENCE: Record<
  SupportedLanguage,
  { domain: ClinicalDomain; text: string; canonical: string }[]
> = {
  en: [
    {
      domain: "chief_complaint",
      text: "Hello. Please describe the primary health concern or symptoms that brought you to the clinic today.",
      canonical: "What is your chief complaint or primary reason for consultation?",
    },
    {
      domain: "hpi_onset",
      text: "When exactly did this pain or discomfort start, and does it spread to your shoulder, arm, neck, or back?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
    },
    {
      domain: "associated_symptoms",
      text: "Are you experiencing any shortness of breath, heavy sweating, nausea, or dizziness along with this?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
    },
    {
      domain: "past_medical_history",
      text: "Thank you. Your responses have been recorded. Do you have any diagnosed medical conditions (such as diabetes, hypertension, or heart conditions) or regular medications?",
      canonical: "Past medical history, chronic conditions, and current medications.",
    },
  ],
  hi: [
    {
      domain: "chief_complaint",
      text: "नमस्ते। कृपया बताएं कि आज आप किन मुख्य लक्षणों या स्वास्थ्य परेशानी के लिए परामर्श लेना चाहते हैं?",
      canonical: "What is your chief complaint or primary reason for consultation?",
    },
    {
      domain: "hpi_onset",
      text: "यह दर्द या परेशानी ठीक कब शुरू हुई थी, और क्या यह दर्द आपके कंधे, हाथ, गर्दन या पीठ में भी फैलता है?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
    },
    {
      domain: "associated_symptoms",
      text: "क्या इसके साथ आपको सांस लेने में कठिनाई, अत्यधिक पसीना, जी मिचलाना या चक्कर आ रहे हैं?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
    },
    {
      domain: "past_medical_history",
      text: "धन्यवाद। आपकी जानकारी दर्ज हो गई है। क्या आपको पहले से कोई पुरानी बीमारी (जैसे मधुमेह, उच्च रक्तचाप) है या कोई दवा चल रही है?",
      canonical: "Past medical history, chronic conditions, and current medications.",
    },
  ],
  mr: [
    {
      domain: "chief_complaint",
      text: "नमस्कार. कृपया सांगा की आज तुम्हाला कोणत्या मुख्य तक्रारी किंवा त्रासामुळे रुग्णालयात यावे लागले?",
      canonical: "What is your chief complaint or primary reason for consultation?",
    },
    {
      domain: "hpi_onset",
      text: "हा त्रास नेमका कधी सुरू झाला, आणि हा त्रास तुमच्या खांद्याकडे, हाताकडे, मानेकडे किंवा पाठीकडे पसरतो का?",
      canonical: "Onset, duration, and radiation of primary symptoms.",
    },
    {
      domain: "associated_symptoms",
      text: "यासोबत तुम्हाला श्वास घेण्यास त्रास, खूप घाम येणे, मळमळ किंवा चक्कर येत आहे का?",
      canonical: "Associated symptoms: dyspnea, diaphoresis, nausea, lightheadedness.",
    },
    {
      domain: "past_medical_history",
      text: "धन्यवाद. तुमची माहिती नोंदवली गेली आहे. तुम्हाला यापूर्वीचा कोणताही आजार (जसे की मधुमेह, रक्तदाब) किंवा नियमित चालू असलेली औषधे आहेत का?",
      canonical: "Past medical history, chronic conditions, and current medications.",
    },
  ],
};

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
    setSessionStatus,
  } = useIntake();

  const [inputVal, setInputVal] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const langSeq = QUESTION_SEQUENCE[selectedLanguage] || QUESTION_SEQUENCE.en;

  // 1. Ensure clinical session exists in Supabase
  useEffect(() => {
    let isCancelled = false;

    async function ensureSession() {
      if (sessionId) return;

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
    }

    ensureSession();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, patientProfile, selectedLanguage, mode, consentGranted, setSession]);

  // 2. Initialize first question in messages thread if empty
  useEffect(() => {
    if (messages.length === 0 && langSeq[0]) {
      addMessage({
        sender: "ai",
        text: langSeq[0].text,
        questionDomain: langSeq[0].domain,
      });
    }
  }, [messages.length, langSeq, addMessage]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmittingAnswer]);

  // Determine current step index based on answered patient messages
  const patientAnswerCount = messages.filter((m) => m.sender === "patient").length;

  const handleSendAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = inputVal.trim();
    if (!trimmed || isSubmittingAnswer) return;

    if (!sessionId) {
      setErrorMsg("Session not ready yet. Please wait a moment.");
      return;
    }

    setErrorMsg(null);
    setIsSubmittingAnswer(true);

    const currentStepNum = patientAnswerCount + 1;
    const currentQ = langSeq[Math.min(patientAnswerCount, langSeq.length - 1)];

    // 1. Add patient answer to local state
    addMessage({
      sender: "patient",
      text: trimmed,
      questionDomain: currentQ.domain,
    });
    setInputVal("");

    if (currentStepNum === 1) {
      setChiefComplaint(trimmed);
    }

    // 2. Persist to Supabase through Server Action
    const result = await saveClinicalAnswerAction({
      sessionId,
      stepNumber: currentStepNum,
      questionDomain: currentQ.domain,
      questionText: currentQ.text,
      questionTextCanonical: currentQ.canonical,
      answerText: trimmed,
      language: selectedLanguage,
      inputModality: "text",
    });

    setIsSubmittingAnswer(false);

    if (!result.success) {
      setErrorMsg(result.error || "Failed to save answer to server.");
      return;
    }

    // 3. Trigger next question from clinical sequence
    const nextIdx = patientAnswerCount + 1;
    if (nextIdx < langSeq.length) {
      const nextQ = langSeq[nextIdx];
      addMessage({
        sender: "ai",
        text: nextQ.text,
        questionDomain: nextQ.domain,
      });
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
            Step 5 of 7
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinical Interview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Conversational symptom intake persisted to clinical record.
          </p>
        </div>

        {sessionCode && (
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-xs">
              Session: {sessionCode}
            </Badge>
          </div>
        )}
      </div>

      {errorMsg && (
        <ErrorState
          title="Server Action Error"
          description={errorMsg}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorMsg(null);
                if (!sessionId) {
                  window.location.reload();
                }
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          }
        />
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-sky-600" />
              <CardTitle>Conversational Case Intake</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isInitializing ? (
                <Badge variant="secondary" className="text-[11px] flex items-center gap-1">
                  <LoadingSpinner size="sm" />
                  Connecting...
                </Badge>
              ) : sessionId ? (
                <Badge variant="success" className="text-[11px]">
                  Database Active ✓
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[11px]">
                  Connecting Session
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Patient responses are converted into structured clinical answers and saved directly to the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conversation Thread */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 min-h-[260px] max-h-[420px] overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${
                  m.sender === "patient" ? "justify-end" : "justify-start"
                }`}
              >
                {m.sender !== "patient" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white text-xs font-bold shadow-xs">
                    AI
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 text-sm shadow-xs max-w-lg leading-relaxed ${
                    m.sender === "patient"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  <p>{m.text}</p>
                </div>
                {m.sender === "patient" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold shadow-xs">
                    You
                  </div>
                )}
              </div>
            ))}

            {isSubmittingAnswer && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pl-10 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                <span>Recording clinical answer to Supabase...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Demo Symptom Chips for Convenience */}
          {patientAnswerCount === 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 font-medium mr-1">
                Quick response:
              </span>
              <button
                type="button"
                onClick={() =>
                  setInputVal(
                    selectedLanguage === "mr"
                      ? "मला काल संध्याकाळपासून छातीत तीव्र वेदना आणि श्वास घेण्यास त्रास होत आहे."
                      : selectedLanguage === "hi"
                      ? "मुझे कल शाम से सीने में तेज दर्द और पसीना आ रहा है।"
                      : "I have had severe chest pain since yesterday evening with sweating."
                  )
                }
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                + Severe chest pain with sweating
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendAnswer} className="flex items-center gap-2 pt-2">
            <Input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type your clinical response here..."
              disabled={!sessionId || isSubmittingAnswer || isInitializing}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputVal.trim() || !sessionId || isSubmittingAnswer}
              className="min-w-[90px]"
            >
              {isSubmittingAnswer ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/mode"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back to Mode
          </Link>
          <Link
            href="/patient/documents"
            onClick={handleProceed}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <span>{isNavigating ? "Saving..." : "Proceed to Step 6: Documents"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
