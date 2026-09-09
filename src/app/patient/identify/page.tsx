"use client";

import Link from "next/link";
import { ArrowRight, UserPlus, FileBadge, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useIntake } from "@/context/IntakeContext";
import { PATIENT_I18N } from "@/lib/clinical/i18n";
import { cn } from "@/lib/utils";

export default function PatientIdentifyPage() {
  const { patientProfile, setPatientProfile, selectDemoProfile, selectedLanguage } = useIntake();
  const i18n = PATIENT_I18N[selectedLanguage] || PATIENT_I18N.en;

  const demoCases = [
    {
      id: "case-1-cardiac",
      title: "Demo Case 1: Ramesh Kumar",
      desc: "54 / Male — Acute cardiac presentation (Chest pain, sweating)",
      tag: "Primary SIH Demo",
    },
    {
      id: "case-2-chronic",
      title: "Demo Case 2: Sunita Patel",
      desc: "61 / Female — Chronic care follow-up (Diabetes, Hypertension)",
      tag: "Chronic Intake",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          {i18n.steps.step3}
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {i18n.identify.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {i18n.identify.subtitle}
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-sky-600" />
            <CardTitle>{i18n.identify.cardTitle}</CardTitle>
          </div>
          <CardDescription>
            {i18n.identify.cardDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo Profile Selector Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {i18n.identify.demoLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoCases.map((c) => {
                const isSelected = patientProfile.demoCaseId === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => selectDemoProfile(c.id)}
                    className={cn(
                      "flex flex-col justify-between rounded-lg border p-3 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600",
                      isSelected
                        ? "border-2 border-sky-600 bg-sky-50/50 shadow-xs ring-1 ring-sky-600/30"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-slate-900">{c.title}</span>
                      {isSelected ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-white">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {c.tag}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{c.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demographic Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Input
              label={i18n.identify.fullNameLabel}
              placeholder="e.g. Ramesh Kumar"
              value={patientProfile.fullName}
              onChange={(e) => setPatientProfile({ fullName: e.target.value })}
            />
            <Input
              label={i18n.identify.identifierLabel}
              placeholder="e.g. 91-4521-8832-1094"
              value={patientProfile.abhaId || patientProfile.patientIdentifier}
              onChange={(e) => setPatientProfile({ abhaId: e.target.value })}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
              <FileBadge className="h-4 w-4 text-sky-600" />
              <span>{i18n.identify.verifiedBadge}: {patientProfile.patientIdentifier}</span>
            </div>
            <p className="text-slate-500">
              Demo case: <span className="font-medium text-slate-700">{patientProfile.fullName}</span> (DOB: {patientProfile.dateOfBirth}, Gender: {patientProfile.gender}).
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/consent"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; {i18n.navigation.back}
          </Link>
          <Link
            href="/patient/mode"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <span>{i18n.navigation.proceed}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
