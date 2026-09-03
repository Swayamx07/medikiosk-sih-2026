import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description: string;
  action?: React.ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-left shadow-xs",
        className
      )}
      {...props}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex-1 space-y-1">
        <h5 className="text-sm font-semibold text-red-900">{title}</h5>
        <p className="text-sm text-red-700 leading-relaxed">{description}</p>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
