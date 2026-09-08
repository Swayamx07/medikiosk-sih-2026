"use client";

import Link from "next/link";
import { ArrowRight, Stethoscope, Sparkles, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useIntake } from "@/context/IntakeContext";
import { cn } from "@/lib/utils";

export default function PatientModePage() {
  const { mode, setMode } = useIntake();

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Step 4 of 7
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Select Clinical Intake Mode
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose the consultation discipline to adapt clinical questionnaire and terminology.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Intake Discipline</CardTitle>
          <CardDescription>
            Different medical systems evaluate symptoms according to their specific clinical methodologies.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* General OPD */}
          <button
            type="button"
            onClick={() => setMode("general")}
            className={cn(
              "flex flex-col justify-between rounded-lg border p-4 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600",
              mode === "general"
                ? "border-2 border-sky-600 bg-sky-50/30 shadow-xs ring-1 ring-sky-600/30"
                : "border-slate-200 hover:border-slate-300 bg-white"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-sky-600" />
                  <h4 className="text-base font-semibold text-slate-900">
                    General OPD / Allopathy
                  </h4>
                </div>
                {mode === "general" && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard clinical symptom inquiry: onset, duration, severity, red-flag triage, and medication history.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
              <Badge variant="info" className="text-[10px]">
                Primary SIH Workflow
              </Badge>
              <span className="text-xs font-medium text-sky-700">
                {mode === "general" ? "Active Mode ✓" : "Select"}
              </span>
            </div>
          </button>

          {/* AYUSH Mode */}
          <button
            type="button"
            onClick={() => setMode("ayush")}
            className={cn(
              "flex flex-col justify-between rounded-lg border p-4 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600",
              mode === "ayush"
                ? "border-2 border-amber-600 bg-amber-50/30 shadow-xs ring-1 ring-amber-600/30"
                : "border-slate-200 hover:border-slate-300 bg-white"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <h4 className="text-base font-semibold text-slate-900">
                    AYUSH Mode
                  </h4>
                </div>
                {mode === "ayush" && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured traditional intake including Dashavidha Pariksha, Prakriti, and lifestyle history.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
              <Badge variant="warning" className="text-[10px]">
                Phase 10 Extension
              </Badge>
              <span className="text-xs font-medium text-amber-700">
                {mode === "ayush" ? "Active Mode ✓" : "Select"}
              </span>
            </div>
          </button>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/identify"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back to Identify
          </Link>
          <Link
            href="/patient/interview"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <span>Proceed to Step 5: Interview</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
