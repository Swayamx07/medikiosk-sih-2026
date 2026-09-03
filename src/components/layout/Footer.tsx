import { ShieldCheck, Database, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-8 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              MediKiosk — AI-Powered Patient Case Taking
            </p>
            <p className="text-xs text-slate-500">
              Developed for Smart India Hackathon (SIH) 2026. Built with Next.js, TypeScript, and FHIR R4 standard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Physician in the loop
            </span>
            <span className="inline-flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-sky-600" />
              Synthetic Demo Data
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              ABDM-Ready Architecture
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center sm:text-left">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="font-semibold text-slate-500">Clinical Safety Notice:</strong> MediKiosk is an intelligent clinical case-taking and pre-consultation decision support system. It is not a diagnostic tool, does not autonomously prescribe medications, and does not replace professional medical judgment. All clinical findings must be reviewed and verified by a licensed physician.
          </p>
        </div>
      </div>
    </footer>
  );
}
