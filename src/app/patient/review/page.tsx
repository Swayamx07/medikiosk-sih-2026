"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ArrowRight,
  UserCheck,
  User,
  Clock,
  CheckCircle2,
  RefreshCw,
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
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { useIntake } from "@/context/IntakeContext";
import { updateClinicalSessionStatusAction } from "@/app/actions/intake";
import { PATIENT_I18N } from "@/lib/clinical/i18n";

export default function PatientReviewPage() {
  const router = useRouter();
  const {
    sessionId,
    sessionCode,
    patientProfile,
    selectedLanguage,
    mode,
    chiefComplaint,
    confirmedChiefComplaint,
    messages,
    setSessionStatus,
    startNewEncounter,
  } = useIntake();

  const i18n = PATIENT_I18N[selectedLanguage] || PATIENT_I18N.en;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const patientAnswers = messages.filter((m) => m.sender === "patient");
  const recordedChiefComplaint =
    confirmedChiefComplaint ||
    chiefComplaint ||
    patientAnswers[0]?.text ||
    "Clinical interview responses recorded.";

  const handleSubmit = async () => {
    if (!sessionId) {
      setErrorMsg("No active clinical session found to submit.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await updateClinicalSessionStatusAction({
      sessionId,
      status: "ready_for_review",
      chiefComplaint: recordedChiefComplaint,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSessionStatus("ready_for_review");
      setIsSubmitted(true);
    } else {
      setErrorMsg(result.error || "Failed to finalize case intake.");
    }
  };

  const handleStartNewIntake = () => {
    startNewEncounter({ keepPatientProfile: false });
    router.push("/patient");
  };

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          {i18n.steps.step7}
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {i18n.review.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {i18n.review.subtitle}
        </p>
      </div>

      {errorMsg && (
        <ErrorState
          title="Submission Error"
          description={errorMsg}
          action={
            <Button variant="outline" size="sm" onClick={handleSubmit}>
              Try Again
            </Button>
          }
        />
      )}

      {/* SUCCESS COMPLETION RECEIPT (Strictly patient-facing, never redirects to /doctor) */}
      {isSubmitted ? (
        <Card className="border-2 border-emerald-300 bg-emerald-50/60 shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl text-emerald-950 font-bold">
              {i18n.review.successReceiptTitle}
            </CardTitle>
            <CardDescription className="text-emerald-800 text-sm max-w-md mx-auto">
              {i18n.review.successReceiptDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 text-center">
            <div className="inline-block rounded-xl border border-emerald-300 bg-white px-6 py-3 shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block mb-0.5">
                Session Token / Encounter ID
              </span>
              <span className="text-xl font-mono font-bold text-slate-900 tracking-wider">
                {sessionCode || sessionId?.substring(0, 8).toUpperCase() || "REGISTERED"}
              </span>
            </div>

            <div className="rounded-lg bg-emerald-100/70 border border-emerald-200 p-3.5 max-w-lg mx-auto text-xs text-emerald-900 leading-relaxed font-medium">
              {i18n.review.waitingAreaNote}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-emerald-200/60 pt-4 pb-6">
            <Button
              type="button"
              onClick={handleStartNewIntake}
              variant="primary"
              size="lg"
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white cursor-pointer px-6"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{i18n.review.startNewIntakeButton}</span>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <CardTitle>{i18n.review.cardTitle}</CardTitle>
              </div>
              <Badge variant="info" className="text-[10px]">
                Ready for Submission
              </Badge>
            </div>
            <CardDescription>
              {i18n.review.cardDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient Details Summary */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-sky-600" />
                  <span>{i18n.review.patientProfileTitle}</span>
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {patientProfile.patientIdentifier}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500">Full Name: </span>
                  <span className="font-semibold text-slate-800">{patientProfile.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500">DOB / Gender: </span>
                  <span className="font-semibold text-slate-800">
                    {patientProfile.dateOfBirth} ({patientProfile.gender})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Primary Language: </span>
                  <span className="font-semibold uppercase text-slate-800">{selectedLanguage}</span>
                </div>
                <div>
                  <span className="text-slate-500">ABHA / Demo ID: </span>
                  <span className="font-semibold text-slate-800">
                    {patientProfile.abhaId || "Not Registered"}
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical Session Summary */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-sky-600" />
                  <span>Encounter Information</span>
                </span>
                <Badge variant="info" className="text-[10px]">
                  {sessionCode || "Pending"}
                </Badge>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Discipline Mode:</span>
                  <span className="font-medium text-slate-800 capitalize">
                    {mode === "ayush" ? "AYUSH Intake Mode" : "General OPD / Allopathy"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded Responses:</span>
                  <span className="font-medium text-slate-800">
                    {patientAnswers.length} clinical interview answers
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Clinical Safety Check:</span>
                  <span className="font-medium text-slate-800">
                    Deterministic Red-Flag Filter Active
                  </span>
                </div>
              </div>

              {/* Chief Complaint Highlight */}
              <div className="pt-2 border-t border-slate-200 mt-2">
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {i18n.review.chiefComplaintTitle}
                </span>
                <p className="rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-medium">
                  &ldquo;{recordedChiefComplaint}&rdquo;
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
            <Link
              href="/patient/documents"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              &larr; {i18n.navigation.back}
            </Link>
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="gap-2 bg-slate-900 hover:bg-slate-800 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>{i18n.review.submittingButton}</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 text-sky-400" />
                  <span>{i18n.review.submitButton}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
