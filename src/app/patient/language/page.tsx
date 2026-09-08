"use client";

import Link from "next/link";
import { ArrowRight, Globe, Check } from "lucide-react";
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
import { SupportedLanguage } from "@/types/clinical";
import { cn } from "@/lib/utils";

export default function PatientLanguagePage() {
  const { selectedLanguage, setLanguage } = useIntake();

  const languages: {
    code: SupportedLanguage;
    name: string;
    native: string;
    desc: string;
  }[] = [
    {
      code: "en",
      name: "English",
      native: "English",
      desc: "Default clinical interface",
    },
    {
      code: "hi",
      name: "Hindi",
      native: "हिन्दी",
      desc: "भारतीय भाषा समर्थन",
    },
    {
      code: "mr",
      name: "Marathi",
      native: "मराठी",
      desc: "स्थानिक भाषा समर्थन",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Step 1 of 7
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Select Your Language / भाषा निवडा / भाषा चुनें
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Please select your preferred language for the conversational case-taking session.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Supported Regional Languages</CardTitle>
          <CardDescription>
            Clinical concepts will be standardized into canonical clinical records regardless of language chosen.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <button
                type="button"
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex flex-col justify-between rounded-lg border p-4 transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600",
                  isSelected
                    ? "border-2 border-sky-600 bg-sky-50/40 shadow-xs ring-1 ring-sky-600/30"
                    : "border-slate-200 hover:border-sky-400 hover:bg-slate-50/60"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      {lang.name}
                    </span>
                    {isSelected ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <Globe className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <span className="text-xl font-bold text-slate-800 mt-2 block">
                    {lang.native}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{lang.desc}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-sky-700 font-semibold" : "text-slate-500"
                    )}
                  >
                    {isSelected ? "Selected ✓" : "Select language →"}
                  </span>
                </div>
              </button>
            );
          })}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back
          </Link>
          <Link
            href="/patient/consent"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <span>Proceed to Step 2: Consent</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
