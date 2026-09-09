import Link from "next/link";
import { Stethoscope, Users, Share2, ShieldCheck, Home, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getActivePhysicianSession } from "@/lib/auth/physician-session";
import { logoutPhysicianAction } from "@/app/actions/auth";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActivePhysicianSession();

  // If this is the login page, render children directly without the authenticated header
  if (!session) {
    return <>{children}</>;
  }

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

          <div className="flex items-center gap-3">
            {/* Authenticated Physician Badge */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {session.fullName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {session.physicianId} &bull; {session.registrationNumber}
              </span>
            </div>

            <form action={logoutPhysicianAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-red-700 shadow-2xs transition-colors"
                title="Sign out of physician workstation"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>

        {/* Doctor Navigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-1.5">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
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

            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Session Verified &bull; {session.department}
            </span>
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
