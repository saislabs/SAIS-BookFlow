import React, { Suspense } from "react";
import BookingStatusContent from "./BookingStatusContent";
import { BUSINESS_CONFIG } from "@/config/business";

export const metadata = {
  title: `Check Booking Status — ${BUSINESS_CONFIG.name}`,
  description: "Look up your appointment status and timeline using your reference code.",
};

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      }
    >
      <BookingStatusContent />
    </Suspense>
  );
}
