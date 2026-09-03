import Link from "next/link";
import { ArrowRight, Globe, Shield, User, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PatientPortalPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 border-sky-300 bg-sky-50 text-sky-800">
          Phase 0 Application Shell
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome to Patient Case-Taking
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          MediKiosk will assist you in capturing your symptoms, health history, and medical documents before meeting your physician.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Standard Intake Workflow</CardTitle>
          <CardDescription>
            The intake flow consists of 7 structured steps designed for clarity and safety.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <Globe className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Language Preference</h4>
              <p className="text-xs text-slate-500">Choice between English, Hindi (हिंदी), and Marathi (मराठी).</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Informed Consent</h4>
              <p className="text-xs text-slate-500">Transparent permission for AI-assisted symptom intake and record structuring.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <User className="h-5 w-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Patient Identification</h4>
              <p className="text-xs text-slate-500">Synthetic demographic registration or quick demo profile selection.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <Stethoscope className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Clinical Mode & Interview</h4>
              <p className="text-xs text-slate-500">Conversational clinical history taking (Allopathy / AYUSH) with red-flag detection.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
          <Link
            href="/patient/language"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <span>Proceed to Step 1: Language</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
