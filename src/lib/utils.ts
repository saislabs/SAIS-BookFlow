import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { BUSINESS_CONFIG } from "@/config/business";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(
  amount: number,
  currencySymbol = BUSINESS_CONFIG.currencySymbol
): string {
  return `${currencySymbol}${amount.toFixed(2)}`;
}

/**
 * Generate a clean, human-readable unique booking reference
 * Format: BF-XXXXXX (6 alphanumeric chars excluding ambiguous chars like 0, O, 1, I)
 */
export function generateBookingReference(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "BF-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format ISO datetime string into human readable display string
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = typeof isoString === "string" ? parseISO(isoString) : new Date(isoString);
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  } catch {
    return isoString;
  }
}

/**
 * Format date part only: "Friday, October 24, 2025"
 */
export function formatDate(isoOrDateString: string): string {
  try {
    const date = parseISO(isoOrDateString);
    return format(date, "EEEE, MMMM d, yyyy");
  } catch {
    return isoOrDateString;
  }
}

/**
 * Format time part only: "2:30 PM"
 */
export function formatTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    return format(date, "h:mm a");
  } catch {
    return isoString;
  }
}

/**
 * Format duration in minutes into a friendly string (e.g. "1 hr 30 mins" or "45 mins")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours > 0 && remainingMins > 0) {
    return `${hours} hr ${remainingMins} mins`;
  }
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} mins`;
}

/**
 * Get color styling classes for booking status badges
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Cancelled":
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "Completed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
