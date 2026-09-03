import Link from "next/link";
import { ArrowLeft, HeartPulse } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const steps = [
    { label: "Language", href: "/patient/language" },
    { label: "Consent", href: "/patient/consent" },
    { label: "Identify", href: "/patient/identify" },
    { label: "Mode", href: "/patient/mode" },
    { label: "Interview", href: "/patient/interview" },
    { label: "Documents", href: "/patient/documents" },
    { label: "Review", href: "/patient/review" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-100/70">
      {/* Patient Kiosk Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-600 text-white">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">
                  MediKiosk Patient Intake
                </h1>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Pre-Consultation Case Taking
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800 text-[11px]">
              Patient Kiosk Mode
            </Badge>
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className="overflow-x-auto border-t border-slate-100 bg-slate-50 px-4 py-2">
          <div className="mx-auto flex max-w-5xl items-center gap-1 sm:gap-2">
            {steps.map((step, index) => (
              <Link
                key={step.href}
                href={step.href}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors whitespace-nowrap"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                  {index + 1}
                </span>
                <span>{step.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">{children}</div>
      </main>

      {/* Footer disclaimer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>If you have severe chest pain or trouble breathing, please alert the triage desk immediately.</p>
      </footer>
    </div>
  );
}
