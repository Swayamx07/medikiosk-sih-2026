import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  UserCheck,
  FileCheck2,
  Cpu,
  Share2,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white py-10 sm:py-14">
          <PageContainer size="xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-3 inline-flex items-center gap-2">
                <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800 text-xs px-3 py-1">
                  Smart India Hackathon 2026
                </Badge>
                <Badge variant="secondary" className="text-xs px-3 py-1">
                  Healthcare Track
                </Badge>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-5xl">
                MediKiosk
              </h1>

              <p className="mt-2 text-lg font-semibold tracking-tight text-sky-700 sm:text-xl">
                AI-Powered Patient Case Taking
              </p>

              <p className="mt-1.5 text-sm font-bold uppercase tracking-widest text-slate-500">
                &ldquo;Capture. Structure. Review.&rdquo;
              </p>

              <p className="mt-4 text-base text-slate-600 sm:text-lg leading-relaxed">
                MediKiosk transforms unstructured, multilingual patient information into a coherent, structured clinical case for physician review. By capturing clinical history prior to consultation, MediKiosk ensures physicians never start from zero.
              </p>

              {/* Primary Entry Points */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/patient"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-lg bg-slate-900 px-8 py-4 text-base font-medium text-white shadow-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 transition-all active:scale-[0.99]"
                >
                  <UserCheck className="h-5 w-5 text-sky-400" />
                  <span>Start Patient Intake</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/doctor/login"
                  className="text-xs text-slate-500 hover:text-slate-800 hover:underline transition-colors"
                >
                  Attending Medical Staff Portal &rarr;
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Zero autonomous diagnosis
                </span>
                <span className="flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-sky-600" />
                  FHIR R4 Ready
                </span>
              </div>
            </div>
          </PageContainer>
        </section>

        {/* Core Principles & Workflow */}
        <section className="py-16 bg-slate-50">
          <PageContainer size="xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                The Foundational Clinical Workflow
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Engineered for government hospitals, outpatient kiosks, and clinical workstations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 mb-2">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <CardTitle>1. Multimodal Intake</CardTitle>
                  <CardDescription>
                    Conversational history capture designed for accessibility across languages (English, Hindi, Marathi) and modes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-2">
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Adaptive Questioning:</span> Follows up on missing symptom details without repeated questions.
                  </div>
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Document Intelligence:</span> Extracts synthetic lab values, medications, and previous prescriptions.
                  </div>
                </CardContent>
              </Card>

              {/* Pillar 2 */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <CardTitle>2. Deterministic Safety</CardTitle>
                  <CardDescription>
                    Potential red flags are triaged via explicit clinical rules, never unverified LLM hallucinations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-2">
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Rule-Based Triage:</span> High-risk presentations trigger priority alerts on physician queues.
                  </div>
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">No Autonomous Diagnosis:</span> System strictly serves as decision support, keeping physicians in full control.
                  </div>
                </CardContent>
              </Card>

              {/* Pillar 3 */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 mb-2">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <CardTitle>3. Clinical Interoperability</CardTitle>
                  <CardDescription>
                    Physician verified records transform cleanly into standard interoperable health payloads.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-2">
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">FHIR R4 Bundle:</span> Deterministic serialization into Condition, Observation, and Medication resources.
                  </div>
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">ABDM Readiness:</span> Adapter architecture for consent artifacts and Health Information Provider (HIP) exchange.
                  </div>
                </CardContent>
              </Card>
            </div>
          </PageContainer>
        </section>

        {/* System Architecture Callout */}
        <section className="py-12 border-t border-slate-200 bg-white">
          <PageContainer size="xl">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-sky-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Architecture Guarantee
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Decoupled AI Engine with Mock Fallback
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  MediKiosk operates through a clean provider abstraction (`AIProvider`). If Gemini multimodal API access is interrupted or throttled, the system fails over seamlessly to `MockAIProvider` without breaking the live demonstration.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <Link
                  href="/patient"
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
                >
                  Patient Portal
                </Link>
                <Link
                  href="/doctor/interoperability"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-xs hover:bg-slate-50"
                >
                  Interoperability Spec
                </Link>
              </div>
            </div>
          </PageContainer>
        </section>
      </main>

      <Footer />
    </div>
  );
}
