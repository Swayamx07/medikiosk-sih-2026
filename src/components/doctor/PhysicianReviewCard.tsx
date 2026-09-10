"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ShieldCheck,
  FileText,
  Clock,
  UserCheck,
  Sparkles,
  Layers,
  Lock,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PhysicianVerificationModal } from "@/components/doctor/PhysicianVerificationModal";
import type { SessionStatus, PhysicianReviewRecord } from "@/types/clinical";

interface PhysicianReviewCardProps {
  sessionId: string;
  sessionCode: string;
  status: SessionStatus;
  initialSummary?: string | null;
  physicianReview?: PhysicianReviewRecord | null;
}

function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return "N/A";
  try {
    return new Date(isoStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

export function PhysicianReviewCard({
  sessionId,
  sessionCode,
  status,
  initialSummary,
  physicianReview,
}: PhysicianReviewCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isVerified = status === "verified" || Boolean(physicianReview?.isVerified);

  // Listen to header verify button clicks
  useEffect(() => {
    const handleOpen = () => {
      if (!isVerified) {
        setIsModalOpen(true);
      }
    };
    window.addEventListener("medikiosk:open-verification-modal", handleOpen);
    return () => {
      window.removeEventListener("medikiosk:open-verification-modal", handleOpen);
    };
  }, [isVerified]);

  const handleVerificationSuccess = () => {
    // Refresh server page data to render newly persisted physician review record
    router.refresh();
  };

  return (
    <>
      <Card
        id="physician-review-protocol"
        className={
          isVerified
            ? "border-emerald-200 bg-white shadow-xs overflow-hidden"
            : "border-slate-200"
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isVerified ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-slate-600" />
              )}
              <CardTitle className="text-base">
                {isVerified ? "Physician Review & Sign-Off" : "Review Protocol"}
              </CardTitle>
            </div>
            <Badge
              variant={isVerified ? "success" : "secondary"}
              className="text-[10px]"
            >
              {isVerified ? "Verified ✓" : "Pending Sign-off"}
            </Badge>
          </div>
        </CardHeader>

        {isVerified ? (
          /* Verified State: Immutable Read-Only Record */
          <CardContent className="space-y-3.5 text-xs text-slate-700">
            {/* Verifying Physician & Timestamp */}
            <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>
                    {physicianReview?.physicianName || "Attending Physician"}
                  </span>
                </div>
                {physicianReview?.physicianId && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-emerald-800 border-emerald-300 bg-white"
                  >
                    {physicianReview.physicianId}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/50">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-emerald-600" />
                  <span>
                    Signed off on {formatDateTime(physicianReview?.verifiedAt)}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  Authenticated Session
                </span>
              </div>
            </div>

            {/* Attending Physician Notes */}
            {physicianReview?.physicianNotes && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-slate-400" />
                  <span>Physician Clinical Notes</span>
                </span>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 leading-relaxed italic">
                  &ldquo;{physicianReview.physicianNotes}&rdquo;
                </div>
              </div>
            )}

            {/* Physician Amended Clinical Summary (if any) */}
            {physicianReview?.editedClinicalSummary && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>Amended Clinical Summary</span>
                  </span>
                  <Badge
                    variant="warning"
                    className="text-[9px] bg-amber-50 text-amber-800 border-amber-200"
                  >
                    Physician Edited
                  </Badge>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50/40 p-2 text-xs text-amber-950 leading-relaxed">
                  {physicianReview.editedClinicalSummary}
                </div>
              </div>
            )}

            {/* Reconciliation Adjustments (if any) */}
            {physicianReview?.reconciliationChanges?.entries &&
              physicianReview.reconciliationChanges.entries.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-sky-600" />
                      <span>Reconciled Adjustments</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {physicianReview.reconciliationChanges.entries.length} recorded
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {physicianReview.reconciliationChanges.entries.map(
                      (item, idx) => (
                        <div
                          key={idx}
                          className="rounded border border-slate-200 bg-slate-50/70 p-2 text-[11px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 capitalize">
                              {item.itemName}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] uppercase font-mono text-slate-600 border-slate-300 bg-white"
                            >
                              {item.action}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-500 capitalize">
                            Section: {item.section.replace(/_/g, " ")}
                          </p>
                          {item.updatedValue && (
                            <p className="text-[10px] text-slate-700">
                              <span className="font-medium text-slate-900">Value:</span>{" "}
                              {item.updatedValue}
                            </p>
                          )}
                          {item.reason && (
                            <p className="text-[10px] text-slate-500 italic">
                              Reason: {item.reason}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Non-Repudiation Lock Notice */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>
                Physician verified under authenticated session. Signed off by attending physician.
              </span>
            </div>
          </CardContent>
        ) : (
          /* Unverified State: Review & Sign-Off Action */
          <>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                All patient conversational answers and triage alerts are captured directly from the patient kiosk.
              </p>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold text-slate-700 block">
                  Clinical Audit Guard:
                </span>
                <span>
                  Verification requires attending physician clinical review, notes, and explicit medical sign-off.
                </span>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 pt-3 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                className="text-xs gap-1.5 bg-sky-700 hover:bg-sky-800 text-white"
                onClick={() => setIsModalOpen(true)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-200" />
                <span>Sign Off Encounter</span>
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Verification Modal Dialog */}
      {isModalOpen && (
        <PhysicianVerificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sessionId={sessionId}
          sessionCode={sessionCode}
          initialSummary={initialSummary}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </>
  );
}
