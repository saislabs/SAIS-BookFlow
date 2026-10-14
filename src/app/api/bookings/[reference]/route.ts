import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const ref = params.reference;
    if (!ref) {
      return NextResponse.json(
        { error: "Booking reference is required" },
        { status: 400 }
      );
    }

    const booking = await db.getBookingByReference(ref);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found with this reference" },
        { status: 404 }
      );
    }

    const events = await db.getBookingEvents(booking.id);
    const isAdmin = await isAuthenticatedAdmin(req);

    // If admin, return full booking with notes and unmasked customer contact
    if (isAdmin) {
      return NextResponse.json({
        booking,
        events,
      });
    }

    // For public visitors, mask private contact details for security
    const maskedEmail = booking.customer_email.replace(
      /(.{2})(.*)(@.*)/,
      (_, a, b, c) => `${a}${"*".repeat(Math.max(b.length, 3))}${c}`
    );
    const maskedPhone = booking.customer_phone.replace(
      /(.{3})(.*)(.{2})$/,
      (_, a, b, c) => `${a}${"*".repeat(Math.max(b.length, 3))}${c}`
    );

    const publicBooking = {
      id: booking.id,
      booking_reference: booking.booking_reference,
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status,
      created_at: booking.created_at,
      customer_name: booking.customer_name,
      customer_email: maskedEmail,
      customer_phone: maskedPhone,
      customer_notes: booking.customer_notes,
      service: booking.service,
    };

    return NextResponse.json({
      booking: publicBooking,
      events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve booking" },
      { status: 500 }
    );
  }
}
