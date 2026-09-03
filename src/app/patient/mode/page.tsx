import Link from "next/link";
import { ArrowRight, Stethoscope, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PatientModePage() {
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
          <div className="rounded-lg border-2 border-sky-600 bg-sky-50/20 p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="h-5 w-5 text-sky-600" />
              <h4 className="text-base font-semibold text-slate-900">General OPD / Allopathy</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard clinical symptom inquiry: onset, duration, severity, red-flag triage, and medication history.
            </p>
            <Badge variant="info" className="mt-4 text-[10px]">
              Primary SIH Workflow
            </Badge>
          </div>

          <div className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <h4 className="text-base font-semibold text-slate-900">AYUSH Mode</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Structured traditional intake including Dashavidha Pariksha, Prakriti, and lifestyle history.
            </p>
            <Badge variant="warning" className="mt-4 text-[10px]">
              Phase 10 Extension
            </Badge>
          </div>
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
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
          >
            <span>Proceed to Step 5: Interview</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
