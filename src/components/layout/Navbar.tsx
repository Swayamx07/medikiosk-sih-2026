import Link from "next/link";
import { Activity, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md py-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Activity className="h-5 w-5 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                MediKiosk
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase mt-0.5">
                Clinical Intake
              </span>
            </div>
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-medium text-slate-600 border-slate-200 bg-slate-50">
            SIH 2026 Prototype
          </Badge>
        </div>

        {/* Patient Navigation */}
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main Navigation">
          <Link
            href="/patient"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors"
          >
            <UserCheck className="h-4 w-4 text-sky-600" />
            <span>Patient Intake</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
