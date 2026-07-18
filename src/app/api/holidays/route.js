import connectDB from "@/lib/db";
import Holiday from "@/lib/models/Holiday";
import { requireAuth, canAccess } from "@/lib/auth";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "calendar")) return { error: "Not allowed", status: 403 };
  return { session };
}

/** GET /api/holidays — all off days. */
async function getHandler() {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();
  const holidays = await Holiday.find().sort({ date: 1 }).lean();
  return ok(holidays);
}

/** POST /api/holidays — { date, note } (set an off day). */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();
  const { date, note } = await req.json();
  if (!date) return fail("date is required", 400);
  const holiday = await Holiday.findOneAndUpdate(
    { date },
    { $set: { note: note || "" } },
    { new: true, upsert: true }
  ).lean();
  return created(holiday, "Off day set");
}

/** DELETE /api/holidays?date=yyyy-MM-dd */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return fail("date is required", 400);
  await Holiday.findOneAndDelete({ date });
  return ok(null, "Off day removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const DELETE = withErrorHandler(deleteHandler);
