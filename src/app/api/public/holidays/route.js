import connectDB from "@/lib/db";
import Holiday from "@/lib/models/Holiday";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";

/** GET /api/public/holidays — list of off-day date strings. */
async function handler() {
  await connectDB();
  const holidays = await Holiday.find().select("date note").sort({ date: 1 }).lean();
  return ok(holidays);
}
export const GET = withErrorHandler(handler);
