import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PatientLanguagePage() {
  const languages = [
    { code: "en", name: "English", native: "English", desc: "Default clinical interface" },
    { code: "hi", name: "Hindi", native: "हिन्दी", desc: "भारतीय भाषा समर्थन" },
    { code: "mr", name: "Marathi", native: "मराठी", desc: "स्थानिक भाषा समर्थन" },
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
          {languages.map((lang) => (
            <div
              key={lang.code}
              className="flex flex-col justify-between rounded-lg border border-slate-200 p-4 hover:border-sky-500 hover:bg-sky-50/30 transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{lang.name}</span>
                  <Globe className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-xl font-bold text-slate-800 mt-2 block">
                  {lang.native}
                </span>
                <p className="text-xs text-slate-500 mt-1">{lang.desc}</p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-sky-700">Select language &rarr;</span>
              </div>
            </div>
          ))}
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
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
          >
            <span>Proceed to Step 2: Consent</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
