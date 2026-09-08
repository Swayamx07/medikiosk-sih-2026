"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2, CheckSquare, Square } from "lucide-react";
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

export default function PatientConsentPage() {
  const { consentGranted, setConsent } = useIntake();

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Step 2 of 7
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Patient Consent &amp; Privacy Notice
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Digital health records under ABDM and clinical safety guidelines require transparent patient consent.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle>Informed Consent Acknowledgement</CardTitle>
            </div>
            {consentGranted && (
              <Badge variant="success" className="text-[11px]">
                Consent Granted ✓
              </Badge>
            )}
          </div>
          <CardDescription>
            Please review the statements below before beginning your intake.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600 space-y-2.5">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-800">Assisted Case-Taking:</strong> I understand that MediKiosk is an AI-assisted intake tool designed to record symptoms and organize health history. It does not provide autonomous medical diagnosis.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-800">Physician Review:</strong> All recorded information, extracted documents, and clinical summaries will be reviewed and verified by the attending physician before any treatment decision.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-800">Data Protection &amp; Privacy:</strong> For this SIH prototype demonstration, only synthetic demo patient information is processed in accordance with privacy safeguards.
              </p>
            </div>
          </div>

          {/* Interactive Consent Checkbox Toggle */}
          <button
            type="button"
            onClick={() => setConsent(!consentGranted)}
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            {consentGranted ? (
              <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Square className="h-5 w-5 text-slate-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-semibold text-slate-800">
                I acknowledge and grant consent for digital case-taking
              </p>
              <p className="text-[11px] text-slate-500">
                Click to acknowledge the clinical terms and authorization.
              </p>
            </div>
          </button>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/language"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back to Language
          </Link>
          <Link
            href="/patient/identify"
            onClick={() => setConsent(true)}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <span>{consentGranted ? "Proceed to Step 3: Identify" : "I Agree & Consent"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
