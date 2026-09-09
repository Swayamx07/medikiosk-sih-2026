"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Building2,
  Trash2,
  ExternalLink,
  Pill,
  Activity,
  FileCheck,
} from "lucide-react";
import { useIntake } from "@/context/IntakeContext";
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
import {
  uploadAndProcessDocumentAction,
  getSessionDocumentsAction,
  getDocumentSignedUrlAction,
} from "@/app/actions/documents";
import { PATIENT_I18N } from "@/lib/clinical/i18n";
import {
  DocumentType,
  UploadedDocumentRecord,
  DocumentExtractionRecord,
} from "@/types/clinical";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  lab_report: "Laboratory Test Report",
  prescription: "Doctor Prescription",
  discharge_summary: "Hospital Discharge Summary",
  radiology_report: "Radiology / Imaging Report",
  other: "Other Clinical Document",
};

export default function PatientDocumentsPage() {
  const router = useRouter();
  const { sessionId, patientProfile, setSessionStatus, selectedLanguage } = useIntake();
  const i18n = PATIENT_I18N[selectedLanguage] || PATIENT_I18N.en;

  const [documentType, setDocumentType] = useState<DocumentType>("lab_report");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "completed" | "failed"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocumentRecord[]>([]);
  const [extractions, setExtractions] = useState<DocumentExtractionRecord[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing session documents if session is active
  useEffect(() => {
    let isMounted = true;
    if (sessionId) {
      getSessionDocumentsAction(sessionId).then((res) => {
        if (isMounted && res.success) {
          setUploadedDocs(res.documents);
          setExtractions(res.extractions);
        }
      }).catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const refreshSessionDocuments = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await getSessionDocumentsAction(sessionId);
      if (res.success) {
        setUploadedDocs(res.documents);
        setExtractions(res.extractions);
      }
    } catch {
      // Non-critical background load error
    }
  }, [sessionId]);

  // File selection validation
  const handleValidateAndSetFile = (file: File) => {
    setFileValidationError(null);
    setErrorMessage(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileValidationError(
        `Invalid file type (${file.type || "unknown"}). Only PDF, JPEG, PNG, and WebP are allowed.`
      );
      setSelectedFile(null);
      return false;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setFileValidationError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 15 MB.`
      );
      setSelectedFile(null);
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleValidateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    if (!sessionId) {
      setErrorMessage(
        "Active clinical session not found. Please initialize session first."
      );
      return;
    }

    setUploadStatus("uploading");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sessionId", sessionId);
    if (patientProfile.id) {
      formData.append("patientId", patientProfile.id);
    }
    formData.append("documentType", documentType);

    try {
      setUploadStatus("processing");
      const result = await uploadAndProcessDocumentAction(formData);

      if (!result.success || !result.document) {
        setUploadStatus("failed");
        setErrorMessage(result.error || "Failed to process medical document.");
        return;
      }

      setUploadStatus("completed");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh document and extraction state
      await refreshSessionDocuments();
      setSessionStatus("documents_uploaded");
    } catch (err) {
      setUploadStatus("failed");
      setErrorMessage(
        err instanceof Error ? err.message : "Unexpected upload error occurred."
      );
    }
  };

  const handleOpenDocument = async (storagePath: string, docId: string) => {
    if (signedUrls[docId]) {
      window.open(signedUrls[docId], "_blank");
      return;
    }

    const res = await getDocumentSignedUrlAction(storagePath);
    if (res.success && res.signedUrl) {
      setSignedUrls((prev) => ({ ...prev, [docId]: res.signedUrl! }));
      window.open(res.signedUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Badge
          variant="outline"
          className="mb-2 text-sky-800 border-sky-300 bg-sky-50"
        >
          {i18n.steps.step6}
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {i18n.documents.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {i18n.documents.subtitle}
        </p>
      </div>

      {/* Main Upload Card */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{i18n.documents.cardTitle}</CardTitle>
          <CardDescription>
            {i18n.documents.cardDesc}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Document Type Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="docType"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              {i18n.documents.docTypeLabel}
            </label>
            <select
              id="docType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full sm:w-72 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
            >
              <option value="lab_report">Laboratory Test Report</option>
              <option value="prescription">Doctor Prescription</option>
              <option value="discharge_summary">Hospital Discharge Summary</option>
              <option value="radiology_report">Radiology / Imaging Report</option>
              <option value="other">Other Clinical Document</option>
            </select>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-sky-500 bg-sky-50/50"
                : "border-slate-300 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
              <UploadCloud className="h-6 w-6 text-sky-600" />
            </div>

            <h4 className="text-sm font-semibold text-slate-900">
              {i18n.documents.dropzoneTitle}
            </h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {i18n.documents.dropzoneDesc}
            </p>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                className="gap-1.5"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                <span>{i18n.documents.selectFileButton}</span>
              </Button>
            </div>
          </div>

          {/* File Validation Error */}
          {fileValidationError && (
            <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{fileValidationError}</span>
            </div>
          )}

          {/* Selected File Card */}
          {selectedFile && (
            <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white border border-sky-200 text-sky-700">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull;{" "}
                      {DOCUMENT_TYPE_LABELS[documentType]}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-md p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
                  title="Remove file"
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Upload & Extract Action Button */}
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleUploadAndProcess}
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  className="gap-2"
                >
                  {uploadStatus === "uploading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{i18n.documents.uploadingState}</span>
                    </>
                  ) : uploadStatus === "processing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{i18n.documents.processingState}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      <span>{i18n.documents.uploadButton}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Upload Failure Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <div className="space-y-1">
                <p className="font-semibold">Document processing failed</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {uploadStatus === "completed" && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Document successfully uploaded and clinical data extracted. You may upload
                additional records or proceed to Review.
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/interview"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>&larr; {i18n.navigation.back}</span>
          </Link>

          <Button
            type="button"
            variant="primary"
            onClick={() => router.push("/patient/review")}
            className="gap-2"
          >
            <span>{i18n.documents.proceedReview}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Uploaded Documents & Extracted Findings Section */}
      {uploadedDocs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{i18n.documents.digitizedTitle} ({uploadedDocs.length})</span>
          </h3>

          <div className="space-y-4">
            {uploadedDocs.map((doc) => {
              const extraction = extractions.find((e) => e.documentId === doc.id);

              return (
                <Card key={doc.id} className="border-slate-200 shadow-2xs">
                  <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                        <div>
                          <CardTitle className="text-sm font-semibold text-slate-900">
                            {doc.originalFilename}
                          </CardTitle>
                          <p className="text-[11px] text-slate-500">
                            {DOCUMENT_TYPE_LABELS[doc.documentType]} &bull;{" "}
                            {(doc.fileSizeBytes / 1024).toFixed(1)} KB &bull; Uploaded{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            doc.processingStatus === "completed"
                              ? "success"
                              : doc.processingStatus === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px] capitalize"
                        >
                          {doc.processingStatus}
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDocument(doc.storagePath, doc.id)}
                          className="gap-1 text-[11px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{i18n.documents.viewFile}</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4 text-xs">
                    {/* Patient-Document Relevance Assessment */}
                    {extraction?.patientRelevance && (
                      <div
                        className={`rounded-md p-2.5 border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                          extraction.patientRelevance.status === "verified"
                            ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
                            : extraction.patientRelevance.status === "mismatch"
                            ? "border-rose-300 bg-rose-50/90 text-rose-950"
                            : "border-amber-200 bg-amber-50/70 text-amber-950"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {extraction.patientRelevance.status === "verified" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : extraction.patientRelevance.status === "mismatch" ? (
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          ) : (
                            <FileCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold block text-[11px] uppercase tracking-wider">
                              {extraction.patientRelevance.status === "verified"
                                ? "Patient Identity Verified ✓"
                                : extraction.patientRelevance.status === "mismatch"
                                ? "Patient Identity Mismatch Alert"
                                : "Unverified Document Identity"}
                            </span>
                            <p className="text-[11px] opacity-90 mt-0.5">
                              {extraction.patientRelevance.reasons[0] ||
                                "Relevance status determined from document metadata."}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            extraction.patientRelevance.status === "verified"
                              ? "success"
                              : extraction.patientRelevance.status === "mismatch"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px] uppercase font-mono shrink-0 self-start sm:self-center"
                        >
                          {extraction.patientRelevance.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    )}

                    {/* Facility & Date Metadata */}
                    {extraction && (
                      <div className="flex flex-wrap items-center gap-4 text-slate-600 border-b border-slate-100 pb-3">
                        {extraction.issuingFacilityOrDoctor && (
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>{extraction.issuingFacilityOrDoctor}</span>
                          </div>
                        )}
                        {extraction.extractedDate && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>Report Date: {extraction.extractedDate}</span>
                          </div>
                        )}
                        <Badge variant="outline" className="text-[10px] font-mono text-slate-500">
                          Provider: {extraction.extractionProvider}
                        </Badge>
                      </div>
                    )}

                    {/* Extracted Labs */}
                    {extraction && extraction.extractedLabResults.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Activity className="h-3.5 w-3.5 text-sky-600" />
                          <span>Extracted Laboratory Values</span>
                        </div>
                        <div className="rounded-md border border-slate-200 overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-2">Investigation</th>
                                <th className="p-2">Observed Value</th>
                                <th className="p-2">Reference Range</th>
                                <th className="p-2 text-right">Flag</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {extraction.extractedLabResults.map((lab, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2 font-medium text-slate-800">
                                    {lab.testName}
                                  </td>
                                  <td className="p-2 font-mono font-semibold text-slate-900">
                                    {lab.value} {lab.unit || ""}
                                  </td>
                                  <td className="p-2 text-slate-500">
                                    {lab.referenceRange || "Standard"}
                                  </td>
                                  <td className="p-2 text-right">
                                    {lab.isAbnormal ? (
                                      <Badge variant="destructive" className="text-[10px]">
                                        {lab.flag?.toUpperCase() || "ABNORMAL"}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                                        NORMAL
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Extracted Medications */}
                    {extraction && extraction.extractedMedications.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Pill className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Extracted Prescriptions &amp; Medications</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {extraction.extractedMedications.map((med, idx) => (
                            <div
                              key={idx}
                              className="rounded-md border border-slate-200 bg-slate-50/50 p-2.5 space-y-1"
                            >
                              <p className="font-semibold text-slate-900">{med.name}</p>
                              <p className="text-[11px] text-slate-600">
                                {med.dosage || "Standard Dose"} &bull; {med.frequency || "Daily"}
                              </p>
                              {med.instructions && (
                                <p className="text-[10px] text-slate-500 italic">
                                  {med.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
