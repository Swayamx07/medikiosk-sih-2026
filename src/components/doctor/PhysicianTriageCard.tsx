import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Activity,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type {
  PriorityLevel,
  TriageAlertRecord,
  CanonicalEncounterRecord,
} from "@/types/clinical";

export interface PhysicianTriageCardProps {
  priority: PriorityLevel;
  hasCriticalRedFlag?: boolean;
  triageAlerts?: TriageAlertRecord[];
  canonicalTriage?: CanonicalEncounterRecord["triage"] | null;
  className?: string;
}

export interface ResolvedTriageDisplayData {
  variant: "emergency" | "urgent" | "normal";
  title: string;
  badgeLabel: string;
  ruleId?: string;
  reason: string;
  detectedSymptoms: string[];
  evaluatedBy: string;
  ariaLabel: string;
  safetyAdvisory: string;
}

/**
 * Pure deterministic resolver that extracts display attributes from existing
 * server-persisted triage data.
 *
 * Safety Invariants:
 * 1. Strictly presentation-only: never recalculates triage or runs regexes.
 * 2. Never calls generative AI / LLM.
 * 3. Never mutates triage state.
 * 4. Never fabricates rule IDs or symptoms when missing from authoritative data.
 * 5. Consistently attaches non-diagnostic clinical safety disclaimers.
 */
export function resolveTriageDisplayData({
  priority,
  hasCriticalRedFlag = false,
  triageAlerts = [],
  canonicalTriage = null,
}: PhysicianTriageCardProps): ResolvedTriageDisplayData {
  const isEmergency =
    priority === "emergency" ||
    hasCriticalRedFlag ||
    Boolean(canonicalTriage?.criticalRedFlag);

  const isUrgent = priority === "urgent" && !isEmergency;

  const primaryAlert = triageAlerts.length > 0 ? triageAlerts[0] : null;

  // Rule ID only if explicitly present in authoritative records (never fabricated)
  const ruleId = canonicalTriage?.ruleId || primaryAlert?.triggerRuleId || undefined;

  const evaluatedBy =
    canonicalTriage?.evaluatedBy || "deterministic_safety_engine";

  const detectedSymptoms: string[] =
    canonicalTriage?.detectedSymptoms && canonicalTriage.detectedSymptoms.length > 0
      ? canonicalTriage.detectedSymptoms
      : primaryAlert?.triggerSymptoms && primaryAlert.triggerSymptoms.length > 0
      ? primaryAlert.triggerSymptoms
      : [];

  if (isEmergency) {
    return {
      variant: "emergency",
      title: "Critical Red Flag — Emergency Priority",
      badgeLabel: "Emergency Priority",
      ruleId,
      reason:
        canonicalTriage?.reason ||
        primaryAlert?.triggerReason ||
        "Patient reports symptoms meeting criteria for immediate clinical triage evaluation.",
      detectedSymptoms,
      evaluatedBy,
      ariaLabel: "Clinical Safety Triage Assessment: Critical Red Flag",
      safetyAdvisory:
        "Algorithmic triage indicator. Not a diagnosis. Requires physician clinical evaluation.",
    };
  }

  if (isUrgent) {
    return {
      variant: "urgent",
      title: "Urgent Priority — Prompt Clinical Review",
      badgeLabel: "Urgent Priority",
      ruleId,
      reason:
        canonicalTriage?.reason ||
        primaryAlert?.triggerReason ||
        "Encounter flagged for prioritized physician review based on intake history.",
      detectedSymptoms,
      evaluatedBy,
      ariaLabel: "Clinical Safety Triage Assessment: Urgent Priority",
      safetyAdvisory:
        "Algorithmic triage indicator. Not a diagnosis. Requires physician clinical evaluation.",
    };
  }

  return {
    variant: "normal",
    title: "Standard Priority — Routine Outpatient Review",
    badgeLabel: "Standard",
    ruleId: undefined,
    reason:
      canonicalTriage?.reason ||
      "Deterministic clinical safety rules evaluated patient intake dialogue. No acute emergency or red-flag criteria were triggered during conversational screening.",
    detectedSymptoms: [],
    evaluatedBy,
    ariaLabel: "Clinical Safety Triage Assessment: Standard Priority",
    safetyAdvisory:
      "Pre-consultation safety triage does not rule out underlying clinical pathology. Full physician clinical evaluation required.",
  };
}

/**
 * PhysicianTriageCard
 *
 * Dedicated READ-ONLY clinical safety triage summary component.
 * Visualizes existing deterministic triage assessment for the attending physician.
 */
export function PhysicianTriageCard(props: PhysicianTriageCardProps) {
  const data = resolveTriageDisplayData(props);
  const className = props.className || "";

  // --------------------------------------------------------------------------
  // VARIANT A: Emergency / Critical Red Flag
  // --------------------------------------------------------------------------
  if (data.variant === "emergency") {
    return (
      <section
        role="region"
        aria-label={data.ariaLabel}
        className={`rounded-lg border border-red-200 bg-red-50 p-4 text-red-950 space-y-3 shadow-xs ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-red-200/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-md bg-red-100 text-red-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-red-950 tracking-tight">
                  {data.title}
                </h3>
                <Badge
                  variant="destructive"
                  className="text-[10px] gap-1 shadow-2xs font-semibold uppercase"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {data.badgeLabel}
                </Badge>
                {data.ruleId && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-red-300 text-red-800 bg-red-100/50"
                  >
                    {data.ruleId}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-red-800/80 self-start sm:self-auto font-mono">
            <span>Evaluator:</span>
            <Badge
              variant="outline"
              className="text-[10px] font-mono bg-white text-red-800 border-red-200"
            >
              {data.evaluatedBy}
            </Badge>
          </div>
        </div>

        {/* Triage Rationale Statement */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-900 block">
            Clinical Triage Rationale:
          </span>
          <p className="text-xs text-red-900 leading-relaxed font-normal">
            {data.reason}
          </p>
        </div>

        {/* Trigger Entities / Evidence */}
        {data.detectedSymptoms.length > 0 && (
          <div className="pt-2 border-t border-red-200/70 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-900">
              <Activity className="h-3.5 w-3.5 text-red-600" />
              <span>Trigger Entities (Source: Patient Dialogue):</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {data.detectedSymptoms.map((sym, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-[10px] uppercase font-mono bg-white text-red-800 border-red-200 shadow-2xs"
                >
                  {sym.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Non-Diagnostic Safety Notice */}
        <div className="pt-2 border-t border-red-200/70 flex items-start gap-1.5 text-[11px] text-red-800/90 leading-snug">
          <Info className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold">Clinical Safety Advisory:</span>{" "}
            {data.safetyAdvisory}
          </p>
        </div>
      </section>
    );
  }

  // --------------------------------------------------------------------------
  // VARIANT B: Urgent Priority
  // --------------------------------------------------------------------------
  if (data.variant === "urgent") {
    return (
      <section
        role="region"
        aria-label={data.ariaLabel}
        className={`rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-amber-950 space-y-3 shadow-xs ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-amber-200/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-md bg-amber-100 text-amber-800">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-amber-950 tracking-tight">
                {data.title}
              </h3>
              <Badge variant="warning" className="text-[10px] font-semibold uppercase">
                {data.badgeLabel}
              </Badge>
              {data.ruleId && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-amber-300 text-amber-900 bg-white"
                >
                  {data.ruleId}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-mono self-start sm:self-auto">
            <span>Evaluator:</span>
            <Badge
              variant="outline"
              className="text-[10px] font-mono bg-white text-amber-800 border-amber-200"
            >
              {data.evaluatedBy}
            </Badge>
          </div>
        </div>

        {/* Triage Rationale */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900 block">
            Triage Assessment Note:
          </span>
          <p className="text-xs text-amber-900 leading-relaxed font-normal">
            {data.reason}
          </p>
        </div>

        {/* Trigger Entities if any */}
        {data.detectedSymptoms.length > 0 && (
          <div className="pt-2 border-t border-amber-200/70 space-y-1.5">
            <span className="text-[11px] font-semibold text-amber-900 block">
              Associated Findings (Source: Patient Dialogue):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {data.detectedSymptoms.map((sym, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-[10px] uppercase font-mono bg-white text-amber-800 border-amber-200"
                >
                  {sym.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Non-Diagnostic Safety Notice */}
        <div className="pt-2 border-t border-amber-200/70 flex items-start gap-1.5 text-[11px] text-amber-900/90 leading-snug">
          <Info className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold">Clinical Safety Advisory:</span>{" "}
            {data.safetyAdvisory}
          </p>
        </div>
      </section>
    );
  }

  // --------------------------------------------------------------------------
  // VARIANT C: Standard Priority (Normal)
  // --------------------------------------------------------------------------
  return (
    <section
      role="region"
      aria-label={data.ariaLabel}
      className={`rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-slate-800 shadow-2xs space-y-2.5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-white border border-slate-200 text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-900">
              {data.title}
            </h3>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {data.badgeLabel}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50/60"
            >
              Zero Red Flags Detected
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono self-start sm:self-auto">
          <span>Evaluator:</span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono bg-white text-slate-600 border-slate-200"
          >
            {data.evaluatedBy}
          </Badge>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-slate-700 leading-relaxed">
          {data.reason}
        </p>
      </div>

      {/* Non-Diagnostic Safety Notice */}
      <div className="pt-2 border-t border-slate-200/80 flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
        <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <span className="font-medium text-slate-600">Clinical Safety Advisory:</span>{" "}
          {data.safetyAdvisory}
        </p>
      </div>
    </section>
  );
}
