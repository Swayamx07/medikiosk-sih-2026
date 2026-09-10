"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { verifyAndSignOffEncounterAction } from "@/app/actions/doctor";
import type {
  PhysicianVerificationPayload,
  ClinicalReconciliationItem,
  ClinicalReconciliationSection,
  ClinicalReconciliationAction,
} from "@/types/clinical";

const RECONCILIATION_SECTIONS: { value: ClinicalReconciliationSection; label: string }[] = [
  { value: "chief_complaint", label: "Chief Complaint" },
  { value: "symptoms", label: "Reported Symptoms" },
  { value: "past_medical_history", label: "Past Medical History" },
  { value: "medications", label: "Current Medications" },
  { value: "allergies", label: "Known Allergies" },
  { value: "laboratory_investigations", label: "Laboratory Investigations" },
  { value: "documented_conditions", label: "Documented Conditions" },
  { value: "triage_priority", label: "Triage Priority" },
  { value: "other", label: "Other Clinical Finding" },
];

const RECONCILIATION_ACTIONS: { value: ClinicalReconciliationAction; label: string }[] = [
  { value: "modified", label: "Modified / Corrected" },
  { value: "added", label: "Added Finding" },
  { value: "removed", label: "Removed / Retracted" },
  { value: "confirmed", label: "Clinically Confirmed" },
];

const MAX_NOTES_LENGTH = 10000;

interface PhysicianVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionCode: string;
  initialSummary?: string | null;
  onSuccess: () => void;
}

export function PhysicianVerificationModal({
  isOpen,
  onClose,
  sessionId,
  sessionCode,
  initialSummary = "",
  onSuccess,
}: PhysicianVerificationModalProps) {
  const [physicianNotes, setPhysicianNotes] = useState("");
  const [editedClinicalSummary, setEditedClinicalSummary] = useState(
    initialSummary || ""
  );
  const [showSummaryEditor, setShowSummaryEditor] = useState(false);
  const [reconciliationEntries, setReconciliationEntries] = useState<
    ClinicalReconciliationItem[]
  >([]);
  const [reconciliationNotes, setReconciliationNotes] = useState("");
  const [confirmSignOff, setConfirmSignOff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isSummaryAmended =
    editedClinicalSummary.trim() !== (initialSummary || "").trim();

  const handleAddReconciliationEntry = () => {
    setReconciliationEntries((prev) => [
      ...prev,
      {
        section: "symptoms",
        action: "modified",
        itemName: "",
        previousValue: "",
        updatedValue: "",
        reason: "",
      },
    ]);
  };

  const handleUpdateReconciliationEntry = (
    index: number,
    field: keyof ClinicalReconciliationItem,
    value: string
  ) => {
    setReconciliationEntries((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleRemoveReconciliationEntry = (index: number) => {
    setReconciliationEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Client-side validations
    const trimmedNotes = physicianNotes.trim();
    if (!trimmedNotes) {
      setErrorMessage("Physician clinical notes are required for sign-off.");
      return;
    }

    if (trimmedNotes.length > MAX_NOTES_LENGTH) {
      setErrorMessage(
        `Physician notes exceed maximum length of ${MAX_NOTES_LENGTH.toLocaleString()} characters.`
      );
      return;
    }

    if (!confirmSignOff) {
      setErrorMessage(
        "You must explicitly confirm clinical responsibility before completing sign-off."
      );
      return;
    }

    // Filter out invalid or blank reconciliation entries if any added
    const validEntries = reconciliationEntries
      .map((entry) => ({
        ...entry,
        itemName: entry.itemName.trim(),
        previousValue: entry.previousValue?.trim() || undefined,
        updatedValue: entry.updatedValue?.trim() || undefined,
        reason: entry.reason?.trim() || undefined,
      }))
      .filter((entry) => entry.itemName.length > 0);

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: PhysicianVerificationPayload = {
        sessionId,
        physicianNotes: trimmedNotes,
        editedClinicalSummary: isSummaryAmended
          ? editedClinicalSummary.trim()
          : null,
        reconciliationChanges:
          validEntries.length > 0
            ? {
                entries: validEntries,
                reconciliationNotes: reconciliationNotes.trim() || undefined,
              }
            : null,
        confirmSignOff: true,
      };

      const result = await verifyAndSignOffEncounterAction(payload);

      if (!result.success) {
        setErrorMessage(
          result.error ||
            "An unexpected error occurred during encounter verification. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      // Verification successful
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Sign-off error:", err);
      setErrorMessage(
        "A network or client error occurred while submitting verification."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-verification-title"
    >
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="modal-verification-title"
                  className="text-base font-bold text-slate-900"
                >
                  Physician Encounter Sign-Off
                </h3>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-slate-600 bg-white border-slate-300"
                >
                  {sessionCode}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Review clinical intake, record notes &amp; reconciliation, and sign off this encounter.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-red-900 text-xs flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-red-950">Verification Action Failed</p>
                <p className="text-red-800">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Section 1: Physician Clinical Notes (Required) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="physician-notes-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-sky-700" />
                <span>Attending Physician Clinical Notes</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  physicianNotes.length > MAX_NOTES_LENGTH
                    ? "text-red-600 font-bold"
                    : "text-slate-400"
                }`}
              >
                {physicianNotes.length.toLocaleString()} / {MAX_NOTES_LENGTH.toLocaleString()}
              </span>
            </div>
            <textarea
              id="physician-notes-input"
              rows={4}
              required
              disabled={isSubmitting}
              value={physicianNotes}
              onChange={(e) => setPhysicianNotes(e.target.value)}
              placeholder="Record clinical impressions, diagnosis confirmation, treatment recommendations, or follow-up directives..."
              className="w-full rounded-md border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:border-sky-600 disabled:bg-slate-50 disabled:cursor-not-allowed leading-relaxed shadow-2xs"
            />
            <p className="text-[11px] text-slate-500 italic">
              These notes are permanently linked to the encounter under your verified physician identity.
            </p>
          </div>

          {/* Section 2: Optional Clinical Summary Editing */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Synthesized Clinical Summary
                </span>
                {isSummaryAmended ? (
                  <Badge variant="warning" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300">
                    Physician Amended
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300 bg-white">
                    AI Baseline
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSummaryEditor(!showSummaryEditor)}
                className="h-7 text-xs text-sky-700 hover:text-sky-800"
              >
                {showSummaryEditor ? "Hide Summary Editor" : "Edit Summary"}
              </Button>
            </div>

            {showSummaryEditor ? (
              <div className="space-y-2 pt-1">
                <textarea
                  id="clinical-summary-editor"
                  rows={3}
                  disabled={isSubmitting}
                  value={editedClinicalSummary}
                  onChange={(e) => setEditedClinicalSummary(e.target.value)}
                  placeholder="Review or amend synthesized clinical summary..."
                  className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Editing creates an amended physician narrative without modifying raw dialogue or OCR data.
                  </span>
                  {isSummaryAmended && (
                    <button
                      type="button"
                      onClick={() => setEditedClinicalSummary(initialSummary || "")}
                      className="text-xs text-sky-600 hover:underline"
                    >
                      Reset to AI Baseline
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-700 leading-relaxed bg-white rounded border border-slate-200/80 p-2.5 italic">
                {editedClinicalSummary || "No initial clinical narrative available."}
              </div>
            )}
          </div>

          {/* Section 3: Clinical Reconciliation & Corrections (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Clinical Reconciliation &amp; Finding Adjustments
                </span>
                <span className="text-[11px] text-slate-500">
                  Optional: Record corrections or confirmation for specific findings (symptoms, meds, allergies).
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReconciliationEntry}
                disabled={isSubmitting}
                className="h-7 text-xs gap-1 bg-white hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5 text-sky-600" />
                <span>Add Item</span>
              </Button>
            </div>

            {reconciliationEntries.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-xs text-slate-400 italic">
                No reconciliation adjustments added. Sign-off will confirm AI-captured findings without corrections.
              </div>
            ) : (
              <div className="space-y-3">
                {reconciliationEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700">
                        Adjustment #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReconciliationEntry(idx)}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        aria-label={`Remove adjustment ${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                          Domain Section
                        </label>
                        <select
                          disabled={isSubmitting}
                          value={entry.section}
                          onChange={(e) =>
                            handleUpdateReconciliationEntry(
                              idx,
                              "section",
                              e.target.value as ClinicalReconciliationSection
                            )
                          }
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 focus-visible:ring-1 focus-visible:ring-sky-600"
                        >
                          {RECONCILIATION_SECTIONS.map((sec) => (
                            <option key={sec.value} value={sec.value}>
                              {sec.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                          Clinical Action
                        </label>
                        <select
                          disabled={isSubmitting}
                          value={entry.action}
                          onChange={(e) =>
                            handleUpdateReconciliationEntry(
                              idx,
                              "action",
                              e.target.value as ClinicalReconciliationAction
                            )
                          }
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 focus-visible:ring-1 focus-visible:ring-sky-600"
                        >
                          {RECONCILIATION_ACTIONS.map((act) => (
                            <option key={act.value} value={act.value}>
                              {act.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                        Item Name / Finding
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={entry.itemName}
                        onChange={(e) =>
                          handleUpdateReconciliationEntry(idx, "itemName", e.target.value)
                        }
                        placeholder="e.g., Metformin dosage, Penicillin allergy"
                        className="w-full h-8 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-sky-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                          Previous Intake Value (Optional)
                        </label>
                        <input
                          type="text"
                          disabled={isSubmitting}
                          value={entry.previousValue || ""}
                          onChange={(e) =>
                            handleUpdateReconciliationEntry(
                              idx,
                              "previousValue",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 500mg daily / None"
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                          Reconciled / Corrected Value
                        </label>
                        <input
                          type="text"
                          disabled={isSubmitting}
                          value={entry.updatedValue || ""}
                          onChange={(e) =>
                            handleUpdateReconciliationEntry(
                              idx,
                              "updatedValue",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 850mg twice daily / Verified severe rash"
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                        Clinical Justification / Reason
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={entry.reason || ""}
                        onChange={(e) =>
                          handleUpdateReconciliationEntry(idx, "reason", e.target.value)
                        }
                        placeholder="e.g., Patient clarified dosage schedule during clinical encounter"
                        className="w-full h-8 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                    General Reconciliation Notes (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={reconciliationNotes}
                    onChange={(e) => setReconciliationNotes(e.target.value)}
                    placeholder="e.g., All document extractions cross-referenced with physical prescription."
                    className="w-full h-8 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Confirmation & Non-repudiation Safety Guard */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-950 block">
                  Clinical Responsibility &amp; Verification Confirmation
                </span>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Completing this sign-off records the encounter as physician verified under your authenticated session.
                  AI-generated intake, extracted documents, and triage rules do not constitute verified clinical findings until signed off by the attending physician.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2.5 pt-2 border-t border-amber-200/80 cursor-pointer">
              <input
                type="checkbox"
                required
                disabled={isSubmitting}
                checked={confirmSignOff}
                onChange={(e) => setConfirmSignOff(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-sky-700 focus:ring-sky-600"
              />
              <span className="text-xs font-medium text-slate-900 select-none">
                I attest that I have reviewed the patient dialogue, symptoms, and uploaded records, and I confirm clinical responsibility for this signed encounter.
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || !confirmSignOff || !physicianNotes.trim()}
              className="text-xs gap-1.5 bg-sky-700 hover:bg-sky-800 text-white min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Signing Off...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Sign Off Encounter</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
