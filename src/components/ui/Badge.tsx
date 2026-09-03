import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "success"
    | "warning"
    | "info";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "border-transparent bg-slate-900 text-white shadow-sm",
    secondary:
      "border-transparent bg-slate-100 text-slate-800",
    outline:
      "border-slate-300 text-slate-700 bg-transparent",
    destructive:
      "border-red-200 bg-red-50 text-red-700 font-semibold",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 font-medium",
    info:
      "border-sky-200 bg-sky-50 text-sky-800 font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
