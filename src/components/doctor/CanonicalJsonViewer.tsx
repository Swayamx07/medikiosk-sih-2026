"use client";

import React, { useState } from "react";
import { Check, Copy, Download, Code2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface CanonicalJsonViewerProps {
  sessionCode: string;
  record: unknown;
}

export function CanonicalJsonViewer({ sessionCode, record }: CanonicalJsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const jsonString = JSON.stringify(record, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON to clipboard", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `encounter-${sessionCode.toLowerCase()}-canonical.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Canonical Clinical Encounter Record
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono border-slate-300 text-slate-600 bg-white">
                v1.0 JSON
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Provenance-anchored clinical contract separating patient answers, document OCR, and deterministic triage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 font-medium mr-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Deterministic Triage</span>
          </div>

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
                <span>Copy JSON</span>
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
            <span>Export</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
            aria-label={isExpanded ? "Collapse JSON" : "Expand JSON"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* JSON Viewer Body */}
      {isExpanded && (
        <div className="relative">
          <pre className="max-h-[480px] overflow-auto p-4 text-[12px] font-mono leading-relaxed bg-slate-950 text-slate-100 selection:bg-sky-700 selection:text-white">
            <code>{jsonString}</code>
          </pre>
          <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
            UTF-8 &bull; Read-Only Canonical Contract
          </div>
        </div>
      )}
    </div>
  );
}
