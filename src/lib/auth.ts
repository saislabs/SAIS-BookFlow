import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "bookflow_admin_session";
const DEMO_ADMIN_TOKEN = "bookflow_authenticated_admin_session_v1";

export interface AdminUser {
  email: string;
  role: "admin";
}

/**
 * Validate admin credentials
 */
export function verifyAdminCredentials(email: string, pass: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@saisbookflow.com";
  const adminPass = process.env.ADMIN_PASSWORD || "AdminSecurePass2025!";

  return (
    email.trim().toLowerCase() === adminEmail.toLowerCase() &&
    pass === adminPass
  );
}

/**
 * Check if the current request has valid admin credentials
 */
export async function isAuthenticatedAdmin(req?: NextRequest): Promise<boolean> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (sessionCookie === DEMO_ADMIN_TOKEN) {
    return true;
  }

  // Also check Authorization header if present
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader === `Bearer ${DEMO_ADMIN_TOKEN}`) {
      return true;
    }
  }

  return false;
}

export { ADMIN_COOKIE_NAME, DEMO_ADMIN_TOKEN };
