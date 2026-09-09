"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { PATIENT_I18N } from "@/lib/clinical/i18n";

export default function PatientConsentPage() {
  const router = useRouter();
  const { consentGranted, setConsent, selectedLanguage } = useIntake();
  const i18n = PATIENT_I18N[selectedLanguage] || PATIENT_I18N.en;

  const handleProceed = () => {
    if (consentGranted) {
      router.push("/patient/identify");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          {i18n.steps.step2}
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {i18n.consent.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {i18n.consent.subtitle}
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle>{i18n.consent.cardTitle}</CardTitle>
            </div>
            {consentGranted && (
              <Badge variant="success" className="text-[11px]">
                {i18n.consent.badgeGranted}
              </Badge>
            )}
          </div>
          <CardDescription>
            {i18n.consent.cardDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600 space-y-2.5">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-800">{i18n.consent.statement1Title}:</strong>{" "}
                {i18n.consent.statement1Text}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-800">{i18n.consent.statement2Title}:</strong>{" "}
                {i18n.consent.statement2Text}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-800">{i18n.consent.statement3Title}:</strong>{" "}
                {i18n.consent.statement3Text}
              </p>
            </div>
          </div>

          {/* Interactive Consent Checkbox Toggle */}
          <button
            type="button"
            onClick={() => setConsent(!consentGranted)}
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 cursor-pointer"
          >
            {consentGranted ? (
              <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Square className="h-5 w-5 text-slate-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {i18n.consent.checkboxLabel}
              </p>
              <p className="text-[11px] text-slate-500">
                {i18n.consent.checkboxHelp}
              </p>
            </div>
          </button>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/language"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; {i18n.navigation.back}
          </Link>
          <button
            type="button"
            disabled={!consentGranted}
            onClick={handleProceed}
            className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
              consentGranted
                ? "bg-slate-900 hover:bg-slate-800 cursor-pointer"
                : "bg-slate-300 cursor-not-allowed text-slate-500"
            }`}
          >
            <span>{i18n.consent.proceedButton}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
