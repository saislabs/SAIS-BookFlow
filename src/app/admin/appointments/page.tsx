import React, { Suspense } from "react";
import AppointmentsContent from "./AppointmentsContent";

export const metadata = {
  title: "Manage Appointments — BookFlow Admin",
};

export default function AdminAppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
