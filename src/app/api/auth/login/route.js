import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/utils/jwt";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Only admins and cashiers log in. Customers never do.
 * On success sets an httpOnly "token" cookie and returns the safe user info.
 */
async function handler(req) {
  await connectDB();

  const { username, password } = await req.json();

  // ---- Basic validation ----
  if (!username || !password) {
    return fail("Username and password are required", 400);
  }

  const user = await User.findOne({ username: username.trim(), active: true });
  if (!user) return fail("Invalid username or password", 401);

  const valid = await user.verifyPassword(password);
  if (!valid) return fail("Invalid username or password", 401);

  // ---- Issue JWT ----
  const token = signToken({
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    pageAccess: user.pageAccess,
  });

  // httpOnly so JS cannot read it (XSS protection).
  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return ok(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      pageAccess: user.pageAccess,
    },
    "Logged in"
  );
}

export const POST = withErrorHandler(handler);
