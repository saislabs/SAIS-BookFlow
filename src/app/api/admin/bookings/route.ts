import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { BookingStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as BookingStatus | null;
    const searchParam = searchParams.get("search") || undefined;

    const validStatuses: BookingStatus[] = [
      "Pending",
      "Confirmed",
      "Rejected",
      "Cancelled",
      "Completed",
    ];

    const status =
      statusParam && validStatuses.includes(statusParam) ? statusParam : undefined;

    const bookings = await db.getBookings({ status, search: searchParam });

    // Aggregate summary stats for the dashboard
    const allBookings = await db.getBookings();
    const stats = {
      total: allBookings.length,
      pending: allBookings.filter((b) => b.status === "Pending").length,
      confirmed: allBookings.filter((b) => b.status === "Confirmed").length,
      completed: allBookings.filter((b) => b.status === "Completed").length,
      cancelled: allBookings.filter((b) => b.status === "Cancelled").length,
      rejected: allBookings.filter((b) => b.status === "Rejected").length,
    };

    return NextResponse.json({
      bookings,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load admin bookings" },
      { status: 500 }
    );
  }
}
