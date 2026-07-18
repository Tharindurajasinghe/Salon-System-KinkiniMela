import { cookies } from "next/headers";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";

/** POST /api/auth/logout — clears the auth cookie. */
async function handler() {
  cookies().delete("token");
  return ok(null, "Logged out");
}

export const POST = withErrorHandler(handler);
