import Link from "next/link";
import { Stethoscope, Users, Share2, ShieldCheck, Home } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Physician Workstation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
                <Stethoscope className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 leading-none">
                    MediKiosk Physician Workstation
                  </h1>
                  <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600">
                    Clinical Review
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Pre-Consultation Case Verification &amp; FHIR Export
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Safety Rules Active
            </span>
            <Badge variant="secondary" className="text-xs">
              SIH Phase 0 Shell
            </Badge>
          </div>
        </div>

        {/* Doctor Navigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-1.5">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link
              href="/doctor"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors"
            >
              <Stethoscope className="h-3.5 w-3.5 text-slate-600" />
              <span>Overview</span>
            </Link>

            <Link
              href="/doctor/patients"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-slate-600" />
              <span>Patient Queue</span>
            </Link>

            <Link
              href="/doctor/interoperability"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5 text-slate-600" />
              <span>FHIR &amp; ABDM Interoperability</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Clinical Content */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>MediKiosk Decision Support System &bull; Final clinical judgment and record verification remains with the physician.</p>
      </footer>
    </div>
  );
}
