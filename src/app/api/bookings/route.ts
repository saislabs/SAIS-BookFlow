import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingFormSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bookingFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Please fill out all required fields properly.",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    try {
      const { booking } = await db.createBooking(parsed.data);

      return NextResponse.json(
        {
          success: true,
          booking,
          message: "Your booking request has been submitted successfully.",
        },
        { status: 201 }
      );
    } catch (bookingError: any) {
      // Check if slot conflict / concurrency failure
      if (
        bookingError.code === "SLOT_CONFLICT" ||
        bookingError.message?.includes("CONCURRENCY_CONFLICT") ||
        bookingError.message?.includes("no longer available")
      ) {
        return NextResponse.json(
          {
            error: "Conflict",
            code: "SLOT_CONFLICT",
            message:
              "The requested time slot has just been reserved by another client. Please select another time.",
          },
          { status: 409 }
        );
      }

      if (
        bookingError.message?.includes("closed") ||
        bookingError.message?.includes("operating hours") ||
        bookingError.message?.includes("past") ||
        bookingError.message?.includes("blocked")
      ) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: bookingError.message,
          },
          { status: 400 }
        );
      }

      throw bookingError;
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error?.message || "Failed to process booking request",
      },
      { status: 500 }
    );
  }
}
