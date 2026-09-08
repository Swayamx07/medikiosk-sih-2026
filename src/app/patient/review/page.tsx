"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ArrowRight,
  UserCheck,
  FileCheck,
  User,
  Clock,
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
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { useIntake } from "@/context/IntakeContext";
import { updateClinicalSessionStatusAction } from "@/app/actions/intake";

export default function PatientReviewPage() {
  const router = useRouter();
  const {
    sessionId,
    sessionCode,
    patientProfile,
    selectedLanguage,
    mode,
    chiefComplaint,
    messages,
    setSessionStatus,
  } = useIntake();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const patientAnswers = messages.filter((m) => m.sender === "patient");
  const recordedChiefComplaint =
    chiefComplaint ||
    patientAnswers[0]?.text ||
    "Clinical interview responses recorded.";

  const handleSubmit = async () => {
    if (!sessionId) {
      // If no live session ID yet, proceed to doctor view directly
      router.push("/doctor");
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
      setTimeout(() => {
        router.push("/doctor");
      }, 1200);
    } else {
      setErrorMsg(result.error || "Failed to finalize case intake.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Step 7 of 7
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Review &amp; Submit Case Intake
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Review summary of captured patient information before transferring to physician workstation.
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

      {isSubmitted && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Case Intake Successfully Submitted</h4>
            <p className="text-xs text-emerald-700">
              Session code {sessionCode || "generated"} is now available in the physician triage queue. Redirecting...
            </p>
          </div>
        </div>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <CardTitle>Case Intake Verification</CardTitle>
            </div>
            <Badge variant="success" className="text-[10px]">
              {isSubmitted ? "Ready for Physician Review" : "Ready for Submission"}
            </Badge>
          </div>
          <CardDescription>
            Your case information will be submitted to the physician queue with appropriate clinical priority.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient Details Summary */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-900">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-sky-600" />
                <span>Patient Profile</span>
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
                Recorded Chief Complaint:
              </span>
              <p className="rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-800 italic">
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
            &larr; Back to Documents
          </Link>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="md"
            disabled={isSubmitting || isSubmitted}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Submitting to Queue...</span>
              </>
            ) : isSubmitted ? (
              <>
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span>Submitted! Redirecting...</span>
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 text-sky-400" />
                <span>Finish &amp; Submit to Doctor Queue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
