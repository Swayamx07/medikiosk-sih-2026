"use client";

import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PhysicianHeaderVerifyButtonProps {
  isVerified: boolean;
  sessionId: string;
  verifiedByName?: string | null;
  verifiedAt?: string | null;
}

export function PhysicianHeaderVerifyButton({
  isVerified,
  verifiedByName,
  verifiedAt,
}: PhysicianHeaderVerifyButtonProps) {
  if (isVerified) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-2xs"
        role="status"
        aria-label="Encounter is clinically verified"
        title={
          verifiedByName
            ? `Verified by ${verifiedByName}${
                verifiedAt
                  ? ` on ${new Date(verifiedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`
                  : ""
              }`
            : "Encounter verified by attending physician"
        }
      >
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Verified Encounter</span>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      className="gap-1.5 bg-sky-700 hover:bg-sky-800 text-white shadow-xs focus-visible:ring-sky-600"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("medikiosk:open-verification-modal")
        );
      }}
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-sky-200" />
      <span>Verify &amp; Sign Off</span>
    </Button>
  );
}
