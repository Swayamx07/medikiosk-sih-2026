import Link from "next/link";
import { ArrowRight, UploadCloud, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PatientDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Step 6 of 7
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Upload Previous Medical Documents
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Prescriptions, laboratory test reports, and discharge summaries can be uploaded for clinical timeline extraction.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Medical Document Ingestion</CardTitle>
          <CardDescription>
            Supported document types: Prescriptions, Lab Reports, Discharge Summaries (PDF, PNG, JPG).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
              <UploadCloud className="h-6 w-6 text-sky-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Drag and drop synthetic medical records here
            </h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              In Phase 5, Gemini multimodal intelligence will extract structured clinical entities and abnormal values from uploaded files.
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs opacity-75 cursor-not-allowed">
                <FileText className="h-3.5 w-3.5" />
                Select File (Enabled in Phase 5)
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/interview"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back to Interview
          </Link>
          <Link
            href="/patient/review"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
          >
            <span>Proceed to Step 7: Review</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
