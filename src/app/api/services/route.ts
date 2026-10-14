import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { serviceFormSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    if (includeInactive) {
      const isAdmin = await isAuthenticatedAdmin(req);
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized: Admin privileges required" },
          { status: 401 }
        );
      }
      const allServices = await db.getServices();
      return NextResponse.json({ services: allServices });
    }

    const activeServices = await db.getActiveServices();
    return NextResponse.json({ services: activeServices });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve services" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = serviceFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const created = await db.createService(parsed.data);
    return NextResponse.json({ service: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create service" },
      { status: 500 }
    );
  }
}
