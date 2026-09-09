import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Clock,
  User,
  MessageSquare,
  Mic,
  FileText,
  ShieldAlert,
  Globe,
  Stethoscope,
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
import { getPhysicianCaseDetailAction } from "@/app/actions/doctor";

interface PatientCasePageProps {
  params: Promise<{ id: string }>;
}

function calculateAge(dobStr?: string): string {
  if (!dobStr) return "Unknown";
  try {
    const dob = new Date(dobStr);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    const years = Math.abs(ageDt.getUTCFullYear() - 1970);
    return `${years} yrs`;
  } catch {
    return dobStr;
  }
}

function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return "N/A";
  try {
    return new Date(isoStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

export default async function PatientCaseDetailPage({
  params,
}: PatientCasePageProps) {
  const { id } = await params;
  const result = await getPhysicianCaseDetailAction(id);

  if (!result.success || !result.caseDetail) {
    return (
      <div className="space-y-6">
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Triage Queue</span>
        </Link>
        <ErrorState
          title="Case Encounter Not Found"
          description={
            result.error ||
            `No active or historical encounter record was found matching ID: ${id}`
          }
          action={
            <Link
              href="/doctor/patients"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800"
            >
              Return to Patient Queue
            </Link>
          }
        />
      </div>
    );
  }

  const caseData = result.caseDetail;
  const isEmergency =
    caseData.priority === "emergency" || caseData.hasCriticalRedFlag;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Case Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/doctor/patients"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 shadow-xs"
            aria-label="Back to queue"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {caseData.patient.fullName}
              </h2>
              <Badge variant="outline" className="font-mono text-xs text-slate-600">
                {caseData.sessionCode}
              </Badge>
              {isEmergency ? (
                <Badge variant="destructive" className="gap-1 text-xs shadow-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Critical Red Flag
                </Badge>
              ) : caseData.priority === "urgent" ? (
                <Badge variant="warning" className="text-xs">
                  Urgent
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Standard Review
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {caseData.patient.gender.toUpperCase()} &bull;{" "}
              {calculateAge(caseData.patient.dateOfBirth)} (DOB:{" "}
              {caseData.patient.dateOfBirth}) &bull; ABHA:{" "}
              {caseData.patient.abhaId || "Not Registered"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/doctor/interoperability"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-600" />
            <span>FHIR Bundle (Phase 8)</span>
          </Link>
          <Button variant="primary" size="sm" className="gap-1.5" disabled>
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
            <span>Verify &amp; Accept (Phase 7)</span>
          </Button>
        </div>
      </div>

      {/* Safety Alert Banner: Non-diagnostic Explainable Triage Rules */}
      {isEmergency && caseData.triageAlerts.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-950 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-red-950">
                  Potential Clinical Red-Flag Triggered
                </h4>
                <Badge variant="outline" className="text-[10px] font-mono border-red-300 text-red-800 bg-red-100/50">
                  {caseData.triageAlerts[0].triggerRuleId}
                </Badge>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                {caseData.triageAlerts[0].triggerReason}
              </p>
            </div>
          </div>

          {/* Explainable Symptoms Entities */}
          {caseData.triageAlerts[0].triggerSymptoms &&
            caseData.triageAlerts[0].triggerSymptoms.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 pl-8 border-t border-red-200/80">
                <span className="text-[11px] font-semibold text-red-900">
                  Trigger Entities:
                </span>
                {caseData.triageAlerts[0].triggerSymptoms.map((sym, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[10px] uppercase font-mono bg-white text-red-700 border-red-200"
                  >
                    {sym.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
        </div>
      )}

      {/* 2-Column Clinical Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Conversational History & Dialogue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chief Complaint Highlight */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-600" />
                  <CardTitle className="text-base">Recorded Chief Complaint</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {caseData.mode} OPD
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-slate-800 text-sm leading-relaxed italic">
                &ldquo;{caseData.chiefComplaint}&rdquo;
              </div>
            </CardContent>
          </Card>

          {/* Complete Chronological Intake Thread */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-sky-600" />
                  <CardTitle className="text-base">
                    Chronological Clinical Interview
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {caseData.history.length} Questions Answered
                </Badge>
              </div>
              <CardDescription>
                Verbatim responses captured through kiosk voice and typed intake.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.history.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  No interview answers recorded yet for this session.
                </p>
              ) : (
                caseData.history.map((qa) => (
                  <div
                    key={qa.questionId}
                    className="rounded-lg border border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sky-700 font-mono">
                          Step {qa.stepNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-semibold text-slate-600 border-slate-200"
                        >
                          {qa.questionDomain.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        {qa.inputModality === "voice_browser" && (
                          <span className="inline-flex items-center gap-1 text-sky-700 font-medium bg-sky-50 px-1.5 py-0.5 rounded text-[10px]">
                            <Mic className="h-3 w-3" />
                            Voice
                          </span>
                        )}
                        <span className="uppercase font-mono text-[10px]">
                          {qa.languageDetected}
                        </span>
                        <span>&bull;</span>
                        <span>{formatDateTime(qa.answeredAt)}</span>
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Kiosk Prompt:
                      </span>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {qa.questionText}
                      </p>
                    </div>

                    {/* Patient Answer */}
                    <div className="rounded-md bg-slate-50 border border-slate-200/80 p-2.5">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                        Patient Verbatim Response:
                      </span>
                      <p className="text-xs text-slate-900 leading-relaxed font-sans mt-0.5 font-normal">
                        {qa.answerText}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Demographics & Encounter Metadata */}
        <div className="space-y-6">
          {/* Patient Profile Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-sky-600" />
                <CardTitle className="text-base">Patient Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Patient Identifier:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {caseData.patient.patientIdentifier}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Full Name:</span>
                <span className="font-semibold text-slate-800">
                  {caseData.patient.fullName}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">DOB / Age:</span>
                <span className="font-medium text-slate-800">
                  {caseData.patient.dateOfBirth} ({calculateAge(caseData.patient.dateOfBirth)})
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Gender:</span>
                <span className="font-medium text-slate-800 capitalize">
                  {caseData.patient.gender}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-medium text-slate-800">
                  {caseData.patient.phoneNumber || "Not Provided"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ABHA Address:</span>
                <span className="font-mono text-slate-800">
                  {caseData.patient.abhaId || "Not Registered"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Encounter Details Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-600" />
                <CardTitle className="text-base">Encounter Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Session Code:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {caseData.sessionCode}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Intake Mode:</span>
                <span className="font-medium text-slate-800 capitalize flex items-center gap-1">
                  <Stethoscope className="h-3 w-3 text-slate-400" />
                  {caseData.mode}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Primary Language:</span>
                <span className="font-medium text-slate-800 uppercase flex items-center gap-1">
                  <Globe className="h-3 w-3 text-slate-400" />
                  {caseData.language}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Priority Level:</span>
                <span className="font-semibold capitalize text-slate-800">
                  {caseData.priority}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Encounter Status:</span>
                <span className="font-medium text-slate-800 capitalize">
                  {caseData.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Started At:</span>
                <span className="font-medium text-slate-700">
                  {formatDateTime(caseData.startedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Completed At:</span>
                <span className="font-medium text-slate-700">
                  {formatDateTime(caseData.completedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Physician Review & Verification Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-600" />
                  <CardTitle className="text-base">Review Protocol</CardTitle>
                </div>
                <Badge
                  variant={caseData.status === "verified" ? "success" : "secondary"}
                  className="text-[10px]"
                >
                  {caseData.status === "verified" ? "Verified ✓" : "Pending Sign-off"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                All patient conversational answers and triage alerts are captured directly from the patient kiosk.
              </p>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold text-slate-700 block">
                  Clinical Audit Guard:
                </span>
                <span>
                  Verification and immutable EHR sign-off will be activated in Phase 7.
                </span>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 pt-3 flex justify-end">
              <Button variant="outline" size="sm" disabled>
                Sign Off Encounter (Phase 7)
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
