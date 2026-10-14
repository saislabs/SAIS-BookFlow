import React, { Suspense } from "react";
import BookingSuccessContent from "./BookingSuccessContent";
import { BUSINESS_CONFIG } from "@/config/business";

export const metadata = {
  title: `Booking Submitted — ${BUSINESS_CONFIG.name}`,
  description: "View your appointment booking reference and actual database status.",
};

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
