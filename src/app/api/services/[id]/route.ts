import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { serviceFormSchema } from "@/lib/validations";

export async function PUT(
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
    const parsed = serviceFormSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await db.updateService(params.id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const success = await db.deleteService(params.id);
    if (!success) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Service deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete service" },
      { status: 500 }
    );
  }
}
