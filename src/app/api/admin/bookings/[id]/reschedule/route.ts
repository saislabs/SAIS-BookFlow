import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { rescheduleSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await isAuthenticatedAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = rescheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reschedule request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    try {
      const updated = await db.rescheduleBooking(
        params.id,
        parsed.data.start_time,
        parsed.data.reason
      );

      return NextResponse.json({
        success: true,
        booking: updated,
        message: "Appointment successfully rescheduled.",
      });
    } catch (rescheduleErr: any) {
      if (
        rescheduleErr.code === "SLOT_CONFLICT" ||
        rescheduleErr.message?.includes("CONCURRENCY_CONFLICT") ||
        rescheduleErr.message?.includes("already occupied")
      ) {
        return NextResponse.json(
          {
            error: "Conflict",
            code: "SLOT_CONFLICT",
            message:
              "The requested reschedule slot is already booked or unavailable.",
          },
          { status: 409 }
        );
      }

      if (
        rescheduleErr.message?.includes("closed") ||
        rescheduleErr.message?.includes("operating hours") ||
        rescheduleErr.message?.includes("blocked")
      ) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: rescheduleErr.message,
          },
          { status: 400 }
        );
      }

      throw rescheduleErr;
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to reschedule booking" },
      { status: 500 }
    );
  }
}
