import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Share2,
  Clock,
  Edit3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface PatientCasePageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientCaseDetailPage({
  params,
}: PatientCasePageProps) {
  const { id } = await params;
  const isPriorityCase = id.includes("acute") || id.includes("01");

  return (
    <div className="space-y-6">
      {/* Back and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/doctor/patients"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            aria-label="Back to queue"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Case File: {id}
              </h2>
              {isPriorityCase ? (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Potential Red Flag
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Standard Review
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Synthetic Demo Consultation &bull; Pre-consultation case-taking session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/doctor/interoperability"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-600" />
            <span>FHIR Representation</span>
          </Link>
          <Button variant="primary" size="sm" className="gap-1.5" disabled>
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
            <span>Verify &amp; Accept (Phase 7)</span>
          </Button>
        </div>
      </div>

      {/* Safety Alert Banner if Red Flag */}
      {isPriorityCase && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-950">
              Potential Clinical Red-Flag Triggered
            </h4>
            <p className="text-xs text-red-800 leading-relaxed">
              Deterministic rule engine identified acute clinical priority criteria based on patient-reported chest pain, shortness of breath, and diaphoresis. Immediate clinical triage recommended.
            </p>
          </div>
        </div>
      )}

      {/* 2-Column Clinical Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Intake History & Timeline */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Structured Patient History</CardTitle>
              <CardDescription>
                Canonical clinical entities extracted from patient conversational intake.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                <span className="font-semibold text-slate-700">Chief Complaint</span>
                <p className="text-slate-600">
                  {isPriorityCase
                    ? "Severe retrosternal chest pain radiating to left shoulder since 14 hours ago."
                    : "Routine follow-up for chronic type-2 diabetes and hypertension management."}
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                <span className="font-semibold text-slate-700">Associated Symptoms</span>
                <p className="text-slate-600">
                  {isPriorityCase
                    ? "Reported shortness of breath, diaphoresis (sweating). Denies fever."
                    : "Mild bilateral foot numbness. No chest pain or dizziness reported."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                <CardTitle className="text-base">Medical Timeline &amp; Documents</CardTitle>
              </div>
              <CardDescription>
                Chronological aggregation of past encounters, medications, and synthetic lab results.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              <div className="p-4 rounded-md border border-dashed border-slate-200 bg-slate-50/50 text-center">
                <p>Timeline visualization will be populated in Phase 5 &amp; 6 upon document extraction.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Summary & Verification */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-sky-600" />
                  <CardTitle className="text-base">Physician-Ready Summary</CardTitle>
                </div>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Edit3 className="h-3 w-3" />
                  Editable by Doctor
                </Badge>
              </div>
              <CardDescription>
                AI-drafted clinical synthesis awaiting physician verification before permanent record creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-md border border-slate-200 bg-white p-3 font-mono text-slate-700 leading-relaxed">
                {isPriorityCase ? (
                  <>
                    <strong>CLINICAL IMPRESSION (UNVERIFIED):</strong> Patient reports acute onset chest tightness associated with diaphoresis and dyspnea. Safety rule flagged for immediate ECG and physician evaluation.
                  </>
                ) : (
                  <>
                    <strong>CLINICAL IMPRESSION (UNVERIFIED):</strong> Known diabetic and hypertensive patient presenting for regular checkup. Previous documents indicate glycemic control monitoring required.
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Notice: AI clinical summaries are unverified decision-support suggestions until physician sign-off.
              </p>
            </CardContent>
            <CardFooter className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
              <span className="text-slate-500">Audit Status: Pending Verification</span>
              <Button variant="outline" size="sm" disabled>
                Edit Summary
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
