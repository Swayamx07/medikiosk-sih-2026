"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileCode,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getEncounterFhirBundleAction } from "@/app/actions/doctor";
import { FhirBundle } from "@/types/fhir-r4";

interface FhirBundleViewerProps {
  sessionId: string;
  sessionCode?: string;
}

type ResourceFilter =
  | "all"
  | "Patient"
  | "Encounter"
  | "Condition"
  | "Observation"
  | "MedicationStatement"
  | "AllergyIntolerance"
  | "DocumentReference"
  | "RiskAssessment";

const FILTER_LABELS: Record<ResourceFilter, string> = {
  all: "All Resources",
  Patient: "Patient",
  Encounter: "Encounter",
  Condition: "Conditions",
  Observation: "Observations",
  MedicationStatement: "Medications",
  AllergyIntolerance: "Allergies",
  DocumentReference: "Documents",
  RiskAssessment: "Risk Assessment",
};

export function FhirBundleViewer({ sessionId, sessionCode }: FhirBundleViewerProps) {
  const [bundle, setBundle] = useState<FhirBundle | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(sessionId));
  const [error, setError] = useState<string | null>(sessionId ? null : "Session identifier is required.");
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<ResourceFilter>("all");
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isMounted = true;

    getEncounterFhirBundleAction(sessionId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.bundle) {
          setBundle(res.bundle);
        } else {
          if (res.error?.includes("Unauthorized")) {
            setError("Physician authentication required.");
          } else if (res.error?.includes("not found")) {
            setError("FHIR bundle could not be generated for this encounter.");
          } else {
            setError(res.error || "Failed to generate FHIR R4 bundle.");
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setError("An unexpected error occurred while loading the FHIR bundle.");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  // Derive dynamic resource counts from actual bundle entries
  const resourceCounts = useMemo(() => {
    if (!bundle?.entry) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const entry of bundle.entry) {
      const type = entry.resource?.resourceType;
      if (type) {
        counts[type] = (counts[type] || 0) + 1;
      }
    }
    return counts;
  }, [bundle]);

  // Filtered dataset for JSON display
  const displayedData = useMemo(() => {
    if (!bundle) return null;
    if (selectedFilter === "all") {
      return bundle;
    }
    const matchingEntries = bundle.entry.filter(
      (e) => e.resource.resourceType === selectedFilter
    );
    if (matchingEntries.length === 1) {
      return matchingEntries[0].resource;
    }
    return matchingEntries.map((e) => e.resource);
  }, [bundle, selectedFilter]);

  const displayedJsonString = useMemo(() => {
    if (!displayedData) return "";
    return JSON.stringify(displayedData, null, 2);
  }, [displayedData]);

  // Selected filter matching count
  const currentSelectionCount = useMemo(() => {
    if (!bundle) return 0;
    if (selectedFilter === "all") return bundle.entry.length;
    return resourceCounts[selectedFilter] || 0;
  }, [bundle, selectedFilter, resourceCounts]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedJsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy FHIR JSON to clipboard", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([displayedJsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const code = (sessionCode || sessionId.slice(0, 8)).toLowerCase();
    const suffix = selectedFilter === "all" ? "bundle" : selectedFilter.toLowerCase();
    link.href = url;
    link.download = `encounter-${code}-${suffix}.fhir.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Loading State
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center space-y-3 shadow-2xs">
        <div className="flex justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-sky-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            Generating FHIR R4 Bundle
          </p>
          <p className="text-xs text-slate-500">
            Serializing verified canonical clinical encounter into HL7 FHIR Release 4 standard...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/70 p-6 text-red-950 space-y-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-950">
              FHIR R4 Interoperability Error
            </h4>
            <p className="text-xs text-red-800 leading-relaxed">{error}</p>
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="text-xs gap-1.5 border-red-300 text-red-900 bg-white hover:bg-red-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Generation</span>
          </Button>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-2xs">
        FHIR bundle could not be generated for this encounter.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs space-y-0">
      {/* Header */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700 shrink-0">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  FHIR R4 Interoperability
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-sky-300 bg-sky-50 text-sky-800"
                >
                  FHIR R4 (v4.0.1)
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-sans border-emerald-300 bg-emerald-50 text-emerald-800"
                >
                  Generated from Canonical Clinical Record
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Deterministic HL7 FHIR export with internal reference resolution. No live ABDM gateway connectivity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-xs bg-white hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy FHIR JSON</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5 text-xs bg-white hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export .fhir.json</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
              aria-label={isExpanded ? "Collapse FHIR viewer" : "Expand FHIR viewer"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Dynamic Resource Count Summary Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
          <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Layers className="h-3 w-3 text-slate-400" />
            <span>Payload Summary:</span>
          </span>
          <Badge variant="secondary" className="text-[10px] font-medium bg-slate-100 text-slate-700">
            Total Entries: {bundle.total}
          </Badge>
          {Object.entries(resourceCounts).map(([type, count]) => (
            <Badge
              key={type}
              variant="outline"
              className="text-[10px] border-slate-200 bg-white text-slate-700 font-medium"
            >
              {type}: {count}
            </Badge>
          ))}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Resource Filter Tabs */}
          <div className="px-4 py-2.5 bg-slate-50/40 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-medium text-slate-500 mr-1 shrink-0">
              Filter View:
            </span>
            {(
              [
                "all",
                "Patient",
                "Encounter",
                "Condition",
                "Observation",
                "MedicationStatement",
                "AllergyIntolerance",
                "DocumentReference",
                "RiskAssessment",
              ] as ResourceFilter[]
            ).map((filter) => {
              const count =
                filter === "all" ? bundle.entry.length : resourceCounts[filter] || 0;
              const isSelected = selectedFilter === filter;

              // Only show filter buttons if resource is present in bundle or is 'all'
              if (filter !== "all" && count === 0) {
                return null;
              }

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                    isSelected
                      ? "bg-sky-700 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{FILTER_LABELS[filter]}</span>
                  <span
                    className={`rounded px-1 text-[10px] ${
                      isSelected
                        ? "bg-sky-800 text-sky-100"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* JSON Viewer Info Bar */}
          <div className="px-4 py-1.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {selectedFilter === "all"
                  ? `Bundle (${bundle.id}) — ${bundle.total} entries`
                  : `${selectedFilter} (${currentSelectionCount} resource${
                      currentSelectionCount === 1 ? "" : "s"
                    })`}
              </span>
            </div>
            <span>application/fhir+json</span>
          </div>

          {/* Monospaced JSON Viewer Body */}
          <div className="relative">
            <pre className="max-h-[500px] overflow-auto p-4 text-[12px] font-mono leading-relaxed bg-slate-950 text-slate-100 selection:bg-sky-700 selection:text-white">
              <code>{displayedJsonString}</code>
            </pre>
            <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
              HL7 FHIR R4 &bull; Deterministic Serialization
            </div>
          </div>

          {/* Clinical Safety / Trust Footer Notice */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200">
            <div className="rounded-md border border-sky-100 bg-sky-50/70 p-2.5 text-[11px] text-sky-950 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold text-sky-900">Interoperability Notice:</span>{" "}
                FHIR data is generated from the structured clinical record. Patient-reported and document-extracted information retains its source/verification status. This export does not represent an autonomous diagnosis.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
