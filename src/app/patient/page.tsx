"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Globe, Shield, User, Stethoscope, RefreshCw, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useIntake } from "@/context/IntakeContext";

export default function PatientPortalPage() {
  const { sessionId, sessionCode, sessionStatus, startNewEncounter } = useIntake();

  // If stored session belongs to completed/closed encounter, clear encounter-scoped state
  useEffect(() => {
    if (sessionStatus === "ready_for_review" || sessionStatus === "verified") {
      startNewEncounter({ keepPatientProfile: false });
    }
  }, [sessionStatus, startNewEncounter]);

  const hasUnfinishedSession =
    Boolean(sessionId) &&
    sessionStatus !== "ready_for_review" &&
    sessionStatus !== "verified";

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 border-sky-300 bg-sky-50 text-sky-800">
          SIH MediKiosk
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome to Patient Case-Taking
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          MediKiosk will assist you in capturing your symptoms, health history, and medical documents before meeting your physician.
        </p>
      </div>

      {hasUnfinishedSession && (
        <div className="rounded-xl border-2 border-sky-300 bg-sky-50/70 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-sky-600" />
              <h4 className="text-sm font-bold text-slate-900">
                In-Progress Intake Session Detected
              </h4>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Encounter {sessionCode || sessionId?.substring(0, 8)} is currently active.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => startNewEncounter({ keepPatientProfile: false })}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Start Fresh Visit</span>
            </Button>
            <Link
              href="/patient/interview"
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 shadow-xs"
            >
              <span>Resume Intake &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Standard Intake Workflow</CardTitle>
          <CardDescription>
            The intake flow consists of 7 structured steps designed for clarity and safety.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <Globe className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Language Preference</h4>
              <p className="text-xs text-slate-500">Choice between English, Hindi (हिंदी), and Marathi (मराठी).</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Informed Consent</h4>
              <p className="text-xs text-slate-500">Explicit consent required for every encounter. Never pre-granted.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <User className="h-5 w-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Patient Identification</h4>
              <p className="text-xs text-slate-500">Patient identity is preserved across multiple clinical visits.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <Stethoscope className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Clinical Mode & Interview</h4>
              <p className="text-xs text-slate-500">Conversational intake with chief complaint verification & deterministic safety triage.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
          <Link
            href="/patient/language"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <span>Proceed to Step 1: Language</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
