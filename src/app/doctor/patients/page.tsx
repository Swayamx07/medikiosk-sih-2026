import Link from "next/link";
import { Users, AlertTriangle, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DoctorPatientsQueuePage() {
  const demoQueue = [
    {
      id: "case-01-acute",
      label: "Demo Case 1 (Priority)",
      chiefComplaint: "Acute chest pain, shortness of breath, sweating",
      priority: "red-flag",
      time: "10 mins ago",
      documents: "None",
      status: "Triage Alert Triggered",
    },
    {
      id: "case-02-chronic",
      label: "Demo Case 2 (Chronic)",
      chiefComplaint: "Follow-up hypertension & diabetes mellitus",
      priority: "normal",
      time: "25 mins ago",
      documents: "Prescription + Lab Report",
      status: "Intake Complete",
    },
    {
      id: "case-03-ayush",
      label: "Demo Case 3 (AYUSH)",
      chiefComplaint: "Chronic digestive disturbance, joint pain",
      priority: "ayush",
      time: "40 mins ago",
      documents: "Previous Ayurveda Rx",
      status: "Pariksha Complete",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Patient Intake Queue
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Clinical Triage &amp; Intake Queue
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Review structured pre-consultation intake sessions sorted by clinical priority.
        </p>
      </div>

      <Card className="border-slate-200 overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-700" />
            <CardTitle>Incoming Outpatient Sessions</CardTitle>
          </div>
          <CardDescription>
            High-priority safety triggers appear at the top of the queue with visual red-flag markers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">Priority</th>
                  <th scope="col" className="px-6 py-3">Patient / Demo Case</th>
                  <th scope="col" className="px-6 py-3">Chief Complaint</th>
                  <th scope="col" className="px-6 py-3">Documents</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {demoQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.priority === "red-flag" && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Red Flag
                        </Badge>
                      )}
                      {item.priority === "normal" && (
                        <Badge variant="secondary">Standard</Badge>
                      )}
                      {item.priority === "ayush" && (
                        <Badge variant="warning">AYUSH</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.label}
                      <span className="block text-xs font-normal text-slate-400 mt-0.5">
                        {item.time}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                      {item.chiefComplaint}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {item.documents}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {item.priority === "red-flag" ? (
                        <span className="font-semibold text-red-600">{item.status}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/doctor/patients/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                      >
                        <span>Open Case</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
