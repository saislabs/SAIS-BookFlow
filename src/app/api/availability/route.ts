import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { availabilityQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const service_id = searchParams.get("service_id");
    const date = searchParams.get("date");

    const parsed = availabilityQuerySchema.safeParse({ service_id, date });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const service = await db.getServiceById(parsed.data.service_id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (!service.is_active) {
      return NextResponse.json(
        { error: "This service is currently inactive and cannot be booked" },
        { status: 400 }
      );
    }

    const availability = await db.getAvailability(
      parsed.data.service_id,
      parsed.data.date
    );

    return NextResponse.json(availability);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to calculate availability" },
      { status: 500 }
    );
  }
}
