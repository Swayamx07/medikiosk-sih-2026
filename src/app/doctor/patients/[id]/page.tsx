import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
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
  Building2,
  Calendar,
  Activity,
  Pill,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { getPhysicianCaseDetailAction } from "@/app/actions/doctor";
import { getDocumentSignedUrlAction } from "@/app/actions/documents";
import { CanonicalJsonViewer } from "@/components/doctor/CanonicalJsonViewer";
import { FhirBundleViewer } from "@/components/doctor/FhirBundleViewer";
import { PhysicianHeaderVerifyButton } from "@/components/doctor/PhysicianHeaderVerifyButton";
import { PhysicianReviewCard } from "@/components/doctor/PhysicianReviewCard";

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
  const isVerified =
    caseData.status === "verified" ||
    Boolean(caseData.physicianReview?.isVerified);

  // Resolve signed URLs for uploaded medical records
  const signedUrls: Record<string, string> = {};
  for (const doc of caseData.documents) {
    if (doc.storagePath) {
      const urlRes = await getDocumentSignedUrlAction(doc.storagePath);
      if (urlRes.success && urlRes.signedUrl) {
        signedUrls[doc.id] = urlRes.signedUrl;
      }
    }
  }

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
                  Urgent Priority
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Standard Priority
                </Badge>
              )}
              {isVerified ? (
                <Badge variant="success" className="gap-1 text-xs shadow-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                  Physician Verified
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs text-amber-800 border-amber-300 bg-amber-50"
                >
                  Awaiting Review
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
          <a
            href="#fhir-interoperability"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Share2 className="h-3.5 w-3.5 text-sky-600" />
            <span>FHIR R4 Bundle</span>
          </a>
          <PhysicianHeaderVerifyButton
            sessionId={caseData.sessionId}
            isVerified={isVerified}
            verifiedByName={caseData.physicianReview?.physicianName}
            verifiedAt={caseData.physicianReview?.verifiedAt}
          />
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
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] text-sky-800 bg-sky-50 border-sky-200">
                    Source: Patient Dialogue
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {caseData.mode} OPD
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Structured Chief Complaint (Confirmed)
                </span>
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-slate-900 text-sm font-medium leading-relaxed">
                  &ldquo;{caseData.chiefComplaint}&rdquo;
                </div>
              </div>

              {caseData.chiefComplaintVerbatim && caseData.chiefComplaintVerbatim !== caseData.chiefComplaint && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Verbatim Patient Response (Audit Record)
                  </span>
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white p-2.5 text-slate-600 text-xs leading-relaxed italic">
                    &ldquo;{caseData.chiefComplaintVerbatim}&rdquo;
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structured Conversational Clinical Findings */}
          {caseData.structuredFindings && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-600" />
                    <CardTitle className="text-base">
                      Patient-Reported Structured Findings
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono text-sky-700 bg-sky-50 border-sky-200">
                    Provenance Anchored
                  </Badge>
                </div>
                <CardDescription>
                  Normalized clinical entities extracted from patient dialogue, cross-referenced with exact kiosk step numbers and verbatim quotes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* HPI Summary Narrative */}
                {caseData.structuredFindings.hpiNarrative && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-800 leading-relaxed">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">
                        History of Present Illness (AI Synthesized)
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-slate-500 border-slate-300 bg-white"
                      >
                        System Synthesis (Pre-Verification)
                      </Badge>
                    </div>
                    <p>{caseData.structuredFindings.hpiNarrative}</p>
                  </div>
                )}

                {/* Physician-Amended Clinical Summary (if present) */}
                {caseData.physicianReview?.editedClinicalSummary && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 leading-relaxed">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-amber-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        <span>Physician-Amended Clinical Narrative (Verified Review)</span>
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-800 border-amber-300 bg-white font-medium"
                      >
                        Signed off by{" "}
                        {caseData.physicianReview.physicianName || "Physician"}
                      </Badge>
                    </div>
                    <p>{caseData.physicianReview.editedClinicalSummary}</p>
                    <p className="text-[10px] text-amber-800/80 mt-1.5 italic border-t border-amber-200/60 pt-1">
                      Physician-edited summary recorded under authenticated session. Raw kiosk dialogue remains preserved.
                    </p>
                  </div>
                )}

                {/* Structured Symptoms */}
                {caseData.structuredFindings.symptoms.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Reported Symptoms ({caseData.structuredFindings.symptoms.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {caseData.structuredFindings.symptoms.map((sym, idx) => (
                        <div
                          key={idx}
                          className="rounded-md border border-slate-200 bg-white p-2.5 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 capitalize">
                              {sym.symptomName}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono text-slate-500">
                              Step {sym.stepNumber}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                            {sym.severity && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700">
                                Severity: {sym.severity}
                              </span>
                            )}
                            {sym.duration && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                                Duration: {sym.duration}
                              </span>
                            )}
                            {sym.onset && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                                Onset: {sym.onset}
                              </span>
                            )}
                            {sym.location && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                                Site: {sym.location}
                              </span>
                            )}
                            {sym.radiation && (
                              <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] text-amber-900 font-medium">
                                Radiates to: {sym.radiation}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 italic border-t border-slate-100 pt-1 mt-1 truncate">
                            &ldquo;{sym.sourceText}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions, Medications & Allergies Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                  {/* Past Conditions */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Past Conditions
                    </span>
                    {caseData.structuredFindings.conditions.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">None reported</p>
                    ) : (
                      caseData.structuredFindings.conditions.map((c, idx) => (
                        <div key={idx} className="rounded border border-slate-200 bg-slate-50 p-1.5 text-xs">
                          <span className="font-semibold text-slate-800 block capitalize">{c.conditionName}</span>
                          <span className="text-[10px] text-slate-500 block truncate">Step {c.stepNumber}: &ldquo;{c.sourceText}&rdquo;</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Medications */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Current Meds
                    </span>
                    {caseData.structuredFindings.medications.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">None reported</p>
                    ) : (
                      caseData.structuredFindings.medications.map((m, idx) => (
                        <div key={idx} className="rounded border border-slate-200 bg-slate-50 p-1.5 text-xs">
                          <span className="font-semibold text-slate-800 block capitalize">{m.medicationName}</span>
                          <span className="text-[10px] text-slate-500 block truncate">Step {m.stepNumber}: &ldquo;{m.sourceText}&rdquo;</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Allergies */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Known Allergies
                    </span>
                    {caseData.structuredFindings.allergies.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">None reported / NKDA</p>
                    ) : (
                      caseData.structuredFindings.allergies.map((a, idx) => (
                        <div key={idx} className="rounded border border-rose-200 bg-rose-50/50 p-1.5 text-xs">
                          <span className="font-semibold text-rose-900 block capitalize">{a.allergen}</span>
                          <span className="text-[10px] text-rose-700 block truncate">Step {a.stepNumber}: &ldquo;{a.sourceText}&rdquo;</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Clinical Documents & Extracted Structured Findings (Phase 5) */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-600" />
                  <CardTitle className="text-base">
                    Uploaded Medical Documents &amp; Structured Findings
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs font-mono text-slate-600">
                  {caseData.documents.length} File(s)
                </Badge>
              </div>
              <CardDescription>
                Historical laboratory tests, prescriptions, and summaries digitized via server-side AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.documents.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-slate-500 bg-slate-50/50">
                  <FileText className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-700">
                    No medical records uploaded for this encounter.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Patient completed intake without attaching external lab reports or prescriptions.
                  </p>
                </div>
              ) : (
                caseData.documents.map((doc) => {
                  const extraction = caseData.extractions.find(
                    (e) => e.documentId === doc.id
                  );
                  const signedUrl = signedUrls[doc.id];

                  return (
                    <div
                      key={doc.id}
                      className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs"
                    >
                      {/* Document Meta Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {doc.originalFilename}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-semibold text-slate-600"
                          >
                            {doc.documentType.replace(/_/g, " ")}
                          </Badge>
                          <Badge
                            variant={
                              doc.processingStatus === "completed"
                                ? "success"
                                : doc.processingStatus === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px] capitalize"
                          >
                            {doc.processingStatus}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400">
                            {(doc.fileSizeBytes / 1024).toFixed(1)} KB &bull;{" "}
                            {formatDateTime(doc.uploadedAt)}
                          </span>
                          {signedUrl && (
                            <a
                              href={signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                            >
                              <ExternalLink className="h-3 w-3 text-slate-500" />
                              <span>View File</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Patient-Document Relevance Assessment Banner */}
                      {extraction?.patientRelevance && (
                        <div
                          className={`rounded-md p-2.5 border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                            extraction.patientRelevance.status === "verified"
                              ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                              : extraction.patientRelevance.status === "mismatch"
                              ? "border-rose-300 bg-rose-50/90 text-rose-950"
                              : "border-amber-200 bg-amber-50/80 text-amber-950"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {extraction.patientRelevance.status === "verified" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : extraction.patientRelevance.status === "mismatch" ? (
                              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[11px] uppercase tracking-wider">
                                  {extraction.patientRelevance.status === "verified"
                                    ? "Patient Identity Verified ✓"
                                    : extraction.patientRelevance.status === "mismatch"
                                    ? "Patient Identity Mismatch Alert"
                                    : "Insufficient Header Info (Unverified Identity)"}
                                </span>
                                <Badge
                                  variant={
                                    extraction.patientRelevance.status === "verified"
                                      ? "success"
                                      : extraction.patientRelevance.status === "mismatch"
                                      ? "destructive"
                                      : "warning"
                                  }
                                  className="text-[10px] uppercase font-mono"
                                >
                                  {extraction.patientRelevance.status.replace(/_/g, " ")}
                                </Badge>
                              </div>
                              <p className="text-[11px] opacity-90">
                                {extraction.patientRelevance.reasons[0] ||
                                  "Document patient metadata verified against encounter profile."}
                              </p>
                              {extraction.patientRelevance.matchedFields.length > 0 && (
                                <p className="text-[10px] text-emerald-800">
                                  Matched fields: {extraction.patientRelevance.matchedFields.join(", ")}
                                </p>
                              )}
                              {extraction.patientRelevance.mismatchedFields.length > 0 && (
                                <p className="text-[10px] text-rose-800 font-semibold">
                                  Mismatched fields: {extraction.patientRelevance.mismatchedFields.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Extraction Header (Facility, Date, Provider, Confidence) */}
                      {extraction && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                          <div className="flex items-center gap-4 flex-wrap">
                            {extraction.issuingFacilityOrDoctor && (
                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                <span>{extraction.issuingFacilityOrDoctor}</span>
                              </div>
                            )}
                            {extraction.extractedDate && (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span>Report Date: {extraction.extractedDate}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono text-slate-600 border-slate-200"
                            >
                              Provider: {extraction.extractionProvider}
                            </Badge>
                            {typeof extraction.confidenceScore === "number" && (
                              <span className="text-[11px] font-medium text-slate-600">
                                Confidence: {(extraction.confidenceScore * 100).toFixed(0)}%
                              </span>
                            )}
                            <Badge
                              variant={extraction.isVerified ? "success" : "secondary"}
                              className="text-[10px]"
                            >
                              {extraction.isVerified ? "Verified ✓" : "Unverified"}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Extracted Labs Table */}
                      {extraction && extraction.extractedLabResults.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <Activity className="h-3.5 w-3.5 text-sky-600" />
                            <span>Extracted Laboratory Investigations</span>
                          </div>
                          <div className="rounded-md border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                                <tr>
                                  <th className="p-2">Investigation</th>
                                  <th className="p-2">Observed Value</th>
                                  <th className="p-2">Reference Range</th>
                                  <th className="p-2 text-right">Flag</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-[11px]">
                                {extraction.extractedLabResults.map((lab, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="p-2 font-medium text-slate-800">
                                      {lab.testName}
                                    </td>
                                    <td className="p-2 font-mono font-semibold text-slate-900">
                                      {lab.value} {lab.unit || ""}
                                    </td>
                                    <td className="p-2 text-slate-500">
                                      {lab.referenceRange || "Standard"}
                                    </td>
                                    <td className="p-2 text-right">
                                      {lab.isAbnormal ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-[10px]"
                                        >
                                          {lab.flag?.toUpperCase() || "ABNORMAL"}
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50"
                                        >
                                          NORMAL
                                        </Badge>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Extracted Medications */}
                      {extraction && extraction.extractedMedications.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <Pill className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Extracted Medications &amp; Dosage</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {extraction.extractedMedications.map((med, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border border-slate-200 bg-slate-50/50 p-2.5 text-xs space-y-0.5"
                              >
                                <p className="font-semibold text-slate-900">{med.name}</p>
                                <p className="text-[11px] text-slate-600">
                                  {med.dosage || "Standard Dose"} &bull;{" "}
                                  {med.frequency || "Daily"}{" "}
                                  {med.duration ? `(${med.duration})` : ""}
                                </p>
                                {med.instructions && (
                                  <p className="text-[10px] text-slate-500 italic">
                                    {med.instructions}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extracted Conditions */}
                      {extraction && extraction.extractedConditions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-800 block">
                            Documented Clinical Impressions / Conditions
                          </span>
                          <div className="space-y-1">
                            {extraction.extractedConditions.map((cond, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border border-slate-200/80 bg-slate-50/30 p-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-slate-800">
                                    {cond.name}
                                  </span>
                                  {cond.status && (
                                    <Badge variant="outline" className="text-[10px] capitalize">
                                      {cond.status.replace(/_/g, " ")}
                                    </Badge>
                                  )}
                                </div>
                                {cond.notes && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {cond.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Canonical Encounter JSON Contract */}
          {caseData.canonicalRecord ? (
            <CanonicalJsonViewer
              sessionCode={caseData.sessionCode}
              record={caseData.canonicalRecord}
            />
          ) : null}

          {/* FHIR R4 Interoperability Section */}
          <section id="fhir-interoperability" aria-label="FHIR R4 Interoperability">
            <FhirBundleViewer
              sessionId={caseData.sessionId}
              sessionCode={caseData.sessionCode}
            />
          </section>
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
              <div className="flex justify-between pb-2 border-b border-slate-100 items-center">
                <span className="text-slate-500">Encounter Status:</span>
                {isVerified ? (
                  <Badge variant="success" className="text-[10px] gap-1 shadow-2xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Verified
                  </Badge>
                ) : (
                  <span className="font-medium text-slate-800 capitalize">
                    {caseData.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              {isVerified && caseData.physicianReview?.verifiedAt && (
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Verified At:</span>
                  <span className="font-medium text-slate-700">
                    {formatDateTime(caseData.physicianReview.verifiedAt)}
                  </span>
                </div>
              )}
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
          <PhysicianReviewCard
            sessionId={caseData.sessionId}
            sessionCode={caseData.sessionCode}
            status={caseData.status}
            initialSummary={
              caseData.structuredFindings?.hpiNarrative || null
            }
            physicianReview={caseData.physicianReview}
          />
        </div>
      </div>
    </div>
  );
}
