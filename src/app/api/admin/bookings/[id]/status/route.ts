import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { updateStatusSchema } from "@/lib/validations";

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
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status update payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const existing = await db.getBookingById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updated = await db.updateBookingStatus(
      params.id,
      parsed.data.status,
      parsed.data.note
    );

    return NextResponse.json({
      success: true,
      booking: updated,
      message: `Booking has been updated to ${parsed.data.status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update booking status" },
      { status: 500 }
    );
  }
}
