import React from "react";
import { cn, getStatusBadgeClass } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "outline" | "teal";
  status?: string;
}

export function Badge({
  className,
  variant = "default",
  status,
  children,
  ...props
}: BadgeProps) {
  let badgeStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border";

  if (variant === "status" && status) {
    badgeStyles = cn(badgeStyles, getStatusBadgeClass(status));
  } else if (variant === "teal") {
    badgeStyles = cn(badgeStyles, "bg-teal-50 text-teal-800 border-teal-200");
  } else if (variant === "outline") {
    badgeStyles = cn(badgeStyles, "bg-white text-slate-700 border-slate-300");
  } else {
    badgeStyles = cn(badgeStyles, "bg-slate-100 text-slate-800 border-slate-200");
  }

  return (
    <span className={cn(badgeStyles, className)} {...props}>
      {children || status}
    </span>
  );
}
