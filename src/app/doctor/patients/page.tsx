import Link from "next/link";
import {
  Users,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Globe,
  Stethoscope,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPhysicianQueueAction } from "@/app/actions/doctor";

function formatTimestamp(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hrs ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return isoStr;
  }
}

export default async function DoctorPatientsQueuePage() {
  const result = await getPhysicianQueueAction();
  const queue = result.queue || [];
  const errorMsg = result.error;

  const emergencyCount = queue.filter((i) => i.priority === "emergency").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-sky-800 border-sky-300 bg-sky-50">
              Live Queue
            </Badge>
            {emergencyCount > 0 && (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                {emergencyCount} Emergency Alert{emergencyCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinical Triage &amp; Intake Queue
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Review structured pre-consultation intake sessions sorted by clinical priority.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/doctor/patients"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh Queue</span>
          </Link>
        </div>
      </div>

      {/* Error state if query failed */}
      {errorMsg && (
        <ErrorState
          title="Database Connection Error"
          description={errorMsg}
        />
      )}

      {/* Main Queue Card */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-700" />
              <CardTitle>Incoming Outpatient Sessions</CardTitle>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Sessions: {queue.length}
            </span>
          </div>
          <CardDescription>
            High-priority safety triggers appear at the top of the queue with visual red-flag markers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {queue.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Outpatient Encounters"
                description="There are currently no active patient intake encounters in the triage queue."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-3">Priority</th>
                    <th scope="col" className="px-6 py-3">Patient / Identifier</th>
                    <th scope="col" className="px-6 py-3">Chief Complaint</th>
                    <th scope="col" className="px-6 py-3">Language &amp; Mode</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {queue.map((item) => {
                    const isEmergency =
                      item.priority === "emergency" || item.hasCriticalRedFlag;

                    return (
                      <tr
                        key={item.sessionId}
                        className={`transition-colors ${
                          isEmergency
                            ? "bg-red-50/40 hover:bg-red-50/70"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* Priority Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEmergency ? (
                            <Badge variant="destructive" className="gap-1 shadow-xs">
                              <AlertTriangle className="h-3 w-3" />
                              Red Flag
                            </Badge>
                          ) : item.priority === "urgent" ? (
                            <Badge variant="warning">Urgent</Badge>
                          ) : (
                            <Badge variant="secondary">Standard</Badge>
                          )}
                        </td>

                        {/* Patient Name & Identifier */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 block">
                            {item.patientName}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.patientIdentifier}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {formatTimestamp(item.startedAt)}
                            </span>
                          </div>
                        </td>

                        {/* Chief Complaint */}
                        <td className="px-6 py-4 text-slate-700 max-w-xs">
                          <p className="line-clamp-2 text-xs leading-relaxed" title={item.chiefComplaint}>
                            {item.chiefComplaint}
                          </p>
                        </td>

                        {/* Language & Mode */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-700">
                              <Globe className="h-3 w-3 text-slate-400" />
                              {item.language}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 capitalize">
                              <Stethoscope className="h-3 w-3 text-slate-400" />
                              {item.mode}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {item.status === "verified" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : isEmergency ? (
                            <span className="font-semibold text-red-700 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                              Triage Alert Triggered
                            </span>
                          ) : (
                            <span className="text-slate-600 capitalize">
                              {item.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>

                        {/* Action Link */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/doctor/patients/${item.sessionId}`}
                            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors ${
                              isEmergency
                                ? "bg-red-700 hover:bg-red-800"
                                : "bg-slate-900 hover:bg-slate-800"
                            }`}
                          >
                            <span>Open Case</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
