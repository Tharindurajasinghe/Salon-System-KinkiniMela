import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { requireAdmin, getSession } from "@/lib/auth";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/** GET /api/admin/staff — list all staff (no password hashes). */
async function getHandler() {
  const { error } = requireAdmin();
  if (error) return fail(error, 403);
  await connectDB();
  const staff = await User.find().select("-passwordHash").sort({ createdAt: 1 }).lean();
  return ok(staff);
}

/** POST /api/admin/staff — create admin/cashier. Body: { username, password, role, pageAccess } */
async function postHandler(req) {
  const { error } = requireAdmin();
  if (error) return fail(error, 403);
  await connectDB();

  const { username, password, role, pageAccess } = await req.json();
  if (!username?.trim() || !password) return fail("Username and password are required", 400);
  if (!["admin", "cashier"].includes(role)) return fail("Invalid role", 400);

  const exists = await User.findOne({ username: username.trim() });
  if (exists) return fail("That username is already taken", 409);

  const user = new User({
    username: username.trim(),
    role,
    pageAccess: role === "cashier" ? (pageAccess || []) : [],
    active: true,
  });
  await user.setPassword(password);
  await user.save();

  const safe = user.toObject();
  delete safe.passwordHash;
  return created(safe, "Staff member added");
}

/**
 * PUT /api/admin/staff — update. Body: { id, username?, role?, pageAccess?, active?, password? }
 * Password is only changed when a non-empty value is supplied.
 */
async function putHandler(req) {
  const { error } = requireAdmin();
  if (error) return fail(error, 403);
  await connectDB();

  const { id, username, role, pageAccess, active, password } = await req.json();
  if (!id) return fail("id is required", 400);

  const user = await User.findById(id);
  if (!user) return fail("Staff member not found", 404);

  if (username && username.trim() !== user.username) {
    const clash = await User.findOne({ username: username.trim(), _id: { $ne: id } });
    if (clash) return fail("That username is already taken", 409);
    user.username = username.trim();
  }
  if (role) user.role = role;
  if (role === "admin") user.pageAccess = [];
  else if (Array.isArray(pageAccess)) user.pageAccess = pageAccess;
  if (typeof active === "boolean") {
    // Don't allow deactivating the last active admin.
    if (!active && user.role === "admin") {
      const admins = await User.countDocuments({ role: "admin", active: true, _id: { $ne: id } });
      if (admins === 0) return fail("At least one active admin is required", 400);
    }
    user.active = active;
  }
  if (password) await user.setPassword(password);

  await user.save();
  const safe = user.toObject();
  delete safe.passwordHash;
  return ok(safe, "Staff member updated");
}

/** DELETE /api/admin/staff?id=... — cannot delete yourself or the last admin. */
async function deleteHandler(req) {
  const { error } = requireAdmin();
  if (error) return fail(error, 403);
  await connectDB();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);

  const session = getSession();
  if (session?.id === id) return fail("You cannot delete your own account", 400);

  const user = await User.findById(id);
  if (!user) return fail("Not found", 404);
  if (user.role === "admin") {
    const admins = await User.countDocuments({ role: "admin", _id: { $ne: id } });
    if (admins === 0) return fail("At least one admin is required", 400);
  }

  await User.findByIdAndDelete(id);
  return ok(null, "Staff member removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
