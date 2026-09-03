import Link from "next/link";
import { Users, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Welcome / Triage Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
            Workstation Shell &bull; Phase 0
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Physician Case-Review Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Monitor incoming pre-consultation patient cases, review clinical extractions, and verify summaries.
          </p>
        </div>

        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
        >
          <Users className="h-4 w-4 text-sky-400" />
          <span>Open Full Patient Queue</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Metrics Row Shell */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Priority Queue
              </span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Demo Case 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Configured potential red-flag alerts awaiting urgent physician review.
            </p>
            <Badge variant="destructive" className="mt-3 text-[10px]">
              Requires Attention
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Intake Pending Review
              </span>
              <Activity className="h-4 w-4 text-sky-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Demo Case 2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Chronic condition patient with previous laboratory reports and timeline.
            </p>
            <Badge variant="info" className="mt-3 text-[10px]">
              Ready for Consultation
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                FHIR Verified Cases
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Standardized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Interoperable FHIR R4 Bundles generated post physician verification.
            </p>
            <Badge variant="success" className="mt-3 text-[10px]">
              HIP / ABDM Ready
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Workflow Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Physician-in-the-Loop Protocol</CardTitle>
          <CardDescription>
            How MediKiosk safeguards patient data and clinical safety during the hackathon demonstration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Physician Control & Verification</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                AI extracts and structures intake statements into clinical narratives. The physician reviews, edits any discrepancies, and explicitly executes the &ldquo;Verify &amp; Accept&rdquo; action to create immutable audit records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
