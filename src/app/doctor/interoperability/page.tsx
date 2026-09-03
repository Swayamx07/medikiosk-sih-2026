import Link from "next/link";
import { Share2, FileCode, ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DoctorInteroperabilityPage() {
  const fhirResources = [
    { resource: "Patient", desc: "Demographic identification and administrative attributes" },
    { resource: "Encounter", desc: "Pre-consultation outpatient case-taking encounter" },
    { resource: "Condition", desc: "Patient-reported problems and physician-confirmed findings" },
    { resource: "Observation", desc: "Extracted laboratory values, vitals, and red-flag triage findings" },
    { resource: "MedicationRequest", desc: "Medication history extracted from prescriptions" },
    { resource: "Consent", desc: "Digital consent artifact with timestamp and authorized scope" },
    { resource: "Bundle", desc: "Complete FHIR R4 document bundle ready for health data exchange" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/doctor"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          aria-label="Back to overview"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Interoperability &amp; ABDM Architecture
            </h2>
            <Badge variant="outline" className="text-xs border-sky-300 bg-sky-50 text-sky-800">
              FHIR R4 Standard
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Architecture for Ayushman Bharat Digital Mission (ABDM) and standard health information exchange
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FHIR R4 Resources */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-sky-600" />
              <CardTitle>Deterministic FHIR R4 Representation</CardTitle>
            </div>
            <CardDescription>
              MediKiosk serializes verified clinical records deterministically using standard FHIR R4 resources.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {fhirResources.map((item) => (
              <div
                key={item.resource}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 font-mono">
                    {item.resource}
                  </span>
                  <p className="text-slate-500">{item.desc}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  R4 Schema
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ABDM Adapter Architecture */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-emerald-600" />
                <CardTitle>ABDM Integration Adapter</CardTitle>
              </div>
              <CardDescription>
                Adapter pattern (`ABDMAdapter`) isolating ABDM sandbox operations from core clinical logic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Current Adapter State:</span>
                  <Badge variant="warning" className="text-[10px]">
                    Mock / Sandbox Adapter (Phase 9)
                  </Badge>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  The SIH demonstration employs `MockABDMAdapter` to demonstrate consent capture, record preparation, and payload serialization without dependency on unstable live national gateways.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5 font-mono text-[11px] text-slate-700">
                <div className="text-slate-400 font-sans font-semibold text-xs">
                  Architecture Pipeline:
                </div>
                <div>Structured Clinical Record</div>
                <div className="text-slate-400">&darr; Deterministic Transform</div>
                <div>FHIR R4 Bundle</div>
                <div className="text-slate-400">&darr; ABDM Adapter</div>
                <div>Encrypted Health Data Payload (HIP Flow)</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Shield className="h-4 w-4 text-sky-600" />
                <span>Interoperability Guarantee</span>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 leading-relaxed">
              No free-form LLM hallucinates the raw FHIR payload. MediKiosk derives resources strictly from validated TypeScript schema models post physician review.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
