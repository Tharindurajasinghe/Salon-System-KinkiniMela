import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/jwt";
import { isAllowed } from "@/lib/adminNav";

/**
 * Server-side auth helpers for App Router route handlers / server components.
 * These read the httpOnly JWT cookie and decode the staff session.
 */

/** Returns the decoded staff session, or null if not logged in. */
export function getSession() {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Throw-style guard: returns session or an error object the route can check. */
export function requireAuth() {
  const session = getSession();
  if (!session) return { session: null, error: "Not authenticated" };
  return { session, error: null };
}

/** Guard that also requires admin role. */
export function requireAdmin() {
  const session = getSession();
  if (!session) return { session: null, error: "Not authenticated" };
  if (session.role !== "admin") return { session, error: "Admins only" };
  return { session, error: null };
}

/** True if this session may access a given admin page key. Delegates to adminNav. */
export function canAccess(session, pageKey) {
  return isAllowed(session, pageKey);
}
