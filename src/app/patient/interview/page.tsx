import Link from "next/link";
import { ArrowRight, MessageSquare, Mic, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function PatientInterviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-sky-800 border-sky-300 bg-sky-50">
          Step 5 of 7
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Clinical Interview
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Conversational symptom extraction and adaptive question interface shell.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-sky-600" />
              <CardTitle>Conversational Case Intake</CardTitle>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              Adaptive Engine (Pending Phase 3)
            </Badge>
          </div>
          <CardDescription>
            The patient enters natural language complaints; the engine extracts structured symptoms and formulates non-repetitive clinical questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white text-xs font-bold">
                AI
              </div>
              <div className="rounded-lg bg-white p-3 border border-slate-200 text-sm text-slate-800 shadow-xs max-w-lg">
                <p>Hello. Please describe the primary health concern or symptoms that brought you to the clinic today.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 justify-end">
              <div className="rounded-lg bg-slate-900 p-3 text-sm text-white shadow-xs max-w-lg">
                <p>I have had a severe pain in my chest since yesterday evening with sweating.</p>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">
                You
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Type your response here... (Workflow enabled in Phase 3)"
              disabled
              className="flex-1"
            />
            <Button variant="outline" size="icon" disabled aria-label="Voice input">
              <Mic className="h-4 w-4 text-slate-500" />
            </Button>
            <Button variant="primary" size="icon" disabled aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link
            href="/patient/mode"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back to Mode
          </Link>
          <Link
            href="/patient/documents"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
          >
            <span>Proceed to Step 6: Documents</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
