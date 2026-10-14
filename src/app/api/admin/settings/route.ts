import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { businessHoursItemSchema, blockedPeriodSchema } from "@/lib/validations";
import { z } from "zod";

const settingsPayloadSchema = z.object({
  hours: z.array(businessHoursItemSchema).optional(),
  newBlockedPeriod: blockedPeriodSchema.optional(),
  deleteBlockedPeriodId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const [hours, blockedPeriods] = await Promise.all([
      db.getBusinessHours(),
      db.getBlockedPeriods(),
    ]);

    return NextResponse.json({
      hours,
      blockedPeriods,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load availability settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = settingsPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (parsed.data.hours) {
      await db.updateBusinessHours(parsed.data.hours as any);
    }

    if (parsed.data.newBlockedPeriod) {
      await db.addBlockedPeriod(parsed.data.newBlockedPeriod);
    }

    if (parsed.data.deleteBlockedPeriodId) {
      await db.deleteBlockedPeriod(parsed.data.deleteBlockedPeriodId);
    }

    const [updatedHours, updatedBlocked] = await Promise.all([
      db.getBusinessHours(),
      db.getBlockedPeriods(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Availability settings saved successfully",
      hours: updatedHours,
      blockedPeriods: updatedBlocked,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
