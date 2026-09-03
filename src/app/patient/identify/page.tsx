import Link from "next/link";
import { ArrowRight, UserPlus, FileBadge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function PatientIdentifyPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Step 3 of 7
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Patient Identification
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Identify using synthetic demo profiles or provide minimal patient details.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-sky-600" />
            <CardTitle>Synthetic Intake Identification</CardTitle>
          </div>
          <CardDescription>
            In compliance with medical privacy rules, never enter real identifiable health data in this demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Ramesh K. (Demo)"
              disabled
              defaultValue="Demo Patient A"
            />
            <Input
              label="Age / Gender"
              placeholder="e.g. 52 / Male"
              disabled
              defaultValue="54 / Male"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
              <FileBadge className="h-4 w-4 text-sky-600" />
              <span>ABHA / Demo ID Placeholder</span>
            </div>
            <p className="text-slate-500">
              Future phases will connect this to ABDM mock verification and synthetic demo scenarios (e.g. Acute chest pain case vs Chronic diabetic case).
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/consent"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back to Consent
          </Link>
          <Link
            href="/patient/mode"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
          >
            <span>Proceed to Step 4: Mode</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
