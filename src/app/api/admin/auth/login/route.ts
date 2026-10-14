import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { verifyAdminCredentials, ADMIN_COOKIE_NAME, DEMO_ADMIN_TOKEN } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid login credentials", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const isValid = verifyAdminCredentials(email, password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin authenticated successfully",
      user: {
        email,
        role: "admin",
      },
      token: DEMO_ADMIN_TOKEN,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(ADMIN_COOKIE_NAME, DEMO_ADMIN_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Login processing failed" },
      { status: 500 }
    );
  }
}
