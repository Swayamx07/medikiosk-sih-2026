import Link from "next/link";
import { CheckCircle, ArrowRight, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PatientReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Step 7 of 7
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Review &amp; Submit Case Intake
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Review summary of captured patient information before transferring to physician workstation.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <CardTitle>Case Intake Verification</CardTitle>
          </div>
          <CardDescription>
            Your case information will be submitted to the physician queue with appropriate clinical priority.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex justify-between text-xs pb-1 border-b border-slate-200">
              <span className="font-semibold text-slate-700">Intake Status:</span>
              <Badge variant="success" className="text-[10px]">Ready for Submission</Badge>
            </div>
            <div className="flex justify-between text-xs pb-1 border-b border-slate-200">
              <span className="font-semibold text-slate-700">Session Type:</span>
              <span className="text-slate-600">General OPD / Multimodal</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Clinical Safety Check:</span>
              <span className="text-slate-600">Deterministic Red-Flag Filter Active</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/documents"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back to Documents
          </Link>
          <Link
            href="/doctor"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
          >
            <UserCheck className="h-4 w-4 text-sky-400" />
            <span>Finish &amp; View in Physician Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
