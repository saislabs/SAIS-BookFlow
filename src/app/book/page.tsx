import React, { Suspense } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { BUSINESS_CONFIG } from "@/config/business";
import { Calendar, Shield, Sparkles } from "lucide-react";

export const metadata = {
  title: `Book Appointment — ${BUSINESS_CONFIG.name}`,
  description: "Schedule your consultation or service with real-time slot checking.",
};

export default function BookPage() {
  return (
    <div className="py-10 md:py-16 bg-[#FAFAFA] min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>Instant Atomic Confirmation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Schedule an Appointment
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Complete the 4-step wizard below to reserve your dedicated session.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              <p className="mt-3 text-xs text-slate-500">Loading booking portal...</p>
            </div>
          }
        >
          <BookingWizard />
        </Suspense>
      </div>
    </div>
  );
}
