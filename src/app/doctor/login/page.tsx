"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Building2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginPhysicianAction } from "@/app/actions/auth";
import { AUTHORIZED_PHYSICIANS } from "@/lib/auth/physician-constants";
import { Suspense } from "react";

function DoctorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/doctor/patients";
  const isExpired = searchParams.get("expired") === "1";

  const [physicianId, setPhysicianId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(
    isExpired ? "Your clinical workstation session has expired. Please sign in again." : null
  );
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!physicianId.trim() || !passcode.trim()) {
      setErrorMsg("Please provide your Physician ID and Passcode.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await loginPhysicianAction(physicianId, passcode);
      if (res.success) {
        router.push(redirectTarget);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Authentication failed.");
      }
    });
  };

  const handleQuickFill = (id: string, pass: string) => {
    setPhysicianId(id);
    setPasscode(pass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-100/80 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md mb-1">
            <Stethoscope className="h-6 w-6 text-sky-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Physician Workstation Portal
          </h1>
          <p className="text-xs text-slate-600">
            Secure clinical verification &amp; pre-consultation case triage
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white text-[11px]">
              Authorized Medical Personnel Only
            </Badge>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-sky-600" />
              <span>Provider Sign-In</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your clinical registration identifier to access patient queues and records.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Physician ID / Medical Registration:
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={physicianId}
                    onChange={(e) => setPhysicianId(e.target.value)}
                    placeholder="e.g. DOC-MH-40182"
                    className="font-mono text-xs uppercase"
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Clinical Passcode:
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="••••••••"
                    className="text-xs"
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              {/* One-Click Demo Accounts for SIH Evaluators */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  SIH Evaluator Demo Credentials:
                </span>
                <div className="space-y-1.5">
                  {Object.values(AUTHORIZED_PHYSICIANS).map((doc) => (
                    <button
                      key={doc.physicianId}
                      type="button"
                      onClick={() => handleQuickFill(doc.physicianId, doc.passcode)}
                      className="w-full text-left rounded-md border border-slate-200 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-300 p-2 text-xs transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">
                            {doc.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {doc.physicianId} &bull; {doc.department}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-white">
                        Use Demo
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center gap-2 py-2 text-xs font-semibold shadow-xs"
                disabled={isPending}
              >
                {isPending ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Enter Physician Workstation</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>

              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-slate-800 text-center pt-1"
              >
                &larr; Return to Patient Portal
              </Link>
            </CardFooter>
          </form>
        </Card>

        {/* Security / Compliance Guard */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Audit-logged access &bull; End-to-end clinical provenance</span>
          </p>
          <p>MediKiosk Clinical Decision Support &bull; DISHA &amp; ABDM Compliant Architecture</p>
        </div>
      </div>
    </div>
  );
}

export default function DoctorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
        </div>
      }
    >
      <DoctorLoginForm />
    </Suspense>
  );
}
