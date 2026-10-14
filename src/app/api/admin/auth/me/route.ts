import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@saisbookflow.com";
  return NextResponse.json({
    authenticated: true,
    user: {
      email: adminEmail,
      role: "admin",
    },
  });
}
